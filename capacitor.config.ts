import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.ofimaticbaix.crm',
  appName: 'CRM Ofimatic',
  // El WebView carga directamente la app en producción.
  // No necesita un build local; cualquier deploy a Vercel actualiza la app.
  webDir: 'public', // Carpeta mínima — no la usamos porque server.url está activo
  server: {
    url: 'https://crm-ofimaticbaix.vercel.app',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_notification',
      iconColor: '#3b82f6',
      sound: 'beep.wav',
    },
  },
}

export default config
