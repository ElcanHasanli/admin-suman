# SuMan Admin — iOS (Capacitor + Xcode)

Admin panel Next.js tətbiqi **Capacitor** ilə iOS native qabığına qoyulur. API production-da qalır: `https://api.suman.khamsacraft.az/api`

## Tələblər

- macOS + **Xcode** 15+ (App Store-dan)
- **Node.js** 20+
- **CocoaPods** (ilk dəfə, Xcode üçün vacib) — **Homebrew ilə** (tövsiyə olunur):

```bash
brew install cocoapods
cd ios/App && pod install && cd ../..
```

`sudo gem install cocoapods` işləmirsə və ya `pod: command not found` görsəniz, yuxarıdakı `brew` üsulunu istifadə edin.

## Quraşdırma (bir dəfə)

```bash
cd admin-suman
npm install
npm run cap:sync          # web build + production API + ios sync
cd ios/App && pod install && cd ../..
```

`cap:sync` həmişə **production API** ilə build edir (`https://api.suman.khamsacraft.az/api`).

## Xcode-da açmaq

```bash
npm run ios
```

və ya:

```bash
npx cap open ios
```

Xcode-da (`ios/App/App.xcworkspace` açılmalıdır — `pod install` sonrası):
1. Sol üstdə target: **App**
2. **Signing & Capabilities** → Team seçin (Apple Developer hesabı)
3. Bundle ID: `az.khamsacraft.suman.admin` (Developer portalda eyni olmalıdır)
4. Simulator və ya real iPhone seçin → **Run** (▶)

## Yenidən build (kod dəyişəndən sonra)

```bash
npm run cap:sync
```

Sonra Xcode-da yenidən Run.

## Production API

Mobil build `.env.production` və default olaraq production API istifadə edir.

Lokal API üçün build əvvəl:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5001/api npm run cap:sync
```

## App Store (sonra)

1. Xcode → Product → Archive
2. Distribute App → App Store Connect
3. `appId`: `az.khamsacraft.suman.admin` (Bundle ID Apple Developer-da eyni olmalıdır)

## Tətbiq ikonu (telefonda görünən şəkil)

### Üsul 1 — Sadə (bir fayl, iOS)

1. **1024×1024 px** PNG hazırlayın (SuMan loqosu, şəffaf fon **olmasın** — App Store tələb edir)
2. Bu faylı əvəz edin:

```
ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png
```

3. Xcode-da: **Product → Clean Build Folder** (`Shift + Cmd + K`)
4. Simulatordan köhnə tətbiqi silin, yenidən **Run**

### Üsul 2 — Avtomatik (iOS + sonra Android)

Layihə kökündə `assets/` qovluğu yaradın:

```
assets/
  icon-only.png    ← 1024×1024, kvadrat
  splash.png       ← istəyə bağlı, açılış ekranı (məs. 2732×2732)
```

Sonra:

```bash
npm install @capacitor/assets --save-dev
npx capacitor-assets generate
npm run cap:sync
```

Bu əmr bütün iOS/Android ölçülərini avtomatik yaradır.

### Xcode ilə (vizual)

1. `App.xcworkspace` açın
2. **App → Assets.xcassets → AppIcon**
3. **1024×1024** slotuna şəklinizi sürükləyin
4. Yenidən build

### Açılış ekranı (splash)

Eyni qovluqda: **Assets.xcassets → Splash** — `splash-*.png` fayllarını öz dizaynınızla əvəz edin.

---

## Push bildirişləri (admin)

Kuryer əməliyyatlarında admin **Android + iOS** cihazlarına bildiriş.

- Hər cihaz ayrı `register`: `platform: "android"` | `"ios"`, `app: "admin"`
- Login → avtomatik; logout → `unregister`
- Tam təlimat: **`docs/PUSH-ADMIN.md`**
- Backend (deploy): **`docs/BACKEND_PUSH.md`**

**Vacib:** Layihədə Firebase faylları yoxdursa push **heç vaxt** işləməz. Addım-addım: **`firebase/README.md`**

| Fayl | Yol |
|------|-----|
| `google-services.json` | `android/app/google-services.json` |
| `GoogleService-Info.plist` | `ios/App/App/GoogleService-Info.plist` |

Firebase Console → Cloud Messaging → iOS üçün **APNs Key (.p8)** yüklənməlidir.

Login sonrası toast: **«Push aktiv (ios|android)»** — yoxdursa səbəb ekranda yazılır (icazə, Firebase, server).

```bash
npm run cap:sync
cd ios/App && pod install   # macOS
```

Xcode: **Signing & Capabilities** → **Push Notifications**. Real telefon (simulyator etibarlı deyil).
TestFlight/App Store üçün `ios/App/App/App.entitlements` içində `aps-environment` → `production`.

---

## Android (APK)

```bash
npm install @capacitor/android
npx cap add android
npm run cap:sync
npx cap open android
```

Android Studio-da **Build → Build Bundle(s) / APK(s) → Build APK(s)**.

### APK-da "Load failed" / login işləmir

**Səbəb:** Web brauzer `https://admin.suman.khamsacraft.az` origin-indən API-yə gedir; APK isə `https://localhost` origin-indən gedir. Backend CORS yalnız admin saytına icazə verirsə, mobil WebView sorğunu bloklayır.

**Həll (frontend — artıq layihədə):** `capacitor.config.ts`-də `CapacitorHttp.enabled: true` — sorğular native HTTP ilə gedir, CORS tətbiq olunmur.

Kod dəyişəndən sonra **mütləq**:

```bash
npm run cap:sync
```

Sonra Android Studio-da **Clean + Rebuild** və APK-nı telefona yenidən quraşdırın.

**Alternativ (backend):** CORS-a əlavə originlər:

- `https://localhost`
- `capacitor://localhost`

**Qeyd:** `npm run build` (cap:sync olmadan) bəzən `.env.local`-dakı `localhost:5001` API-ni build-ə yazır — mobil üçün həmişə `npm run cap:sync` işlədin.
