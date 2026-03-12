import Anthropic from '@anthropic-ai/sdk'

function getAnthropicClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })
}

const SYSTEM_PROMPT = `Eres el asistente de IA integrado en el CRM de Ofimatic Baix. Tu nombre es "Asistente CRM".

Tu rol es ayudar a los usuarios del CRM con sus tareas diarias. Puedes ayudar con:

- **Gestionar contactos**: Buscar, organizar y dar consejos sobre la gestion de contactos y leads.
- **Empresas**: Ayudar a entender relaciones entre empresas, sugerir estrategias de cuentas.
- **Oportunidades (Deals)**: Analizar el pipeline de ventas, sugerir proximos pasos, calcular probabilidades.
- **Tareas**: Priorizar tareas, sugerir seguimientos, recordar plazos.
- **Metricas**: Explicar metricas de rendimiento, tendencias y areas de mejora.
- **Seguimientos**: Sugerir cuando y como hacer follow-up con clientes.
- **Estrategia comercial**: Dar consejos sobre ventas, negociacion y gestion de clientes.
- **Uso del CRM**: Explicar funcionalidades y mejores practicas del CRM.

Reglas:
- Responde siempre en espanol.
- Se conciso pero util. No des respuestas excesivamente largas.
- Usa formato Markdown cuando sea apropiado (listas, negritas, etc).
- Si no tienes informacion especifica sobre los datos del CRM del usuario, indica que puedes dar consejos generales.
- Mantente enfocado en temas relacionados con CRM, ventas y gestion comercial.
- Se profesional pero cercano.`

export async function POST(request: Request) {
  try {
    const { messages, workspaceId } = await request.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const anthropicMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }))

    const anthropic = getAnthropicClient()
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT + (workspaceId ? `\n\nWorkspace ID del usuario: ${workspaceId}` : ''),
      messages: anthropicMessages,
    })

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const chunk = event.delta.text
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: chunk })}\n\n`))
            }
          }
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('AI Chat API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
