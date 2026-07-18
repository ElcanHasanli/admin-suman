'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, KeyRound, Lock, Mail } from 'lucide-react';
import { login as apiLogin } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { BrandLogo, KhamsaLogo } from '@/components/brand/BrandLogo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

/** Əlaqə nömrəsi — dəyişmək üçün buranı yeniləyin */
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
  const { login: authLogin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!licenseCode.trim()) {
      setError('Lisenziya kodu tələb olunur');
      return;
    }

    setLoading(true);

    try {
      const { user, token } = await apiLogin(email.trim(), password, licenseCode);

      if (user.role !== 'admin') {
        setError('Bu panel yalnız admin üçündür');
        return;
      }

      authLogin(user, token);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş uğursuz oldu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-sky-600 via-sky-700 to-cyan-800 p-4">
      <BgBlur />
      <LoginCard>
        <LoginBrand />
        <form onSubmit={handleSubmit} className="space-y-4">
          <LoginField icon={<Mail size={18} />}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              placeholder="admin@firma.az"
              required
            />
          </LoginField>
          <LoginField
            icon={<Lock size={18} />}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          >
            <Input
              label="Şifrə"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10"
              required
            />
          </LoginField>
          <LoginField icon={<KeyRound size={18} />}>
            <Input
              label="Lisenziya kodu"
              type="text"
              value={licenseCode}
              onChange={(e) => setLicenseCode(e.target.value.toUpperCase())}
              className="pl-10 font-mono uppercase tracking-wide"
              placeholder="SUMAN-XXXX-XXXX"
              required
              autoComplete="off"
            />
          </LoginField>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
          <Button type="submit" loading={loading} className="w-full">
            Daxil ol
          </Button>
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
            <KhamsaLogo className="h-7" />
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
      </LoginCard>
    </div>
  );
}

function BgBlur() {
  return (
    <>
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
    </>
  );
}

function LoginCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-white/95 p-5 shadow-2xl backdrop-blur sm:p-8">
      {children}
    </div>
  );
}

function LoginBrand() {
  return (
    <div className="mb-5 text-center sm:mb-6">
      <div className="mx-auto flex justify-center">
        <BrandLogo size="lg" priority centered />
      </div>
      <div className="mt-1.5">
        <PremiumBadge />
      </div>
    </div>
  );
}

function PremiumBadge() {
  return (
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
  );
}

function LoginField({
  children,
  icon,
  trailing,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-[38px] z-10 text-slate-400">{icon}</span>
      {children}
      {trailing}
    </div>
  );
}
