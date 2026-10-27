// Ícones lineares simples (SVG inline, sem dependência externa) usados como
// identidade visual padrão da home pública — não são a arte da Sorriso Vital,
// apenas iconografia odontológica genérica usada como referência de estilo.
type IconProps = { className?: string };

export function ToothIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path
        d="M12 3c-2.2 0-3.2 1-4.5 1-1.6 0-2.5 1.4-2.5 3.3 0 2.2.7 4.2 1.3 6.1.5 1.7.9 3.6 1.7 5 .4.7 1 1.6 1.8 1.6s1.1-1 1.3-1.9c.3-1.3.4-3 1.2-3s.9 1.7 1.2 3c.2.9.5 1.9 1.3 1.9s1.4-.9 1.8-1.6c.8-1.4 1.2-3.3 1.7-5 .6-1.9 1.3-3.9 1.3-6.1 0-1.9-.9-3.3-2.5-3.3-1.3 0-2.3-1-4.5-1Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BracesIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path d="M4 9h16" strokeLinecap="round" />
      <path d="M4 15h16" strokeLinecap="round" />
      <circle cx="7" cy="9" r="1.3" />
      <circle cx="12" cy="9" r="1.3" />
      <circle cx="17" cy="9" r="1.3" />
      <circle cx="7" cy="15" r="1.3" />
      <circle cx="12" cy="15" r="1.3" />
      <circle cx="17" cy="15" r="1.3" />
    </svg>
  );
}

export function SparkleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path
        d="M12 3l1.8 4.9L19 9.5l-5.2 1.6L12 16l-1.8-4.9L5 9.5l5.2-1.6L12 3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M19 15l.8 2.1L22 18l-2.2.9L19 21l-.8-2.1L16 18l2.2-.9L19 15Z" strokeLinejoin="round" />
    </svg>
  );
}

export function StethoscopeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path d="M6 4v5a4 4 0 0 0 8 0V4" strokeLinecap="round" />
      <path d="M6 4H4.5M14 4h1.5" strokeLinecap="round" />
      <path d="M10 13v2a5 5 0 0 0 10 0v-1" strokeLinecap="round" />
      <circle cx="20" cy="13" r="1.5" />
    </svg>
  );
}

export const SERVICE_ICONS = [ToothIcon, BracesIcon, SparkleIcon, StethoscopeIcon];
