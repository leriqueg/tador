/**
 * TADOR design tokens — canonical values from
 * specs/foundation/mockup/stitch/DESIGN.md
 *
 * Use these for programmatic access (charts, Storybook, tests).
 * CSS utilities are generated in src/globals.css from the same source.
 */

export const DESIGN_SPEC_PATH = 'specs/foundation/mockup/stitch/DESIGN.md';

export const colors = {
  surface: '#fdf8f5',
  surfaceDim: '#ded9d6',
  surfaceBright: '#fdf8f5',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f8f3f0',
  surfaceContainer: '#f2edea',
  surfaceContainerHigh: '#ece7e4',
  surfaceContainerHighest: '#e6e2df',
  onSurface: '#1c1b1a',
  onSurfaceVariant: '#3e4949',
  inverseSurface: '#32302e',
  inverseOnSurface: '#f5f0ed',
  outline: '#6e7979',
  outlineVariant: '#bdc9c8',
  surfaceTint: '#006a6a',
  primary: '#006565',
  onPrimary: '#ffffff',
  primaryContainer: '#008080',
  onPrimaryContainer: '#e3fffe',
  inversePrimary: '#76d6d5',
  secondary: '#8d4f11',
  onSecondary: '#ffffff',
  secondaryContainer: '#feac67',
  onSecondaryContainer: '#773e00',
  tertiary: '#9e380d',
  onTertiary: '#ffffff',
  tertiaryContainer: '#bf5025',
  onTertiaryContainer: '#fff8f6',
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  primaryFixed: '#93f2f2',
  primaryFixedDim: '#76d6d5',
  onPrimaryFixed: '#002020',
  onPrimaryFixedVariant: '#004f4f',
  secondaryFixed: '#ffdcc3',
  secondaryFixedDim: '#ffb77d',
  onSecondaryFixed: '#2f1500',
  onSecondaryFixedVariant: '#6e3900',
  tertiaryFixed: '#ffdbcf',
  tertiaryFixedDim: '#ffb59c',
  onTertiaryFixed: '#380c00',
  onTertiaryFixedVariant: '#822800',
  background: '#fdf8f5',
  onBackground: '#1c1b1a',
  surfaceVariant: '#e6e2df',
} as const;

/** Semantic colors used in dashboards and financial UI (Stitch storybook extensions). */
export const semanticColors = {
  successEmerald: '#10b981',
  warningAmber: '#f59e0b',
  expenseRose: '#e11d48',
  textMuted: '#7c6a68',
} as const;

export const typography = {
  displayLg: {
    fontFamily: 'Manrope',
    fontSize: '48px',
    fontWeight: 700,
    lineHeight: '56px',
    letterSpacing: '-0.02em',
  },
  headlineLg: {
    fontFamily: 'Manrope',
    fontSize: '32px',
    fontWeight: 600,
    lineHeight: '40px',
  },
  headlineLgMobile: {
    fontFamily: 'Manrope',
    fontSize: '28px',
    fontWeight: 600,
    lineHeight: '36px',
  },
  titleMd: {
    fontFamily: 'Manrope',
    fontSize: '20px',
    fontWeight: 600,
    lineHeight: '28px',
  },
  bodyLg: {
    fontFamily: 'Work Sans',
    fontSize: '18px',
    fontWeight: 400,
    lineHeight: '28px',
  },
  bodyMd: {
    fontFamily: 'Work Sans',
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: '24px',
  },
  labelMd: {
    fontFamily: 'Work Sans',
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '20px',
    letterSpacing: '0.01em',
  },
  caption: {
    fontFamily: 'Work Sans',
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: '16px',
  },
} as const;

/** Stitch mockup scale extensions (landing/auth pages). */
export const typographyExtensions = {
  headlineXl: {
    fontFamily: 'Manrope',
    fontSize: '40px',
    fontWeight: 800,
    lineHeight: '48px',
    letterSpacing: '-0.01em',
  },
  headlineMd: {
    fontFamily: 'Manrope',
    fontSize: '24px',
    fontWeight: 700,
    lineHeight: '32px',
  },
  labelSm: {
    fontFamily: 'Work Sans',
    fontSize: '12px',
    fontWeight: 700,
    lineHeight: '16px',
  },
} as const;

export const rounded = {
  sm: '0.25rem',
  default: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.5rem',
  full: '9999px',
} as const;

export const spacing = {
  base: '8px',
  xs: '4px',
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '40px',
  gutter: '16px',
  marginMobile: '20px',
  marginDesktop: '64px',
  containerMax: '1200px',
} as const;

export const designPrinciples = {
  voice:
    'Profesional pero cercano. Tuteo o formas neutras; español universal sin voseo.',
  color:
    'Teal TADOR (#008080) como base de confianza, con Sandy Brown y Coral para calidez.',
  typography:
    'Manrope en titulares; Work Sans en cuerpo y etiquetas para legibilidad en datos financieros.',
  spacing:
    'Cuadrícula fluida de 8px. Márgenes generosos; padding amplio para que el contenido respire.',
  elevation:
    'Sombras ambientales suaves con tinte cálido (4–8% opacidad), sin negro puro.',
  shapes: 'Redondeadas nivel 2 (0.5rem base); botones principales hasta 1rem.',
} as const;

export const componentGuidelines = {
  buttons:
    'Primary teal para acciones afirmativas; secondary para apoyo. Verbos en infinitivo o tuteo.',
  cards: 'Bordes 1rem, borde sutil 1px tono neutro más oscuro que el fondo.',
  inputs: 'Focus ring teal suave; etiquetas claras; validación constructiva y amigable.',
  chips: 'Versiones pasteles de la paleta; no compiten con acciones principales.',
  lists: 'Espaciado vertical mínimo 16px entre elementos.',
} as const;

export interface ColorSwatch {
  name: string;
  hex: string;
  token: keyof typeof colors | keyof typeof semanticColors;
  group: 'brand' | 'semantic';
}

export const foundationSwatches: ColorSwatch[] = [
  { name: 'Primary', hex: colors.primary, token: 'primary', group: 'brand' },
  { name: 'Primary Container', hex: colors.primaryContainer, token: 'primaryContainer', group: 'brand' },
  { name: 'Secondary', hex: colors.secondary, token: 'secondary', group: 'brand' },
  { name: 'Secondary Container', hex: colors.secondaryContainer, token: 'secondaryContainer', group: 'brand' },
  { name: 'Tertiary', hex: colors.tertiary, token: 'tertiary', group: 'brand' },
  { name: 'Surface Low', hex: colors.surfaceContainerLow, token: 'surfaceContainerLow', group: 'brand' },
  { name: 'Success', hex: semanticColors.successEmerald, token: 'successEmerald', group: 'semantic' },
  { name: 'Expense', hex: semanticColors.expenseRose, token: 'expenseRose', group: 'semantic' },
];
