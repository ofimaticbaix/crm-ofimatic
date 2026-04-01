"use client"

import { useState } from "react"

export default function SentryExamplePage() {
  const [hasSentError, setHasSentError] = useState(false)

  const createError = async () => {
    await fetch("/api/sentry-example-api")
    setHasSentError(true)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', fontFamily: 'system-ui', background: '#0a1628', color: 'white' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Sentry Test Page</h1>
      {hasSentError ? (
        <p style={{ color: '#4ade80' }}>Error enviado a Sentry. Comprueba tu dashboard de Sentry.</p>
      ) : (
        <>
          <p style={{ color: '#9ca3af' }}>Haz clic en el botón para enviar un error de prueba a Sentry</p>
          <button
            onClick={createError}
            style={{ padding: '0.75rem 2rem', borderRadius: '0.75rem', background: '#dc2626', color: 'white', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: '600' }}
          >
            Throw Sample Error
          </button>
        </>
      )}
    </div>
  )
}
