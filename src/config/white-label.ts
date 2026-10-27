/**
 * Configuração white-label — ponto único para personalizar o produto.
 *
 * Altere este arquivo para trocar nome, cores, logo e contatos do sistema.
 * Usado pelo Tailwind (classes `bg-navy`, `bg-primary`, `bg-mint`, ...), pelas
 * telas do painel/login/página inicial e como padrão para clínicas que ainda
 * não personalizaram a própria identidade em Administração > Identidade visual
 * (o que cada clínica salva no banco tem prioridade sobre estes valores).
 *
 * Importado também por `tailwind.config.ts`: use só valores literais aqui,
 * sem imports com alias "@/".
 */
export const whiteLabel = {
  /** Nome do produto (aba do navegador, login, rodapé, página inicial). */
  productName: "Odonto SaaS",
  productTagline: "Gestão e agendamento online para clínicas odontológicas",
  productDescription:
    "Cada clínica ganha seu site de agendamento e um painel completo para a equipe.",

  /** Logo do produto (login/página inicial). `null` usa o ícone de dente padrão.
   *  Aceita URL http(s) ou arquivo em /public, ex: "/images/logo.svg". */
  logoUrl: null as string | null,

  /** Paleta em hexadecimal (#RRGGBB). */
  colors: {
    /** Cor principal: menus, botões fortes, rodapé. */
    primary: "#0A2B4E",
    /** Cor secundária: botões de ação, links, destaques. */
    secondary: "#007A8A",
    /** Cor de destaque: detalhes, ícones, barras de progresso. */
    accent: "#3BBEB8",
  },

  /** Cores sugeridas para diferenciar profissionais na agenda. */
  dentistColors: ["#007A8A", "#7C3AED", "#EA580C", "#2563EB", "#DB2777", "#16A34A"],

  /** Contato comercial do produto (página inicial). Deixe "" para ocultar. */
  contact: {
    email: "",
    phone: "",
    whatsapp: "",
  },

  /** Textos padrão das clínicas. */
  defaults: {
    ctaText: "Agende sua Consulta",
    slotDurationMinutes: 30,
  },

  /** Clínica exibida como demonstração na página inicial e no login.
   *  `null` remove os atalhos e o quadro de credenciais de demonstração. */
  demo: {
    clinicSlug: "sorriso-pleno" as string | null,
    showCredentialsOnLogin: true,
  },
};

type ClinicColors = {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
};

/** Cores efetivas de uma clínica: as dela, ou as do white-label. */
export function brandColors(clinic?: ClinicColors | null) {
  return {
    primary: clinic?.primaryColor || whiteLabel.colors.primary,
    secondary: clinic?.secondaryColor || whiteLabel.colors.secondary,
    accent: clinic?.accentColor || whiteLabel.colors.accent,
  };
}
