// Environment variables with type safety

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`)
  }
  return value
}

function getOptionalEnvVar(key: string, defaultValue = ''): string {
  return process.env[key] || defaultValue
}

export const env = {
  // App
  appUrl: getOptionalEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  nodeEnv: getOptionalEnvVar('NODE_ENV', 'development'),

  // Supabase
  supabase: {
    url: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceRoleKey: getOptionalEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
  },

  // AI Providers
  ai: {
    anthropicApiKey: getOptionalEnvVar('ANTHROPIC_API_KEY'),
    openaiApiKey: getOptionalEnvVar('OPENAI_API_KEY'),
  },

  // Stripe
  stripe: {
    publishableKey: getOptionalEnvVar('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
    secretKey: getOptionalEnvVar('STRIPE_SECRET_KEY'),
    webhookSecret: getOptionalEnvVar('STRIPE_WEBHOOK_SECRET'),
  },

  // Email
  resend: {
    apiKey: getOptionalEnvVar('RESEND_API_KEY'),
  },

  // Jobs
  trigger: {
    apiKey: getOptionalEnvVar('TRIGGER_API_KEY'),
    apiUrl: getOptionalEnvVar('TRIGGER_API_URL'),
  },
} as const

// Type-safe environment check
export function isDevelopment() {
  return env.nodeEnv === 'development'
}

export function isProduction() {
  return env.nodeEnv === 'production'
}
