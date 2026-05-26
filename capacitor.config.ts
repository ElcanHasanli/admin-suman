/// <reference types="@capgo/capacitor-updater" />

import type { CapacitorConfig } from "@capacitor/cli";

/** Capgo Console → app ID (CLI init sonrası eyni olur) */
const capgoAppId =
  process.env.CAPGO_APP_ID ?? "az.khamsacraft.suman.admin";

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
    CapacitorUpdater: {
      appId: capgoAppId,
      autoUpdate: true,
      defaultChannel: "production",
    },
  },
};

export default config;
