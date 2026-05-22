import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "az.khamsacraft.suman.admin",
  appName: "SuMan Admin",
  webDir: "out",
  ios: {
    contentInset: "automatic",
    allowsLinkPreview: false,
  },
  server: {
    androidScheme: "https",
  },
  plugins: {
    // Native HTTP — WebView CORS blokunu aradan qaldırır (APK/iOS login)
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
