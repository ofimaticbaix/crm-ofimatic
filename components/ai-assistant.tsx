'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageSquare, X, Send, Sparkles, Loader2, Bot, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/lib/context/workspace-context'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { workspaceId } = useWorkspace()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
    }
    setMessages(prev => [...prev, assistantMessage])

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          workspaceId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader available')

      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break

            try {
              const parsed = JSON.parse(data)
              if (parsed.text) {
                fullText += parsed.text
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantMessage.id ? { ...m, content: fullText } : m
                  )
                )
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMessage.id
            ? { ...m, content: 'Lo siento, hubo un error al procesar tu mensaje. Intenta de nuevo.' }
            : m
        )
      )
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages, workspaceId])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg',
          'bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700',
          'hover:shadow-blue-500/40 hover:shadow-xl hover:scale-105',
          'active:scale-95',
          isOpen && 'shadow-blue-500/50 shadow-xl scale-105'
        )}
        title="Asistente IA (Ctrl+K)"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Sparkles className="w-6 h-6 text-white" />
        )}
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 opacity-0 hover:opacity-20 blur-xl transition-opacity" />
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          className={cn(
            'fixed z-50 flex flex-col transition-all duration-300',
            'bottom-24 right-6 w-[400px] h-[600px]',
            'max-sm:bottom-0 max-sm:right-0 max-sm:left-0 max-sm:top-0 max-sm:w-full max-sm:h-full max-sm:rounded-none',
            'rounded-2xl overflow-hidden',
            'bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl',
            'border border-gray-200/60 dark:border-gray-700/30',
            'shadow-2xl shadow-black/10 dark:shadow-black/30'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/60 dark:border-gray-700/20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Asistente CRM</h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Powered by Claude AI</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800/50 px-2 py-1 rounded-md font-mono">
                Ctrl+K
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/30 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 flex items-center justify-center mb-4 border border-blue-200/50 dark:border-blue-500/20">
                  <MessageSquare className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                </div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Hola! Soy tu asistente CRM
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Puedo ayudarte con contactos, empresas, oportunidades, tareas y metricas. Pregunta lo que necesites.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-2 w-full">
                  {[
                    'Como priorizo mis oportunidades?',
                    'Consejos para seguimiento de leads',
                    'Como mejorar mi tasa de conversion?',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInput(suggestion)
                        setTimeout(() => inputRef.current?.focus(), 0)
                      }}
                      className="text-left text-xs px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700/30 bg-gray-50 dark:bg-gray-800/30 text-gray-600 dark:text-gray-400 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 dark:hover:bg-blue-500/10 dark:hover:border-blue-500/20 dark:hover:text-blue-400 transition-all"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-2.5',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-md'
                      : 'bg-gray-100 dark:bg-gray-800/60 text-gray-800 dark:text-gray-200 rounded-bl-md border border-gray-200/60 dark:border-gray-700/20'
                  )}
                >
                  {message.role === 'assistant' ? (
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1 [&>p+p]:mt-2"
                      dangerouslySetInnerHTML={{
                        __html: message.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">$1</code>')
                          .replace(/\n- /g, '\n<li class="ml-4 list-disc">')
                          .replace(/\n(\d+)\. /g, '\n<li class="ml-4 list-decimal">')
                          .replace(/\n/g, '<br />')
                      }}
                    />
                  ) : (
                    message.content
                  )}
                  {message.role === 'assistant' && message.content === '' && isLoading && (
                    <div className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                      <span className="text-xs text-gray-400">Pensando...</span>
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-200/60 dark:border-gray-700/20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu pregunta..."
                disabled={isLoading}
                className={cn(
                  'flex-1 px-4 py-2.5 rounded-xl text-sm',
                  'bg-gray-100 dark:bg-gray-800/60',
                  'border border-gray-200/60 dark:border-gray-700/30',
                  'text-gray-900 dark:text-white',
                  'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-all'
                )}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className={cn(
                  'p-2.5 rounded-xl transition-all',
                  'bg-gradient-to-br from-blue-500 to-indigo-600',
                  'hover:from-blue-600 hover:to-indigo-700',
                  'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-blue-500 disabled:hover:to-indigo-600',
                  'shadow-sm hover:shadow-md'
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
