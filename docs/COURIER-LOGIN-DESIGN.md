# Kuryer paneli — Login səhifəsi (admin ilə eyni dizayn)

Admin login ilə **bire-bir eyni** görünüş. Aşağıdakı kodu birbaşa kopyalayıb istifadə edin. Admin repo-ya baxmağa ehtiyac yoxdur.

**Asılılıqlar:** `lucide-react`, Tailwind CSS, Next.js (`next/image`, `next/navigation`). Öz auth/login funksiyanızı `apiLogin` / `authLogin` yerinə qoşun.

---

## 1. Assetlər

`public/` qovluğuna qoyun:

| Fayl | Nədir |
|------|--------|
| `su-courier.png` | Kuryer loqosu (şəffaf fonlu PNG, böyük) |
| `khamsa-logo.svg` | Aşağıdakı SVG məzmununu eyni adla saxlayın |

### `public/khamsa-logo.svg`

```svg
<?xml version="1.0" encoding="UTF-8"?>
<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1185.7 364.38">
  <defs>
    <style>
      .cls-1 { fill: #004fff; }
      .cls-1, .cls-2 { stroke-width: 0px; }
      .cls-2 { fill: #ff9700; }
    </style>
  </defs>
  <rect class="cls-2" x="397.42" y="49.94" width="92.19" height="40.15" rx="3.3" ry="3.3"/>
  <path class="cls-1" d="m785.26,90.08h-105.59c-3.37,0-4.56,4.43-1.67,6.15.04.02.07.04.11.07,31.29,18.61,57.86,46.22,77.08,79.83,21.1,36.86,33.37,80.95,33.37,128.32,0,4.62-.12,9.21-.35,13.76-.09,1.75-1.55,3.12-3.3,3.12h-35.55c-1.83,0-3.31-1.49-3.3-3.32,0-.62,0-1.25,0-1.88,0-52.88-16.31-101.51-43.63-140-13.76-19.41-30.33-36.24-49.03-49.74,0,0,0,0,0-.02-19.02-13.73-40.25-24.03-62.95-30.07-15.22-4.06-31.1-6.2-47.43-6.2-4.62,0-9.21.17-13.76.51-1.9.14-3.52-1.38-3.52-3.29v-34.08c0-1.82,1.48-3.3,3.3-3.3h256.22c1.82,0,3.3,1.48,3.3,3.3v33.55c0,1.82-1.48,3.3-3.3,3.3Z"/>
  <path class="cls-1" d="m668.43,188.72c0,73.05-60.58,132.28-135.31,132.28-2.72,0-5.43-.08-8.11-.24-12.58-.72-24.71-3.13-36.13-7-48.56-16.41-84.58-59.09-90.28-110.66h0c-.52-4.73-.79-9.53-.79-14.39,0-3.09.11-6.15.32-9.19.12-1.73,1.56-3.08,3.3-3.08h37.28c1.9,0,3.38,1.59,3.29,3.48-.07,1.36-.1,2.72-.1,4.09,0,33.06,18.98,61.82,46.98,76.67,10.88,5.77,23.12,9.44,36.13,10.44,2.4.19,4.83.29,7.28.29,49.91,0,90.38-39.13,90.38-87.4,0-1.37-.03-2.73-.1-4.09-.09-1.89,1.4-3.48,3.29-3.48h38.95c1.74,0,3.18,1.35,3.3,3.08.21,3.04.32,6.1.32,9.19Z"/>
</svg>
```

---

## 2. Login səhifəsi (tam kod)

Öz layihənizdə `app/login/page.tsx` (və ya ekvivalent) kimi saxlayın.  
`apiLogin`, `useAuth`, `router.push` — **öz kuryer auth-unuzla** əvəz edin.

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, KeyRound, Lock, Mail } from 'lucide-react';

// TODO: öz auth importlarınız
// import { login as apiLogin } from '@/lib/api';
// import { useAuth } from '@/context/AuthContext';

const SUPPORT_PHONE = '+994 50 555 62 32';
const SUPPORT_PHONE_TEL = 'tel:+994505556232';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [licenseCode, setLicenseCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  // const { login: authLogin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!licenseCode.trim()) {
      setError('Lisenziya kodu tələb olunur');
      return;
    }

    setLoading(true);
    try {
      // TODO: öz login API
      // const { user, token } = await apiLogin(email.trim(), password, licenseCode);
      // if (user.role !== 'courier') {
      //   setError('Bu panel yalnız kuryer üçündür');
      //   return;
      // }
      // authLogin(user, token);
      // router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş uğursuz oldu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-sky-600 via-sky-700 to-cyan-800 p-4">
      {/* blur */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-white/95 p-5 shadow-2xl backdrop-blur sm:p-8">
        {/* Logo + Premium həll */}
        <div className="mb-5 text-center sm:mb-6">
          <div className="mx-auto flex justify-center">
            <Image
              src="/su-courier.png"
              alt="SuMan Kuryer"
              width={420}
              height={142}
              priority
              className="h-28 w-auto object-contain object-center sm:h-32"
            />
          </div>
          <div className="mt-1.5">
            <div className="mx-auto flex max-w-[280px] items-center gap-3">
              <span
                className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/70 to-amber-600/90"
                aria-hidden
              />
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-700 sm:text-[11px]">
                <span className="text-amber-500" aria-hidden>
                  ◆
                </span>
                Premium həll
                <span className="text-amber-500" aria-hidden>
                  ◆
                </span>
              </span>
              <span
                className="h-px flex-1 bg-gradient-to-l from-transparent via-amber-500/70 to-amber-600/90"
                aria-hidden
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <span className="absolute left-3 top-[38px] z-10 text-slate-400">
              <Mail size={18} />
            </span>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              placeholder="kuryer@firma.az"
              required
            />
          </div>

          <div className="relative">
            <span className="absolute left-3 top-[38px] z-10 text-slate-400">
              <Lock size={18} />
            </span>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] z-10 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Şifrə</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              required
            />
          </div>

          <div className="relative">
            <span className="absolute left-3 top-[38px] z-10 text-slate-400">
              <KeyRound size={18} />
            </span>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Lisenziya kodu
            </label>
            <input
              type="text"
              value={licenseCode}
              onChange={(e) => setLicenseCode(e.target.value.toUpperCase())}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 font-mono text-sm uppercase tracking-wide text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              placeholder="SUMAN-XXXX-XXXX"
              required
              autoComplete="off"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-sky-200 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Gözləyin...' : 'Daxil ol'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400">
          Lisenziya kodu şirkətinizə platform sahibi tərəfindən verilir
        </p>

        <div className="mt-6 flex flex-col items-center gap-2 border-t border-slate-100 pt-5">
          <a
            href="https://khamsacraft.az"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-80 transition hover:opacity-100"
          >
            <Image
              src="/khamsa-logo.svg"
              alt="KhamsaCraft"
              width={140}
              height={43}
              className="h-9 w-auto object-contain"
            />
          </a>
          <a
            href={SUPPORT_PHONE_TEL}
            className="mt-1 text-sm text-slate-500 transition hover:text-sky-600"
          >
            {SUPPORT_PHONE}
          </a>
          <p className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} KhamsaCraft
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## 3. Qısa qaydalar

1. Dizayn **kopya**dır — rəng, spacing, footer strukturunu dəyişməyin.
2. **Premium həll** loqoya yaxın qalsın (`mt-1.5`).
3. Footer sadədir: logo → nömrə → © (əlavə düymə/ikon yox).
4. Role yoxlaması: `courier` (admin yox).
5. Logo faylı: `public/su-courier.png` (öz kuryer loqonuz).

---

## 4. Yoxlama

- [ ] Mavi gradient fon + blur
- [ ] Ağ kart, böyük logo, qızılı Premium həll
- [ ] Email / Şifrə / Lisenziya kodu
- [ ] Daxil ol (sky-600)
- [ ] KhamsaCraft logo + `+994 50 555 62 32` + ©
