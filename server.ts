import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { asaasService, IS_SANDBOX } from "./server/asaasService";
import { adminDb } from "./server/firebaseAdmin";
import dotenv from "dotenv";
import cors from "cors";
import rateLimit from "express-rate-limit";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rate Limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // limit each IP to 60 requests per windowMs
  message: { error: 'Limite de requisições atingido.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 requests per windowMs
  message: { error: 'Muitos pedidos criados. Aguarde antes de tentar novamente.' },
  standardHeaders: true,
  legacyHeaders: false,
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy if behind a load balancer (e.g., Cloud Run, Vercel, Heroku)
  app.set('trust proxy', 1);

  // CORS Configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  if (process.env.APP_URL) allowedOrigins.push(process.env.APP_URL);
  allowedOrigins.push('http://localhost:3000');
  
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      // Or if the origin is in our allowed list
      // Or if we're in development, just allow it
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('CORS não permitido'));
      }
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }));

  app.use(express.json());

  // Apply general rate limiter to all requests
  app.use(generalLimiter);

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
      asaas_mode: IS_SANDBOX ? 'sandbox' : 'producao',
      ok: !(process.env.NODE_ENV === 'production' && IS_SANDBOX)
    });
  });

  // Apply public limiter to public routes
  app.use('/api/public', publicLimiter);

  // Multi-tenant Store Resolution
  // This could be used to fetch store data before the frontend loads
  app.get("/api/public/store/:slug", async (req, res) => {
    const { slug } = req.params;
    // In a real app, you'd fetch from Firestore here using Firebase Admin SDK
    // For now, we'll return a placeholder or let the frontend handle it via Firebase Client SDK
    res.json({ slug, message: "Store resolution endpoint" });
  });

  // Apply order limiter specifically to order creation
  app.post('/api/public/order', orderLimiter, async (req, res) => {
    try {
      if (!adminDb) {
        throw new Error("Firebase Admin não inicializado. Configure as variáveis de ambiente.");
      }

      const data = req.body;
      
      // Basic validation
      if (!data.resellerId || !data.customerName || !data.customerPhone || !data.items || !data.total) {
        return res.status(400).json({ error: "Dados do pedido incompletos." });
      }

      // Verify if reseller exists and is active
      const resellerDoc = await adminDb.collection("resellers").doc(data.resellerId).get();
      if (!resellerDoc.exists || resellerDoc.data()?.status !== 'active') {
        return res.status(400).json({ error: "Loja indisponível ou inativa." });
      }

      // Check limits (ideally this should use adminDb too, but for simplicity we'll just check the active subscription)
      const subsSnapshot = await adminDb.collection("subscriptions")
        .where("resellerId", "==", data.resellerId)
        .where("status", "==", "active")
        .get();
        
      // In a real app, you'd check the specific plan limits here.
      // For now, we just proceed if they have an active subscription or if it's a free tier.

      // Create the order
      const orderData = {
        ...data,
        status: "pending",
        createdAt: new Date() // Use Node.js Date, Firebase Admin will convert it
      };

      const docRef = await adminDb.collection("orders").add(orderData);
      
      res.status(201).json({ id: docRef.id, message: "Pedido criado com sucesso" });
    } catch (error: any) {
      console.error("Erro ao criar pedido:", error);
      res.status(500).json({ error: error.message || "Erro interno ao criar pedido" });
    }
  });

  // Asaas API Endpoints
  app.post("/api/asaas/customers", async (req, res) => {
    try {
      const { name, email, cpfCnpj, phone, uid } = req.body;
      const customer = await asaasService.createCustomer(name, email, cpfCnpj, phone);
      
      if (adminDb) {
        await adminDb.collection('users').doc(uid).update({
          asaasCustomerId: customer.id
        });
      }
      
      res.json(customer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/asaas/subscriptions", async (req, res) => {
    try {
      const { customerId, value, description, planId, resellerId } = req.body;
      const subscription = await asaasService.createSubscription(customerId, value, description);
      
      const invoiceUrl = await asaasService.getPaymentLink(subscription.id);
      
      if (adminDb) {
        // Create or update subscription in Firestore
        const subsRef = adminDb.collection('subscriptions');
        const snapshot = await subsRef.where('resellerId', '==', resellerId).get();
        
        const subData = {
          resellerId,
          planId,
          asaasCustomerId: customerId,
          asaasSubscriptionId: subscription.id,
          status: "pending",
          paymentProvider: "asaas",
          invoiceUrl,
          createdAt: new Date()
        };

        if (!snapshot.empty) {
          await subsRef.doc(snapshot.docs[0].id).update(subData);
        } else {
          await subsRef.add(subData);
        }
      }
      
      res.json({ subscription, invoiceUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Asaas Webhook
  app.post("/api/webhooks/asaas", async (req, res) => {
    try {
      const { event, payment } = req.body;
      
      if (!adminDb) {
        console.error("Firebase Admin not initialized");
        return res.status(500).send("Firebase Admin not initialized");
      }

      console.log(`Received Asaas webhook: ${event} for payment ${payment?.id}`);

      if (payment && payment.subscription) {
        const subsRef = adminDb.collection('subscriptions');
        const snapshot = await subsRef.where('asaasSubscriptionId', '==', payment.subscription).get();
        
        if (!snapshot.empty) {
          const subDoc = snapshot.docs[0];
          let newStatus = subDoc.data().status;
          
          if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
            newStatus = 'active';
          } else if (event === 'PAYMENT_OVERDUE') {
            newStatus = 'past_due';
          } else if (event === 'PAYMENT_DELETED' || event === 'PAYMENT_REFUNDED') {
            newStatus = 'canceled';
          }

          if (newStatus !== subDoc.data().status || subDoc.data().lastPaymentId !== payment.id) {
            const updateData: any = {
              status: newStatus,
              lastPaymentId: payment.id,
              lastEvent: event,
              updatedAt: new Date()
            };

            if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
              updateData.currentPeriodStart = new Date();
              updateData.currentPeriodEnd = new Date(new Date().setMonth(new Date().getMonth() + 1));
            }

            await subDoc.ref.update(updateData);
            console.log(`Updated subscription ${subDoc.id} status to ${newStatus}`);
          } else {
            console.log(`Event ${event} for payment ${payment.id} already processed or status unchanged.`);
          }
        }
      }

      res.status(200).send("OK");
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(500).send("Webhook Error");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    app.use("*", async (req, res, next) => {
      try {
        const url = req.originalUrl;
        const fs = await import("fs");
        let template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
