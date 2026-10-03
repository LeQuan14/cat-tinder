import { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <BaseIcon strokeWidth={2.6} {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </BaseIcon>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <BaseIcon fill="currentColor" stroke="none" {...props}>
      <path d="M12 21s-7.5-4.6-9.6-9.4C.9 8.2 3 4.5 6.6 4.5c2 0 3.6 1.1 4.4 2.6h2c.8-1.5 2.4-2.6 4.4-2.6 3.6 0 5.7 3.7 4.2 7.1C19.5 16.4 12 21 12 21Z" />
    </BaseIcon>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
      <path d="M3 21v-5h5" />
    </BaseIcon>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </BaseIcon>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </BaseIcon>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </BaseIcon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 5v14M5 12h14" />
    </BaseIcon>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </BaseIcon>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    </BaseIcon>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <BaseIcon fill="currentColor" stroke="none" {...props}>
      <path d="M12 2l2.2 6.3L20.5 10.5 14.2 12.7 12 19l-2.2-6.3L3.5 10.5l6.3-2.2L12 2Z" />
    </BaseIcon>
  );
}

export function PawIcon(props: IconProps) {
  return (
    <BaseIcon fill="currentColor" stroke="none" {...props}>
      <ellipse cx="5.5" cy="10" rx="2.2" ry="2.8" />
      <ellipse cx="9.5" cy="5.5" rx="2.2" ry="2.8" />
      <ellipse cx="14.5" cy="5.5" rx="2.2" ry="2.8" />
      <ellipse cx="18.5" cy="10" rx="2.2" ry="2.8" />
      <path d="M12 11c-3 0-6.5 4.2-6.5 7 0 2.4 2.2 3 3.6 3 1.2 0 1.9-.6 2.9-.6s1.7.6 2.9.6c1.4 0 3.6-.6 3.6-3 0-2.8-3.5-7-6.5-7Z" />
    </BaseIcon>
  );
}

/** Decorative cat silhouette rendered over gradient portraits. */
export function CatSilhouette(props: IconProps) {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M52 34 L78 70 Q100 62 122 70 L148 34 Q156 30 158 40 L160 96 Q166 112 164 128 Q158 170 100 176 Q42 170 36 128 Q34 112 40 96 L42 40 Q44 30 52 34 Z"
      />
      <ellipse cx="78" cy="118" rx="8" ry="11" fill="rgba(0,0,0,0.28)" />
      <ellipse cx="122" cy="118" rx="8" ry="11" fill="rgba(0,0,0,0.28)" />
      <path d="M93 142 L107 142 L100 150 Z" fill="rgba(0,0,0,0.28)" />
    </svg>
  );
}
