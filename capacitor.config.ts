// capacitor.config.ts
// Flugram - Capacitor konfiqurasiyası (Android APK üçün)

import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // Android package adı — Play Store üçün unikal olmalıdır
  appId: "com.flugram.app",
  appName: "Flugram",

  // Next.js `output: 'export'` nəticəsini göstər
  webDir: "out",

  // Canlı reload (development üçün) — istehsalda silin
  server: {
    // url: "http://192.168.1.100:3000",  // ← öz IP-nizi yazın
    cleartext: true, // HTTP-ə icazə (dev only)
  },

  android: {
    // Minimum SDK versiyası
    minSdkVersion: 23, // Android 6.0+
    targetSdkVersion: 34,

    // Status bar rəngi (deep blue)
    backgroundColor: "#1e3a8a",

    // Tam ekran (immersive mode)
    allowMixedContent: true,
  },

  plugins: {
    // Firebase Push Notification (FCM) üçün
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },

    // Klaviatura dəyişdikdə layout-u tənzimlə
    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: true,
    },

    // Statusbar
    StatusBar: {
      style: "dark",
      backgroundColor: "#0f172a",
    },

    // SplashScreen
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0f172a",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
  },
};

export default config;

// ─────────────────────────────────────────────
// QURULUM ADDIMLARI:
// ─────────────────────────────────────────────
//
// 1. npm install
// 2. next.config.js-ə əlavə et:
//    module.exports = { output: 'export', trailingSlash: true }
// 3. npm run export          → /out qovluğu yaranır
// 4. npx cap add android
// 5. npx cap sync android
// 6. npx cap open android    → Android Studio açılır
// 7. Android Studio-da: Build → Generate Signed APK
