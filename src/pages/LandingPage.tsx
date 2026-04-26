import { useState, useEffect } from "react";
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
  ArrowRight,
  Star,
  ShieldCheck,
  Zap
} from "lucide-react";

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-orange-100 selection:text-orange-900">
      {/* Top Banner */}
      <div className="hidden sm:block bg-orange-500 text-white text-center py-2.5 px-4">
        <p className="text-sm font-medium">
          Lançamento — comece <strong>grátis por 7 dias</strong>
          <Link to="/register" className="ml-3 underline font-bold">
            Criar conta agora →
          </Link>
        </p>
      </div>

      {/* Navbar */}
      <nav className={`sticky top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50 transition-all duration-300 ${scrolled ? 'shadow-md' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Mostrua Logo" className="h-8 hidden md:block" />
              <img src="/logo.svg" alt="Mostrua Logo" className="h-6 md:hidden" />
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#como-funciona" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Como funciona</a>
              <a href="#planos" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Planos</a>
              <a href="#faq" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">FAQ</a>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="hidden sm:block text-gray-600 font-bold hover:text-blue-600 transition-colors">Entrar</Link>
              <Link to="/register" className="px-6 py-2.5 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/30 hover:scale-105">
                <span className="hidden md:inline">Criar loja grátis</span>
                <span className="md:hidden">Criar loja</span>
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
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-1 text-center lg:text-left"
            >
              <h1 className="text-5xl lg:text-6xl font-black tracking-tight text-gray-900 leading-[1.1] mb-6">
                Sua loja no WhatsApp em 5 minutos.
              </h1>
              <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Catálogo profissional + pedidos organizados. Sem conhecimento técnico.
              </p>
              
              <div className="flex flex-col items-center lg:items-start w-full">
                <Link to="/register" className="w-full sm:w-auto min-h-[56px] px-10 py-4 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/30 hover:scale-105 text-xl flex items-center justify-center gap-2">
                  Criar loja grátis <ArrowRight className="w-5 h-5" />
                </Link>
                <a href="#como-funciona" className="mt-4 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors">
                  ou ver como funciona ↓
                </a>
              </div>
              
              <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm text-gray-600 font-medium">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500"/> Sem cartão de crédito</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500"/> Cancela quando quiser</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500"/> 7 dias grátis</span>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex-1 relative flex justify-center w-full max-w-lg"
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
                      {[
                        { img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80", name: "Camiseta Basic", price: "R$ 49,90" },
                        { img: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&q=80", name: "Camiseta Preta", price: "R$ 59,90" },
                        { img: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&q=80", name: "Camiseta Listrada", price: "R$ 69,90" },
                        { img: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&q=80", name: "Camiseta Branca", price: "R$ 49,90" },
                      ].map((item, i) => (
                        <div key={i} className="bg-white rounded-xl p-2 shadow-sm">
                          <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden">
                            <img src={item.img} alt="Product" className="w-full h-full object-cover" />
                          </div>
                          <p className="text-xs font-medium text-gray-800 line-clamp-1">{item.name}</p>
                          <p className="text-sm font-bold text-blue-600 mt-1">{item.price}</p>
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
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="absolute top-20 -left-6 sm:-left-16 bg-white p-3 pr-5 rounded-2xl shadow-xl border border-gray-100 z-20 flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium leading-tight">📱 Novo pedido!</p>
                  <p className="text-sm font-bold text-gray-900 leading-tight">Camiseta P — R$89,90</p>
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
                  <p className="text-sm font-bold text-gray-900">R$ 1.240,00</p>
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

            <div className="bg-blue-600 p-8 rounded-3xl shadow-xl shadow-blue-600/20 text-white transform md:-translate-y-4 flex flex-col h-full">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-blue-500">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Com a Mostrua</h3>
                </div>
                <ul className="space-y-4 mb-8">
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
              <div className="mt-auto bg-blue-700/50 p-4 rounded-2xl flex items-center gap-3 border border-blue-500/50">
                <img src="https://i.pravatar.cc/100?img=5" alt="Ana Paula" className="w-10 h-10 rounded-full border-2 border-blue-400" />
                <p className="text-sm text-blue-50 font-medium italic">"Fiz R$800 no primeiro mês."<br/><span className="not-italic text-blue-200 text-xs">— Ana Paula, SP</span></p>
              </div>
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
              <div key={i} className="bg-gray-50 p-8 rounded-3xl hover:bg-blue-50 transition-colors group border border-gray-100 relative overflow-hidden flex flex-col h-full">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-blue-600 transition-colors relative z-10">
                  <feature.icon className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 relative z-10">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed relative z-10">{feature.desc}</p>
                <span className="absolute -bottom-4 -right-4 text-8xl font-black text-gray-900 opacity-[0.03] select-none z-0">
                  {`0${i + 1}`}
                </span>
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
            <div className="hidden md:block absolute top-[48px] left-[12%] right-[12%] h-[2px] border-t-2 border-dashed border-blue-500/30 z-0"></div>
            
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
            <p className="text-xl text-gray-600 mb-8">Comece grátis por 7 dias. Cancele quando quiser.</p>
            
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className={`text-sm font-bold ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>Mensal</span>
              <button 
                onClick={() => setIsAnnual(!isAnnual)}
                className="w-16 h-8 bg-blue-600 rounded-full relative shadow-inner p-1 transition-colors"
                aria-label="Alternar para plano anual"
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${isAnnual ? 'translate-x-8' : 'translate-x-0'}`}></div>
              </button>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>Anual</span>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">Economize 30%</span>
              </div>
            </div>
            
            <p className="text-center text-gray-400 text-sm mt-8">
              Criar uma loja com desenvolvedor custa entre <span className="font-bold text-gray-600">R$3.000 e R$8.000</span>.
              Com a Mostrua, você tem uma loja profissional a partir de <span className="font-bold text-orange-500">R$1,15 por dia</span>.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
              {/* Pro Plan */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 flex flex-col h-full lg:h-auto">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Plano PRO</h3>
                <p className="text-gray-500 mb-6 flex-1 lg:flex-none">Ideal para quem está começando a revender.</p>
                <div className="mb-2">
                  <span className="text-5xl font-black text-gray-900">{isAnnual ? 'R$34' : 'R$49'}</span>
                  <span className="text-xl text-gray-500 font-medium">,90/mês</span>
                </div>
                <p className="text-green-600 font-bold text-sm mb-6 bg-green-50 inline-block px-3 py-1 rounded-lg w-max">
                  {isAnnual ? '= R$1,16/dia (menos que um café)' : '= R$1,66/dia'}
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
                  Começar grátis
                </Link>
              </div>

              {/* Premium Plan */}
              <div className="bg-blue-600 p-8 rounded-3xl shadow-xl shadow-blue-600/20 border border-blue-500 flex flex-col h-full relative z-10 transform lg:scale-105">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide uppercase shadow-md">
                  Mais Escolhido
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Plano PREMIUM</h3>
                <p className="text-blue-100 mb-6 flex-1 lg:flex-none">Para quem quer crescer nas vendas e escalar.</p>
                <div className="mb-2">
                  <span className="text-5xl font-black text-white">{isAnnual ? 'R$62' : 'R$89'}</span>
                  <span className="text-xl text-blue-200 font-medium">,90/mês</span>
                </div>
                <p className="text-green-400 font-bold text-sm mb-6 bg-green-500/20 inline-block px-3 py-1 rounded-lg w-max border border-green-400/30">
                  {isAnnual ? '= R$2,09/dia (melhor custo-benefício)' : '= R$3,00/dia'}
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

            {/* Enterprise Plan (Anchor) */}
            <div className="bg-gray-100 p-8 rounded-3xl border border-gray-200 flex flex-col h-full lg:h-auto">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Plano Enterprise</h3>
                <p className="text-gray-500 mb-6 flex-1 lg:flex-none">Para redes de franquias e grandes operações.</p>
                <div className="mb-2">
                  <span className="text-4xl font-black text-gray-900">Sob consulta</span>
                </div>
                <p className="text-gray-400 text-sm mb-6 mt-2">
                  Soluções customizadas
                </p>
                <ul className="space-y-4 mb-8 flex-1">
                  {[
                    "Tudo do Premium",
                    "Múltiplos administradores",
                    "Integração via API",
                    "Gerente de conta dedicado",
                    "Treinamento para equipe"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-600 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-gray-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-white border-2 border-gray-300 text-gray-800 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-colors text-center">
                  Falar com vendas
                </a>
              </div>
          </div>
        </div>
      </section>

      {/* Trust & Benefits Section */}
      <section className="py-24 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-center text-sm font-bold text-blue-600 uppercase tracking-widest mb-4">Por que a Mostrua?</p>
          <h2 className="text-center text-4xl font-black text-gray-900 mb-16">Tudo que você precisa para vender mais,<br className="hidden md:block" /> em um só lugar</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "⚡",
                title: "Pronto em minutos",
                description: "Crie sua loja, adicione seus produtos e comece a vender no mesmo dia. Sem precisar de técnicos ou agências."
              },
              {
                icon: "📲",
                title: "Pedidos direto no WhatsApp",
                description: "Cada pedido chega no seu celular em tempo real. Você negocia, combina o pagamento e entrega do seu jeito."
              },
              {
                icon: "🔒",
                title: "Sem taxas por venda",
                description: "Você paga apenas a mensalidade do plano. Não cobramos comissão por pedido, então todo o lucro é seu."
              },
              {
                icon: "🎨",
                title: "Sua marca, sua identidade",
                description: "Personalize cores, logo e banner da loja. Seus clientes veem a sua marca, não a nossa."
              },
              {
                icon: "📦",
                title: "Catálogo sempre atualizado",
                description: "Novos produtos são adicionados pelos administradores automaticamente. Você foca em vender, não em cadastrar."
              },
              {
                icon: "🆓",
                title: "7 dias grátis para testar",
                description: "Experimente todas as funcionalidades sem compromisso e sem precisar de cartão de crédito."
              }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-start p-6 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <span className="text-3xl mb-4">{item.icon}</span>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
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
                  <div className={`w-6 h-6 rounded-full border-2 border-gray-200 flex items-center justify-center shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-45' : ''}`}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
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
          
          <form className="flex flex-col sm:flex-row max-w-lg mx-auto gap-3 mb-6" onSubmit={(e) => {
            e.preventDefault();
            const email = new FormData(e.currentTarget).get('email');
            window.location.href = `/register?email=${email}`;
          }}>
            <input 
              type="email" 
              name="email"
              placeholder="Seu melhor e-mail" 
              required
              className="flex-1 px-6 py-4 rounded-full text-gray-900 border-2 border-transparent focus:border-blue-300 focus:outline-none placeholder-gray-400 text-lg"
            />
            <button type="submit" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/40 hover:scale-105 text-lg">
              Começar grátis
            </button>
          </form>
          
          <p className="mt-6 text-blue-200 text-sm">Não exigimos cartão de crédito para testar.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Mostrua Logo" className="h-8 brightness-0 invert opacity-80" />
            </div>
            
            <div className="flex flex-wrap justify-center gap-8 text-sm">
              <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
              <a href="#" className="hover:text-white transition-colors">Privacidade</a>
              <a href="#" className="hover:text-white transition-colors">Contato</a>
            </div>
            
            <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 px-4 py-2 rounded-full transition-colors text-sm font-medium">
              <MessageCircle className="w-4 h-4" /> Fale conosco no WhatsApp
            </a>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Mostrua. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
