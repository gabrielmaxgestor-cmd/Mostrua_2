import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { 
  Store, 
  ShoppingBag, 
  Users, 
  Smartphone, 
  CheckCircle2, 
  XCircle, 
  MessageCircle, 
  Link as LinkIcon, 
  TrendingUp, 
  ChevronDown,
  ArrowRight,
  Star,
  ShieldCheck,
  Zap
} from "lucide-react";

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-orange-100 selection:text-orange-900">
      {/* Top Banner */}
      <div className="bg-orange-500 text-white text-center py-2.5 px-4">
        <p className="text-sm font-medium">
          Lançamento — teste grátis por{' '}
          <strong>14 dias</strong> nas primeiras 2 semanas
          (normalmente 7 dias)
          <Link to="/register" className="ml-3 underline font-bold">
            Criar conta agora →
          </Link>
        </p>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Mostrua Logo" className="h-8" />
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#como-funciona" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Como funciona</a>
              <a href="#planos" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Planos</a>
              <a href="#faq" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">FAQ</a>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="hidden sm:block text-gray-600 font-bold hover:text-blue-600 transition-colors">Entrar</Link>
              <Link to="/register" className="px-6 py-2.5 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/30 hover:scale-105">
                Comecar gratis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-gradient-to-b from-blue-50/80 to-transparent -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col items-center text-center gap-16">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl flex flex-col items-center"
            >
              <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-gray-900 leading-[1.1] mb-6">
                Crie sua loja online e venda pelo <span className="text-green-500">WhatsApp</span> em minutos.
              </h1>
              <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                Tenha um catálogo profissional, receba pedidos organizados direto no seu WhatsApp e aumente suas vendas. Tudo isso sem precisar de conhecimentos técnicos.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 w-full">
                <Link to="/register" className="px-8 py-4 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/30 hover:scale-105 text-lg flex items-center justify-center gap-2">
                  Comecar gratis por 7 dias <ArrowRight className="w-5 h-5" />
                </Link>
                <a href="#como-funciona" className="px-8 py-4 bg-white text-gray-800 font-bold rounded-full border-2 border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all text-lg flex items-center justify-center">
                  Ver como funciona
                </a>
              </div>
              <div className="mt-8 flex items-center justify-center gap-4 text-sm text-gray-500 font-medium">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <img key={i} src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" className="w-8 h-8 rounded-full border-2 border-white" />
                  ))}
                </div>
                <p>Junte-se a +2.000 vendedores</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative flex justify-center w-full max-w-lg"
            >
              <div className="relative w-full max-w-[320px] h-[650px] bg-gray-900 rounded-[3rem] border-[8px] border-gray-900 shadow-2xl overflow-hidden z-10">
                <div className="absolute top-0 inset-x-0 h-6 bg-gray-900 z-20 rounded-b-3xl w-40 mx-auto"></div>
                <div className="w-full h-full bg-gray-50 overflow-hidden flex flex-col">
                  <div className="bg-blue-600 p-6 pb-8 text-white">
                    <h3 className="font-bold text-xl">Loja da Maria</h3>
                    <p className="text-blue-100 text-sm">Moda Feminina</p>
                  </div>
                  <div className="flex-1 p-4 -mt-4 bg-gray-50 rounded-t-2xl">
                    <div className="grid grid-cols-2 gap-3">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="bg-white rounded-xl p-2 shadow-sm">
                          <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden">
                            <img src={`https://picsum.photos/seed/${i+50}/200`} alt="Product" className="w-full h-full object-cover" />
                          </div>
                          <p className="text-xs font-medium text-gray-800 line-clamp-1">Vestido Floral</p>
                          <p className="text-sm font-bold text-blue-600 mt-1">R$ 89,90</p>
                          <div className="mt-2 w-full py-1.5 bg-green-500 text-white text-[10px] font-bold rounded-lg text-center">
                            Comprar
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="absolute top-20 -left-4 sm:-left-12 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 z-20 flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Novo pedido via</p>
                  <p className="text-sm font-bold text-gray-900">WhatsApp</p>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute bottom-32 -right-4 sm:-right-8 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 z-20 flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Vendas hoje</p>
                  <p className="text-sm font-bold text-gray-900">R$ 450,00</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-6">Você ainda vende assim hoje?</h2>
            <p className="text-xl text-gray-600">Se você se identifica com os problemas abaixo, você está perdendo dinheiro e tempo todos os dias.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-red-100">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">O jeito antigo</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Envia dezenas de fotos soltas pelo WhatsApp",
                  "Não tem um catálogo organizado com preços",
                  "Perde pedidos no meio das conversas",
                  "Não tem controle de quem são seus clientes",
                  "Não passa credibilidade sem um link próprio"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-600">
                    <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-600 p-8 rounded-3xl shadow-xl shadow-blue-600/20 text-white transform md:-translate-y-4">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-blue-500">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Com a Mostrua</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Sua loja online pronta e profissional",
                  "Catálogos organizados com fotos e preços",
                  "Pedidos chegam formatados no WhatsApp",
                  "Painel completo para gestão de clientes",
                  "Link próprio (ex: sua-loja.com)"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-blue-50">
                    <CheckCircle2 className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-6">Transforme seu WhatsApp em uma máquina de vendas</h2>
            <p className="text-xl text-gray-600">Tudo que você precisa para profissionalizar seu negócio de revenda em um só lugar.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Store, title: "Crie sua loja online", desc: "Tenha uma vitrine digital profissional com a sua marca, cores e logotipo." },
              { icon: ShoppingBag, title: "Use catálogos prontos", desc: "Não perca tempo cadastrando. Use produtos já cadastrados pelo administrador." },
              { icon: MessageCircle, title: "Venda pelo WhatsApp", desc: "O cliente escolhe os produtos e o pedido chega formatado direto no seu zap." },
              { icon: LinkIcon, title: "Tenha seu link próprio", desc: "Compartilhe seu link na bio do Instagram e em grupos de WhatsApp facilmente." },
              { icon: Users, title: "Gestão de Clientes", desc: "Saiba exatamente quem comprou, quando comprou e crie um relacionamento." },
              { icon: TrendingUp, title: "Acompanhe suas vendas", desc: "Dashboard completo com métricas de acessos, pedidos e faturamento." }
            ].map((feature, i) => (
              <div key={i} className="bg-gray-50 p-8 rounded-3xl hover:bg-blue-50 transition-colors group border border-gray-100">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-blue-600 transition-colors">
                  <feature.icon className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="como-funciona" className="py-24 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-black mb-6">Como funciona?</h2>
            <p className="text-xl text-gray-400">Em menos de 5 minutos sua loja estará no ar pronta para receber pedidos.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gray-800 z-0"></div>
            
            {[
              { step: "01", title: "Crie sua conta", desc: "Faça seu cadastro rápido e gratuito na plataforma." },
              { step: "02", title: "Escolha o nicho", desc: "Selecione com quais tipos de produtos você quer trabalhar." },
              { step: "03", title: "Escolha o que vender", desc: "Fotos, descrições e preços base já vêm prontos. Só defina seu lucro e pronto." },
              { step: "04", title: "Compartilhe e venda", desc: "Cole o link na bio do Instagram ou mande no seu grupo do WhatsApp. Os pedidos chegam formatados no seu zap." }
            ].map((item, i) => (
              <div key={i} className="relative z-10 text-center">
                <div className="w-24 h-24 mx-auto bg-gray-800 rounded-full flex items-center justify-center mb-6 border-8 border-gray-900 shadow-xl">
                  <span className="text-3xl font-black text-blue-500">{item.step}</span>
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/30 text-lg">
              Criar minha loja agora <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-6">Planos simples e transparentes</h2>
            <p className="text-xl text-gray-600 mb-2">Comece grátis por 7 dias. Cancele quando quiser.</p>
            <p className="text-center text-gray-400 text-sm mt-3 mb-12">
              Criar uma loja com desenvolvedor custa entre{' '}
              <span className="font-bold text-gray-600">R$3.000 e R$8.000</span>.
              Com a Mostrua, você tem uma loja profissional a partir de{' '}
              <span className="font-bold text-orange-500">R$1,65 por dia</span>.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Pro Plan */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 flex flex-col">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Plano PRO</h3>
                <p className="text-gray-500 mb-6">Ideal para quem está começando a revender.</p>
                <div className="mb-2">
                  <span className="text-5xl font-black text-gray-900">R$49</span>
                  <span className="text-xl text-gray-500 font-medium">,90/mês</span>
                </div>
                <p className="text-gray-500 text-sm mb-6">
                  Menos de <strong className="text-gray-700">R$1,70 por dia</strong> —
                  menos que um cafezinho.
                </p>
                <ul className="space-y-4 mb-8 flex-1">
                  {[
                    "Produtos ilimitados",
                    "1 catálogo ativo",
                    "Link personalizado da loja",
                    "Pedidos via WhatsApp",
                    "Painel de gestão básico"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="w-full py-4 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors text-center shadow-md shadow-orange-500/20">
                  Comecar gratis
                </Link>
              </div>

              {/* Premium Plan */}
              <div className="bg-blue-600 p-8 rounded-3xl shadow-xl shadow-blue-600/20 border border-blue-500 flex flex-col relative transform md:-translate-y-4">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide uppercase">
                  Mais Escolhido
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Plano PREMIUM</h3>
                <p className="text-blue-100 mb-6">Para quem quer crescer nas vendas.</p>
                <div className="mb-2">
                  <span className="text-5xl font-black text-white">R$89</span>
                  <span className="text-xl text-blue-200 font-medium">,90/mês</span>
                </div>
                <p className="text-blue-200 text-sm mb-6">
                  Menos de <strong className="text-white">R$3,00 por dia</strong> para
                  ter uma loja profissional no ar.
                </p>
              <ul className="space-y-3 mb-6 flex-1">
                {/* Features herdadas do PRO */}
                {["Produtos ilimitados", "Link personalizado", "Pedidos via WhatsApp"].map((item, i) => (
                  <li key={`base-${i}`} className="flex items-center gap-3 text-blue-200 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-blue-300 shrink-0 opacity-70" />
                    {item}
                  </li>
                ))}
                
                {/* Divisória */}
                <li className="py-2">
                  <div className="flex items-center gap-2 opacity-80">
                    <div className="flex-1 h-px bg-blue-400/30" />
                    <span className="text-blue-200 text-[11px] font-bold uppercase tracking-widest">
                      + Exclusivo PREMIUM
                    </span>
                    <div className="flex-1 h-px bg-blue-400/30" />
                  </div>
                </li>
                
                {/* Features exclusivas */}
                {[
                  "Catálogos ilimitados",
                  "Relatórios avançados",
                  "CRM de clientes",
                  "Cupons de desconto",
                  "Domínio próprio (.com.br)"
                ].map((item, i) => (
                  <li key={`premium-${i}`} className="flex items-center gap-3 text-white font-medium">
                    <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <blockquote className="border-l-2 border-blue-400 pl-3 mt-2 mb-6">
                <p className="text-blue-100 text-xs italic">
                  "Upgrade para o Premium e meus pedidos dobraram no primeiro mês."
                </p>
                <footer className="text-blue-200 text-[10px] mt-1">— Juliana C., usando há 3 meses</footer>
              </blockquote>
              <Link to="/register" className="w-full py-4 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors text-center shadow-lg shadow-orange-500/30">
                Quero escalar meu negócio
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Section replacing Fake Testimonials */}
      <section className="py-24 bg-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-12 text-center px-4">
          {[
            { number: "7 dias", label: "de teste grátis sem cartão" },
            { number: "5 min", label: "para criar sua loja" },
            { number: "0", label: "produtos para cadastrar" }
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center justify-center">
              <p className="text-5xl font-black text-gray-900 mb-4">{stat.number}</p>
              <p className="text-lg text-gray-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-6">Perguntas Frequentes</h2>
          </div>

          <div className="space-y-4">
            {[
              { q: "Preciso ter CNPJ para criar a loja?", a: "Não! Você pode criar sua loja e começar a vender usando apenas o seu CPF." },
              { q: "Como recebo os pagamentos?", a: "Os pedidos chegam no seu WhatsApp. Você combina o pagamento diretamente com o cliente (Pix, Link de pagamento, Dinheiro na entrega), sem pagar taxas para a nossa plataforma." },
              { q: "Preciso cadastrar os produtos um por um?", a: "Não. A plataforma já possui catálogos prontos criados pelo administrador. Você só precisa escolher quais produtos quer vender e definir o seu preço final." },
              { q: "Posso cancelar a qualquer momento?", a: "Sim. Não temos fidelidade. Você pode cancelar sua assinatura a qualquer momento direto pelo painel." },
              { q: "O cliente precisa baixar algum aplicativo?", a: "Não. O seu cliente acessa a sua loja por um link no navegador do celular ou computador, escolhe os produtos e o pedido é enviado para o seu WhatsApp." }
            ].map((faq, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <button 
                  onClick={() => toggleFaq(i)}
                  className="w-full px-6 py-5 flex items-center justify-between font-bold text-gray-900 text-left hover:bg-gray-50 transition-colors"
                >
                  {faq.q}
                  <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-blue-600 text-center px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
            Comece a vender de forma profissional ainda hoje
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Crie sua conta grátis, monte sua vitrine e receba seu primeiro pedido pelo WhatsApp em minutos.
          </p>
          <Link to="/register" className="inline-flex items-center gap-2 px-10 py-5 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-all shadow-2xl shadow-orange-500/40 hover:scale-105 text-xl">
            Criar minha loja gratis <ArrowRight className="w-6 h-6" />
          </Link>
          <p className="mt-6 text-blue-200 text-sm">Não exigimos cartão de crédito para testar.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 text-center border-t border-gray-800">
        <div className="flex items-center justify-center gap-2 mb-6">
          <img src="/logo.svg" alt="Mostrua Logo" className="h-8 brightness-0 invert opacity-80" />
        </div>
        <p>© {new Date().getFullYear()} Mostrua. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
