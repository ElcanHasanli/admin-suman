# Admin tətbiqi — Push (Android + iOS)

Hər platforma **öz FCM tokeni** ilə qeydiyyat olunur. Eyni admin həm Android, həm iPhone istifadə edirsə, hər cihazda ayrıca login → avtomatik `register` — backend hər ikisinə push göndərir.

## Login sonrası (avtomatik)

Tətbiq dashboard açılanda `PushNotificationsSetup` işləyir:

```http
POST https://api.suman.khamsacraft.az/api/devices/register
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Android:**
```json
{
  "token": "<FCM_DEVICE_TOKEN>",
  "platform": "android",
  "app": "admin"
}
```

**iOS:**
```json
{
  "token": "<FCM_DEVICE_TOKEN>",
  "platform": "ios",
  "app": "admin"
}
```

`platform` mütləqdir (`android` | `ios`). Web brauzerdə push qeydiyyatı olunmur.

**Logout** (hər cihaz öz tokeni):
```http
DELETE /api/devices/unregister
{ "token": "<FCM_DEVICE_TOKEN>" }
```

## Firebase (admin)

| Platform | Identifikator |
|----------|----------------|
| Android | `az.khamsacraft.suman.admin` |
| iOS | `az.khamsacraft.suman.admin` |

- Android: `google-services.json` → `android/app/`
- iOS: `GoogleService-Info.plist` + Xcode **Push Notifications**
- Server: `FIREBASE_SERVICE_ACCOUNT_JSON` (backend)

## Bildirişə toxunanda

`data` (hamısı string):

| type | screen | Əlavə |
|------|--------|-------|
| `order_completed` | `orders` | `order_id` |
| `expense_created` | `history` | `expense_id` |
| `order_note` | `orders` | `order_id` |

Kod: `lib/push.ts` → müvafiq `/dashboard/...` səhifəsi.

## Build

```bash
npm run cap:sync
# iOS: cd ios/App && pod install
# Android: npx cap open android
```

Backend deploy: `docs/BACKEND_PUSH.md`
