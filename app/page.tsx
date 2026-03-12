import Link from 'next/link'
import Image from 'next/image'
import {
  Users,
  TrendingUp,
  Building2,
  UserPlus,
  Plug,
  BarChart3,
  Check,
  ArrowRight,
  Mail,
  Sparkles,
} from 'lucide-react'
import { LandingNavbar } from '@/components/landing-navbar'

const features = [
  {
    icon: Users,
    title: 'Gestión de Contactos',
    description: 'Organiza todos tus contactos y su historial de interacciones en un solo lugar.',
  },
  {
    icon: TrendingUp,
    title: 'Pipeline de Ventas',
    description: 'Visualiza y gestiona tus oportunidades de negocio con pipelines personalizables.',
  },
  {
    icon: Building2,
    title: 'Gestión de Empresas',
    description: 'Administra las empresas, sus relaciones y jerarquías organizativas.',
  },
  {
    icon: UserPlus,
    title: 'Equipo Colaborativo',
    description: 'Invita a tu equipo y trabaja en conjunto con roles y permisos definidos.',
  },
  {
    icon: Plug,
    title: 'API e Integraciones',
    description: 'Conecta con n8n y otras herramientas para automatizar tus procesos.',
  },
  {
    icon: BarChart3,
    title: 'Informes y Métricas',
    description: 'Dashboards con métricas en tiempo real para tomar mejores decisiones.',
  },
]

const plans = [
  {
    name: 'Starter',
    price: '29',
    description: 'Ideal para empezar a gestionar tus clientes.',
    features: ['Hasta 500 contactos', '3 usuarios', 'Pipeline básico', 'Integraciones', 'Soporte email'],
    highlighted: true,
    subject: 'Interesado en plan Starter - CRM Ofimatic',
  },
  {
    name: 'Pro',
    price: '79',
    description: 'Para equipos que necesitan más potencia y automatización.',
    features: [
      'Hasta 5.000 contactos',
      '10 usuarios',
      'Pipeline avanzado',
      'API acceso',
      'Integraciones',
      'Soporte prioritario',
    ],
    highlighted: false,
    subject: 'Interesado en plan Pro - CRM Ofimatic',
  },
  {
    name: 'Enterprise',
    price: '199',
    description: 'Solución completa para grandes equipos.',
    features: [
      'Contactos ilimitados',
      'Usuarios ilimitados',
      'Todo en Pro',
      'Soporte dedicado',
      'Personalización',
    ],
    highlighted: false,
    subject: 'Interesado en plan Enterprise - CRM Ofimatic',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0b14] text-white relative overflow-hidden">
      {/* Background image with overlay - same as login */}
      <div
        className="fixed inset-0 bg-cover bg-center opacity-20 z-0"
        style={{ backgroundImage: 'url(/images/background.png)' }}
      />
      <div className="fixed inset-0 bg-gradient-to-br from-[#0a0b14] via-[#0a0b14]/80 to-[#76b900]/20 z-0" />

      {/* Animated orbs - same as login */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-[#76b900]/15 rounded-full blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-[#76b900]/10 rounded-full blur-[120px] animate-[pulse_10s_ease-in-out_infinite_1s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#76b900]/8 rounded-full blur-[150px] animate-[pulse_12s_ease-in-out_infinite_2s]" />
      </div>

      {/* Grid pattern overlay - same as login */}
      <div
        className="fixed inset-0 opacity-[0.03] z-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        <LandingNavbar />

        {/* Hero */}
        <section className="min-h-screen flex items-center justify-center px-4 pt-16">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-10">
              <Image src="/images/logo.png" alt="Ofimatic Baix" width={64} height={64} className="rounded-xl shadow-2xl shadow-blue-500/20" />
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent tracking-wider">
                  OFIMATIC BAIX
                </span>
                <span className="text-[10px] text-gray-500">CRM Platform</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] mb-8">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-white/70">Plataforma CRM de nueva generación</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6">
              El CRM inteligente{' '}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                para tu negocio
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Gestiona tus clientes, oportunidades y empresas de forma eficiente.
              Todo lo que necesitas para hacer crecer tu negocio, en una sola plataforma.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="group px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-base shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:brightness-110 transition-all duration-300 flex items-center gap-2"
              >
                Empezar ahora
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="mailto:comercial@ofimaticbaix.com?subject=Solicitud de demo - CRM Ofimatic"
                className="px-8 py-3.5 rounded-xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] text-white/80 font-semibold text-base hover:bg-white/[0.06] hover:text-white transition-all duration-300"
              >
                Solicitar demo
              </a>
            </div>

            {/* Feature pills - same style as login */}
            <div className="flex flex-wrap justify-center gap-2 mt-10">
              {['Pipeline visual', 'Contactos ilimitados', 'Métricas en tiempo real', 'Importación masiva'].map((feature) => (
                <span
                  key={feature}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-gray-300"
                >
                  {feature}
                </span>
              ))}
            </div>

            {/* Stats - same style as login */}
            <div className="flex justify-center gap-10 mt-10">
              {[
                { value: '100%', label: 'Privacidad' },
                { value: '<1min', label: 'Setup' },
                { value: '€0', label: 'Para empezar' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="funciones" className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Todo lo que necesitas para{' '}
                <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  vender más
                </span>
              </h2>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                Herramientas potentes diseñadas para equipos de ventas modernos.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group p-6 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 shadow-[0_0_80px_-20px_rgba(59,130,246,0.05)]"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-white/[0.06] flex items-center justify-center mb-4 group-hover:from-blue-500/30 group-hover:to-indigo-500/30 transition-all duration-300">
                    <feature.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Plans */}
        <section id="planes" className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Planes que se adaptan a{' '}
                <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  tu crecimiento
                </span>
              </h2>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                Sin compromisos. Cambia o cancela cuando quieras.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative p-8 rounded-3xl backdrop-blur-2xl border transition-all duration-300 flex flex-col ${
                    plan.highlighted
                      ? 'bg-white/[0.06] border-blue-500/40 shadow-[0_0_80px_-20px_rgba(59,130,246,0.15)] scale-[1.02]'
                      : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12]'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-xs font-semibold shadow-lg shadow-blue-500/25">
                      Recomendado
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
                    <p className="text-gray-500 text-sm mb-4">{plan.description}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">{plan.price}€</span>
                      <span className="text-gray-500 text-sm">/mes</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-3 text-sm text-gray-400">
                        <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={`mailto:comercial@ofimaticbaix.com?subject=${encodeURIComponent(plan.subject)}`}
                    className={`w-full text-center py-3 rounded-xl font-medium text-sm transition-all duration-300 block ${
                      plan.highlighted
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:brightness-110'
                        : 'bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] text-white/80 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    Contactar
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="contacto" className="py-24 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="p-12 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] shadow-[0_0_80px_-20px_rgba(59,130,246,0.1)]">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                ¿Listo para transformar{' '}
                <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  tu negocio
                </span>
                ?
              </h2>
              <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto">
                Empieza hoy y descubre cómo un CRM inteligente puede impulsar tus ventas.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="group px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-base shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:brightness-110 transition-all duration-300 flex items-center gap-2"
                >
                  Empezar gratis
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="mailto:comercial@ofimaticbaix.com?subject=Consulta - CRM Ofimatic"
                  className="px-8 py-3.5 rounded-xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] text-white/80 font-semibold text-base hover:bg-white/[0.06] hover:text-white transition-all duration-300 flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Contactar
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-white/[0.06]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image src="/images/logo.png" alt="Ofimatic Baix" width={24} height={24} className="rounded-md" />
              <span className="text-gray-500 text-sm">
                © 2024 Ofimatic Baix. Todos los derechos reservados.
              </span>
            </div>
            <a
              href="mailto:comercial@ofimaticbaix.com"
              className="text-gray-500 text-sm hover:text-gray-300 transition-colors"
            >
              comercial@ofimaticbaix.com
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}
