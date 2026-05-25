import { Capacitor } from '@capacitor/core';
import {
  PushNotifications,
  type PushNotificationSchema,
  type ActionPerformed,
} from '@capacitor/push-notifications';
import { registerDeviceToken, unregisterDeviceToken } from '@/lib/api';

const STORAGE_KEY = 'admin_fcm_token';

let lastToken: string | null = null;
let listenersAttached = false;

export type PushScreen = 'dashboard' | 'orders' | 'history' | 'customers';
export type PushPlatform = 'android' | 'ios';

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

export function getNativePushPlatform(): PushPlatform | null {
  const p = Capacitor.getPlatform();
  if (p === 'android' || p === 'ios') return p;
  return null;
}

function screenFromData(data?: Record<string, string>): PushScreen {
  const screen = data?.screen?.toLowerCase();
  if (screen === 'orders' || screen === 'history' || screen === 'customers') {
    return screen;
  }
  const type = data?.type?.toLowerCase();
  if (type === 'order_completed' || type === 'order_note') return 'orders';
  if (type === 'expense_created') return 'history';
  return 'dashboard';
}

export function getPathForPushScreen(screen: PushScreen): string {
  switch (screen) {
    case 'orders':
      return '/dashboard/orders';
    case 'history':
      return '/dashboard/history';
    case 'customers':
      return '/dashboard/customers';
    default:
      return '/dashboard';
  }
}

export function getPathFromNotification(
  notification: PushNotificationSchema | ActionPerformed['notification']
): string {
  return getPathForPushScreen(screenFromData(notification.data as Record<string, string>));
}

async function persistAndRegister(token: string, platform: PushPlatform) {
  lastToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, token);
  }
  await registerDeviceToken(token, platform);
}

async function onRegistration(token: string) {
  const platform = getNativePushPlatform();
  if (!platform) return;
  try {
    await persistAndRegister(token, platform);
  } catch {
    /* Backend hazır deyilsə və ya şəbəkə — növbəti açılışda yenidən cəhd */
  }
}

async function attachListeners(onNavigate: (path: string) => void) {
  if (listenersAttached) return;
  listenersAttached = true;

  await PushNotifications.addListener('registration', (ev) => {
    void onRegistration(ev.value);
  });

  await PushNotifications.addListener('registrationError', () => {
    /* Firebase / APNs konfiqurasiya yoxdursa */
  });

  await PushNotifications.addListener('pushNotificationReceived', () => {
    /* Foreground: OS banner */
  });

  await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    onNavigate(getPathFromNotification(action.notification));
  });
}

/** Login sonrası dashboard-da — hər cihaz (android/ios) öz tokenini göndərir */
export async function initPushNotifications(onNavigate: (path: string) => void): Promise<void> {
  if (!isNativeApp() || !getNativePushPlatform()) return;

  await attachListeners(onNavigate);

  let perm = await PushNotifications.checkPermissions();
  if (perm.receive === 'prompt') {
    perm = await PushNotifications.requestPermissions();
  }
  if (perm.receive !== 'granted') return;

  await PushNotifications.register();
}

export async function unregisterPushNotifications(): Promise<void> {
  const token =
    lastToken ||
    (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null);
  if (!token) return;

  try {
    await unregisterDeviceToken(token);
  } catch {
    /* ignore */
  }

  lastToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }

  if (isNativeApp()) {
    try {
      await PushNotifications.removeAllListeners();
    } catch {
      /* ignore */
    }
    listenersAttached = false;
  }
}
