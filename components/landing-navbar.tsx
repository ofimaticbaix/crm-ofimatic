'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'

export function LandingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const scrollTo = (id: string) => {
    setMobileOpen(false)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0a0b14]/80 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/logo.png" alt="CRM Ofimatic" width={36} height={36} className="rounded-lg" />
            <span className="text-white font-semibold text-lg">CRM Ofimatic</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollTo('funciones')}
              className="text-white/70 hover:text-white transition-colors text-sm"
            >
              Funciones
            </button>
            <button
              onClick={() => scrollTo('planes')}
              className="text-white/70 hover:text-white transition-colors text-sm"
            >
              Planes
            </button>
            <button
              onClick={() => scrollTo('contacto')}
              className="text-white/70 hover:text-white transition-colors text-sm"
            >
              Contacto
            </button>
            <Link
              href="/login"
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-blue-500/25"
            >
              Acceder
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-white/70 hover:text-white"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden backdrop-blur-xl bg-[#0a0b14]/95 border-t border-white/10 px-4 py-4 space-y-3">
          <button
            onClick={() => scrollTo('funciones')}
            className="block w-full text-left text-white/70 hover:text-white transition-colors text-sm py-2"
          >
            Funciones
          </button>
          <button
            onClick={() => scrollTo('planes')}
            className="block w-full text-left text-white/70 hover:text-white transition-colors text-sm py-2"
          >
            Planes
          </button>
          <button
            onClick={() => scrollTo('contacto')}
            className="block w-full text-left text-white/70 hover:text-white transition-colors text-sm py-2"
          >
            Contacto
          </button>
          <Link
            href="/login"
            className="block w-full text-center px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium"
          >
            Acceder
          </Link>
        </div>
      )}
    </nav>
  )
}
