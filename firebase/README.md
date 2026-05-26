# Firebase faylları (VACİB — push işləməsi üçün)

Layihədə **bu fayllar yoxdur** — Firebase Console-dan endirib əlavə etməlisiniz.  
Kuryer tətbiqi ilə **eyni Firebase layihəsi** istifadə olunursa, oradakı faylları kopyalaya bilərsiniz (package adı eyni olmalıdır).

## 1. Firebase Console

1. [Firebase Console](https://console.firebase.google.com) → layihə (kuryer ilə eyni)
2. **Android** app əlavə / yoxla: package `az.khamsacraft.suman.admin`
3. **iOS** app əlavə / yoxla: bundle `az.khamsacraft.suman.admin`
4. Cloud Messaging → **APNs Authentication Key** (.p8) yüklənib (iOS üçün)

## 2. Faylları yerləşdirin

| Fayl | Haraya |
|------|--------|
| `google-services.json` | `android/app/google-services.json` |
| `GoogleService-Info.plist` | `ios/App/App/GoogleService-Info.plist` |

**Diqqət:** Kuryer tətbiqinin `google-services.json`-u **işləmir** — orada package `az.khamsacraft.suman.courier` olur. Admin üçün Firebase-də **ayrıca Android app** əlavə edin: package **`az.khamsacraft.suman.admin`**, sonra yeni JSON endirin.

Build xətası:
`No matching client found for package name 'az.khamsacraft.suman.admin'`
→ Firebase-də admin app yoxdur və ya yanlış JSON kopyalanıb.

Android layihəsi yoxdursa:
```bash
npm install @capacitor/android
npx cap add android
# sonra google-services.json əlavə edin
```

iOS: Xcode-da `GoogleService-Info.plist` → target **App** → **Copy Bundle Resources**-da olmalıdır.

## 3. Build

**Android APK:**
```bash
npm run android:apk
# → android/app/build/outputs/apk/debug/app-debug.apk
```

**iOS:**
```bash
npm run cap:sync
cd ios/App && pod install
```

Xcode: **Signing & Capabilities** → **Push Notifications** aktiv.

## 4. Test

1. **Real telefon** (simulyatorda push etibarlı deyil)
2. Admin login → ekranda «Push aktiv (android|ios)» toast
3. Network: `POST /api/devices/register` → 200
4. Kuryer sifariş tamamlayır → admin telefonunda bildiriş

## 5. Problem?

| Simptom | Həll |
|---------|------|
| `No matching client found for package name 'az.khamsacraft.suman.admin'` | Firebase → layihə → **Add app (Android)** → package `az.khamsacraft.suman.admin` → yeni `google-services.json` endir (kuryer faylını kopyalama) |
| «Firebase konfiqurasiya yoxdur» | plist / google-services.json əlavə edin |
| «İcazə verilməyib» | Telefon → SuMan Admin → Bildirişlər → İcazə ver |
| Token var, bildiriş yox | Backend `FIREBASE_SERVICE_ACCOUNT_JSON`, kuryer hadisəsi, `device_tokens` cədvəli |
| Brauzerdə test | Push **yalnız APK/iOS**-da işləyir |
