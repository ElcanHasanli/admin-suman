import Image from 'next/image';

type BrandLogoProps = {
  /** Compact mark for tight headers */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  priority?: boolean;
  /** Center the image when used in hero/login */
  centered?: boolean;
};

const sizes = {
  sm: { width: 200, height: 68, className: 'h-12 w-auto' },
  md: { width: 260, height: 88, className: 'h-16 w-auto' },
  lg: { width: 420, height: 142, className: 'h-28 w-auto sm:h-45' },
} as const;

export function BrandLogo({
  size = 'md',
  className = '',
  priority,
  centered = false,
}: BrandLogoProps) {
  const s = sizes[size];
  return (
    <Image
      src="/su-admin.png"
      alt="SuMan Admin"
      width={s.width}
      height={s.height}
      priority={priority}
      className={`object-contain ${centered ? 'object-center' : 'object-left'} ${s.className} ${className}`.trim()}
    />
  );
}

type KhamsaLogoProps = {
  className?: string;
};

export function KhamsaLogo({ className = '' }: KhamsaLogoProps) {
  return (
    <Image
      src="/khamsa-logo.svg"
      alt="KhamsaCraft"
      width={140}
      height={43}
      className={`h-9 w-auto object-contain opacity-90 ${className}`.trim()}
    />
  );
}
