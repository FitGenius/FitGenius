import { Dumbbell, Users, Target, BarChart3, Star, Shield } from 'lucide-react';
import { LogoWithText } from '@/components/Logo';
import { CheckoutButton } from '@/components/ui/CheckoutButton';

export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background)',
      color: 'var(--foreground)',
      fontFamily: 'var(--font-sans)'
    }}>
      {/* Header */}
      <header className="glass sticky top-0 z-50" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <LogoWithText />
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-400 hover:text-white transition-colors">
                Recursos
              </a>
              <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">
                Preços
              </a>
              <a href="#contact" className="text-gray-400 hover:text-white transition-colors">
                Contato
              </a>
            </div>
            <div className="flex items-center gap-4">
              <a href="/auth/signin" className="btn-ghost">
                Entrar
              </a>
              <a href="/auth/signup" className="btn-primary">
                Começar Grátis
              </a>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-7xl font-bold mb-6">
              A Plataforma <span className="gradient-text">Premium</span> para
              <br />
              Profissionais da Saúde
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Gerencie treinos, dietas e clientes com elegância. Uma solução completa
              para personal trainers, nutricionistas e profissionais do esporte.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/auth/signup" className="btn-primary text-lg px-8 py-4">
                Teste Gratuito por 14 Dias
              </a>
              <a href="/dashboard/professional" className="btn-outline text-lg px-8 py-4">
                Ver Demonstração
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ background: 'var(--background-secondary)', padding: '80px 24px' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold mb-4">
              Recursos <span className="gradient-text">Profissionais</span>
            </h3>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Tudo que você precisa para oferecer o melhor atendimento aos seus clientes
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card-gold text-center group hover:scale-105 transition-transform duration-300" style={{ padding: '32px' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                   style={{ background: 'color-mix(in srgb, var(--gold) 10%, transparent)' }}>
                <Dumbbell size={32} style={{ color: 'var(--gold)' }} />
              </div>
              <h4 className="text-xl font-semibold mb-4">Prescrição de Treinos</h4>
              <p className="text-gray-400">
                Crie treinos personalizados com biblioteca de exercícios, vídeos e progressões automáticas.
              </p>
            </div>

            <div className="card-gold text-center group hover:scale-105 transition-transform duration-300" style={{ padding: '32px' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                   style={{ background: 'color-mix(in srgb, var(--gold) 10%, transparent)' }}>
                <Target size={32} style={{ color: 'var(--gold)' }} />
              </div>
              <h4 className="text-xl font-semibold mb-4">Planos Nutricionais</h4>
              <p className="text-gray-400">
                Monte dietas completas com base TACO, cálculo automático de macros e listas de compras.
              </p>
            </div>

            <div className="card-gold text-center group hover:scale-105 transition-transform duration-300" style={{ padding: '32px' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                   style={{ background: 'color-mix(in srgb, var(--gold) 10%, transparent)' }}>
                <Users size={32} style={{ color: 'var(--gold)' }} />
              </div>
              <h4 className="text-xl font-semibold mb-4">Gestão de Clientes</h4>
              <p className="text-gray-400">
                Acompanhe a evolução, avaliações físicas e comunicação direta com seus clientes.
              </p>
            </div>

            <div className="card-gold text-center group hover:scale-105 transition-transform duration-300" style={{ padding: '32px' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                   style={{ background: 'color-mix(in srgb, var(--gold) 10%, transparent)' }}>
                <BarChart3 size={32} style={{ color: 'var(--gold)' }} />
              </div>
              <h4 className="text-xl font-semibold mb-4">Analytics Avançado</h4>
              <p className="text-gray-400">
                Relatórios detalhados de progresso, aderência e resultados dos seus clientes.
              </p>
            </div>

            <div className="card-gold text-center group hover:scale-105 transition-transform duration-300" style={{ padding: '32px' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                   style={{ background: 'color-mix(in srgb, var(--gold) 10%, transparent)' }}>
                <Shield size={32} style={{ color: 'var(--gold)' }} />
              </div>
              <h4 className="text-xl font-semibold mb-4">Conformidade LGPD</h4>
              <p className="text-gray-400">
                Segurança máxima para dados de saúde com criptografia e compliance total.
              </p>
            </div>

            <div className="card-gold text-center group hover:scale-105 transition-transform duration-300" style={{ padding: '32px' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                   style={{ background: 'color-mix(in srgb, var(--gold) 10%, transparent)' }}>
                <Star size={32} style={{ color: 'var(--gold)' }} />
              </div>
              <h4 className="text-xl font-semibold mb-4">Gamificação</h4>
              <p className="text-gray-400">
                Sistema de conquistas e pontuação para motivar seus clientes na jornada.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="metric-card">
              <div className="gradient-text text-4xl font-bold mb-2">10K+</div>
              <div className="text-gray-400">Profissionais Ativos</div>
            </div>
            <div className="metric-card">
              <div className="gradient-text text-4xl font-bold mb-2">50K+</div>
              <div className="text-gray-400">Clientes Atendidos</div>
            </div>
            <div className="metric-card">
              <div className="gradient-text text-4xl font-bold mb-2">1M+</div>
              <div className="text-gray-400">Treinos Registrados</div>
            </div>
            <div className="metric-card">
              <div className="gradient-text text-4xl font-bold mb-2">99.9%</div>
              <div className="text-gray-400">Uptime Garantido</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ background: 'var(--background-secondary)', padding: '80px 24px' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold mb-4">
              Planos <span className="gradient-text">Transparentes</span>
            </h3>
            <p className="text-xl text-gray-400">
              Escolha o plano ideal para seu negócio
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="card" style={{ padding: '32px' }}>
              <div className="text-center mb-8">
                <h4 className="text-2xl font-bold mb-2">Gratuito</h4>
                <div className="text-4xl font-bold mb-4">R$ 0<span className="text-lg text-gray-400">/mês</span></div>
                <p className="text-gray-400">Perfeito para começar</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-3" style={{ background: 'var(--gold)' }}></div>
                  Até 3 clientes ativos
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-3" style={{ background: 'var(--gold)' }}></div>
                  Biblioteca básica de exercícios
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-3" style={{ background: 'var(--gold)' }}></div>
                  Planos alimentares simples
                </li>
              </ul>
              <a href="/auth/signup" className="btn-outline w-full text-center">Começar Grátis</a>
            </div>

            {/* Pro Plan */}
            <div className="card-gold relative" style={{ padding: '32px', transform: 'scale(1.05)' }}>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="badge-gold px-4 py-1">Mais Popular</span>
              </div>
              <div className="text-center mb-8">
                <h4 className="text-2xl font-bold mb-2">Professional</h4>
                <div className="text-4xl font-bold mb-4">R$ 97<span className="text-lg text-gray-400">/mês</span></div>
                <p className="text-gray-400">Para profissionais sérios</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-3" style={{ background: 'var(--gold)' }}></div>
                  Clientes ilimitados
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-3" style={{ background: 'var(--gold)' }}></div>
                  Biblioteca completa + vídeos
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-3" style={{ background: 'var(--gold)' }}></div>
                  Analytics avançado
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-3" style={{ background: 'var(--gold)' }}></div>
                  Controle financeiro
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-3" style={{ background: 'var(--gold)' }}></div>
                  Suporte prioritário
                </li>
              </ul>
              <CheckoutButton planType="PROFESSIONAL" className="btn-primary w-full text-center">
                Teste 14 Dias Grátis
              </CheckoutButton>
            </div>

            {/* Enterprise Plan */}
            <div className="card" style={{ padding: '32px' }}>
              <div className="text-center mb-8">
                <h4 className="text-2xl font-bold mb-2">Enterprise</h4>
                <div className="text-4xl font-bold mb-4">R$ 197<span className="text-lg text-gray-400">/mês</span></div>
                <p className="text-gray-400">Para grandes negócios</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-3" style={{ background: 'var(--gold)' }}></div>
                  Tudo do Professional
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-3" style={{ background: 'var(--gold)' }}></div>
                  API personalizada
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-3" style={{ background: 'var(--gold)' }}></div>
                  White label
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-3" style={{ background: 'var(--gold)' }}></div>
                  Suporte dedicado
                </li>
              </ul>
              <CheckoutButton planType="ENTERPRISE" className="btn-outline w-full">
                Falar com Vendas
              </CheckoutButton>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-4xl font-bold mb-6">
            Pronto para <span className="gradient-text">Revolucionar</span> seu Negócio?
          </h3>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de profissionais que já transformaram sua prática com o FitGenius.
          </p>
          <a href="/auth/signup" className="btn-primary text-lg px-8 py-4">
            Começar Teste Gratuito Agora
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="card py-12 px-6" style={{ borderTop: '1px solid var(--border)', background: 'var(--background-card)', borderRadius: 0 }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center mb-8">
            <Dumbbell size={32} style={{ color: 'var(--gold)', marginRight: '8px' }} />
            <span className="gradient-text text-2xl font-bold">FitGenius</span>
          </div>
          <div className="text-center text-gray-400">
            <p>&copy; 2024 FitGenius. Todos os direitos reservados.</p>
            <p className="mt-2">Feito com ❤️ para profissionais da saúde no Brasil.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
