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
    CapacitorHttp: {
      enabled: true,
    },
    FirebaseMessaging: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
