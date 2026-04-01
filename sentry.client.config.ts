import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: "https://832dba4c5e5b437e8997baa251738d67@o4511146974838784.ingest.de.sentry.io/4511146996662352",
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration(),
  ],
})
