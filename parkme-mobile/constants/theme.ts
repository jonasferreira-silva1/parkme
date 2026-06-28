// =============================================================
// THEME — Cores, espaçamentos e tipografia centralizados
// Altere aqui para mudar o visual do app inteiro de uma vez.
// =============================================================

export const Colors = {
  // Fundo
  bgPrimary:   '#0a0e1a',   // Fundo principal (mais escuro)
  bgSecondary: '#111827',   // Cards e painéis
  bgCard:      '#1a2235',   // Cards internos
  bgCardHover: '#1e2a40',

  // Bordas
  border:      '#1e2d45',
  borderLight: '#253450',

  // Textos
  textPrimary:   '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted:     '#64748b',

  // Cores de destaque
  blue:       '#3b82f6',
  blueLight:  '#60a5fa',
  blueDark:   '#2563eb',
  green:      '#10b981',
  greenLight: '#34d399',
  yellow:     '#f59e0b',
  red:        '#ef4444',
  purple:     '#8b5cf6',
  orange:     '#f97316',

  // Status de vagas
  spotFree:     '#10b981',  // Verde = livre
  spotOccupied: '#ef4444',  // Vermelho = ocupado
  spotReserved: '#f59e0b',  // Amarelo = reservado
  spotVip:      '#8b5cf6',  // Roxo = VIP
  spotPcd:      '#3b82f6',  // Azul = PCD

  // Transparências
  overlay: 'rgba(0,0,0,0.7)',
  glass:   'rgba(255,255,255,0.03)',
} as const;

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

export const FontSize = {
  xs:    11,
  sm:    13,
  base:  15,
  md:    17,
  lg:    20,
  xl:    24,
  xxl:   30,
  xxxl:  36,
} as const;

export const Radius = {
  sm:  8,
  md:  12,
  lg:  16,
  full: 999,
} as const;
