"use client"

import * as Sentry from "@sentry/nextjs"

export default function SentryExamplePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Sentry Test Page</h1>
      <p style={{ color: '#666' }}>Haz clic en el botón para enviar un error de prueba a Sentry</p>
      <button
        onClick={() => {
          Sentry.captureException(new Error("Sentry test error from CRM Ofimatic"))
          alert("Error enviado a Sentry!")
        }}
        style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', background: '#dc2626', color: 'white', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
      >
        Enviar Error de Prueba
      </button>
    </div>
  )
}
