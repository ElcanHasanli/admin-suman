import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { registerDeviceToken, unregisterDeviceToken } from '@/lib/api';

const STORAGE_KEY = 'admin_fcm_token';

let lastToken: string | null = null;
let listenersAttached = false;

export type PushScreen = 'dashboard' | 'orders' | 'history' | 'customers';
export type PushPlatform = 'android' | 'ios';

export type PushInitResult =
  | { ok: true; token: string; platform: PushPlatform }
  | { ok: false; reason: string };

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

function getPathFromNotificationData(data?: Record<string, unknown>): string {
  const normalized: Record<string, string> = {};
  if (data) {
    for (const [k, v] of Object.entries(data)) {
      normalized[k] = String(v);
    }
  }
  return getPathForPushScreen(screenFromData(normalized));
}

async function persistAndRegister(token: string, platform: PushPlatform) {
  lastToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, token);
  }
  await registerDeviceToken(token, platform);
}

async function attachListeners(onNavigate: (path: string) => void) {
  if (listenersAttached) return;
  listenersAttached = true;

  await FirebaseMessaging.addListener('tokenReceived', (event) => {
    const platform = getNativePushPlatform();
    if (!platform || !event.token) return;
    void persistAndRegister(event.token, platform);
  });

  await FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
    const data = event.notification?.data as Record<string, unknown> | undefined;
    onNavigate(getPathFromNotificationData(data));
  });
}

/** Login sonrası — FCM token (Android + iOS eyni format) */
export async function initPushNotifications(
  onNavigate: (path: string) => void
): Promise<PushInitResult> {
  if (!isNativeApp()) {
    return { ok: false, reason: 'Push yalnız mobil APK/iOS-da işləyir (brauzerdə yox)' };
  }

  const platform = getNativePushPlatform();
  if (!platform) {
    return { ok: false, reason: 'Platform dəstəklənmir' };
  }

  try {
    await attachListeners(onNavigate);

    let perm = await FirebaseMessaging.checkPermissions();
    if (perm.receive === 'prompt' || perm.receive === 'denied') {
      perm = await FirebaseMessaging.requestPermissions();
    }
    if (perm.receive !== 'granted') {
      return { ok: false, reason: 'Bildiriş icazəsi verilməyib (Telefon Ayarları)' };
    }

    const { token } = await FirebaseMessaging.getToken();
    if (!token) {
      return {
        ok: false,
        reason:
          'FCM token alınmadı. Firebase faylları (google-services.json / GoogleService-Info.plist) yoxdur?',
      };
    }

    await persistAndRegister(token, platform);
    return { ok: true, token, platform };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/google-services|GoogleService|Firebase|plist|not found/i.test(msg)) {
      return {
        ok: false,
        reason: 'Firebase konfiqurasiya yoxdur — firebase/README.md oxuyun',
      };
    }
    return { ok: false, reason: msg || 'Push quraşdırılmadı' };
  }
}

export async function unregisterPushNotifications(): Promise<void> {
  const token =
    lastToken ||
    (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null);

  if (isNativeApp()) {
    try {
      await FirebaseMessaging.deleteToken();
      await FirebaseMessaging.removeAllListeners();
    } catch {
      /* ignore */
    }
    listenersAttached = false;
  }

  if (token) {
    try {
      await unregisterDeviceToken(token);
    } catch {
      /* ignore */
    }
  }

  lastToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}
