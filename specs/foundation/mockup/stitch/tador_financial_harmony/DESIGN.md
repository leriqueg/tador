---
name: TADOR Financial Harmony
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#404847'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#707977'
  outline-variant: '#bfc8c6'
  surface-tint: '#316763'
  primary: '#003633'
  on-primary: '#ffffff'
  primary-container: '#134e4a'
  on-primary-container: '#87beb8'
  inverse-primary: '#9ad1cb'
  secondary: '#006b5f'
  on-secondary: '#ffffff'
  secondary-container: '#62fae3'
  on-secondary-container: '#007165'
  tertiary: '#263230'
  on-tertiary: '#ffffff'
  tertiary-container: '#3c4846'
  on-tertiary-container: '#a9b6b4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b5ede7'
  primary-fixed-dim: '#9ad1cb'
  on-primary-fixed: '#00201e'
  on-primary-fixed-variant: '#144f4b'
  secondary-fixed: '#62fae3'
  secondary-fixed-dim: '#3cddc7'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005047'
  tertiary-fixed: '#d8e5e2'
  tertiary-fixed-dim: '#bcc9c6'
  on-tertiary-fixed: '#121e1c'
  on-tertiary-fixed-variant: '#3d4947'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
  success-emerald: '#10B981'
  expense-rose: '#E11D48'
  warning-amber: '#F59E0B'
  text-main: '#1E293B'
  text-muted: '#64748B'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1200px
  gutter: 16px
---

## Brand & Style

The design system is built upon the philosophy of "Divertido pero sobrio"—bringing delight to financial management without sacrificing the gravitas of accounting precision. It targets users aged 20-50 who seek clarity in their home economy but lack formal accounting training.

The chosen style is **Modern Corporate with Tactile Affordance**. It leverages a clean, professional foundation characterized by generous whitespace and structured layouts, then softens the experience through "squishy" interactive elements, friendly micro-copy, and a calming color palette. The goal is to evoke a sense of "organized calm," moving away from the cold, intimidating aesthetics of traditional ERPs toward a helpful, lifestyle-oriented tool.

**Key Visual Principles:**
- **Clarity over Complexity:** Information is layered, showing essentials first and details only when requested.
- **Human-Centric Precision:** While the math is rigorous (accounting roots), the interface uses natural language ("apuntes") and soft geometry.
- **Trust through Consistency:** High-quality iconography and stable layouts reinforce the reliability required for financial data.

## Colors

The palette revolves around a deep, sophisticated **Verde Azulado (Teal)** as the primary brand anchor. This color provides the "sobrio" (sober) foundation, representing stability and growth.

- **Primary:** Deep Teal (#134E4A) used for main branding, primary buttons, and headings.
- **Secondary:** Bright Mint (#2DD4BF) used for accents, highlights, and active states to inject the "divertido" (fun) energy.
- **Backgrounds:** A soft, neutral slate-white (#F8FAFC) keeps the interface airy and reduces eye strain.
- **Semantic Colors:** Financial status is communicated through a refined palette of emerald for income and rose for expenses, ensuring clarity in data visualization without aggressive "red/green" high-contrast fatigue.

## Typography

This design system utilizes **Inter** for all roles to ensure maximum legibility and a modern, systematic feel across all devices. 

The type hierarchy is designed for "scannability." Headlines use a tighter letter spacing and heavier weights to command attention, while body text remains open and accessible. For financial figures, use tabular figures (monospaced numbers) where possible to ensure that columns of data align perfectly, facilitating easier mental arithmetic for the user. Mobile-specific overrides for large display text ensure that the "Hero" sections of the landing page remain impactful without breaking layout.

## Layout & Spacing

The design system follows a **Mobile-First Fluid Grid** model. 

- **Mobile (<640px):** Single column with 16px side margins. Content relies on vertical stacking and bottom-anchored actions for thumb-reachability.
- **Tablet (640px - 1024px):** Transitions to a 6-column grid. Side margins increase to 24px.
- **Desktop (>1024px):** A 12-column grid with a maximum container width of 1200px. 

Spacing follows a strict 4px base unit. Most components utilize 16px (md) for internal padding to maintain a spacious, breathable feel. Large sections on the landing page are separated by 40px (xl) or more to emphasize the "clean" aesthetic.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layers** combined with **Ambient Shadows**.

- **Surface 0 (Background):** The neutral base color (#F8FAFC).
- **Surface 1 (Cards/Inputs):** Pure white (#FFFFFF) backgrounds.
- **Elevation - Low:** Used for cards and buttons. A soft, diffused shadow with a subtle teal tint: `0 4px 12px rgba(19, 78, 74, 0.05)`.
- **Elevation - High:** Used for modals and dropdown menus. A more pronounced shadow: `0 12px 32px rgba(19, 78, 74, 0.12)`.

To maintain the "sobrio" feel, avoid heavy black shadows. All depth indicators should feel airy and natural, suggesting physical objects resting gently on a surface.

## Shapes

The shape language is **Friendly and Approachable**. 

The standard roundedness is 0.5rem (8px), which strikes the perfect balance between the precision of accounting (sharp) and the warmth of a home app (round). 
- **Buttons and Inputs:** Use the standard 0.5rem (8px).
- **Cards and Modals:** Use `rounded-lg` (16px) to create a soft, container-like feel.
- **Status Tags/Chips:** Use `rounded-xl` (24px) or full pill shapes to distinguish them from interactive buttons.

## Components

### Buttons
Primary buttons use the Primary Teal with white text. Hover states should slightly darken the background. The "Divertido" aspect is introduced through a subtle scale-down effect (0.98) on click/active states to provide tactile feedback.

### Input Fields
Fields feature a 1px border in a muted neutral tone, which shifts to Primary Teal on focus. Error states use the "Expense Rose" for both the border and the helper text. Use Lucide icons (e.g., a magnifying glass for search or a calendar for dates) inside inputs to enhance visual cues.

### Cards
Cards are white with the "Low Elevation" shadow and 16px padding. On the landing page, cards representing "Beneficios" may include a subtle 2px top border in Mint or Teal to add brand character.

### Accordions (Q&A)
Clean, borderless style. The question is bolded; the expansion is indicated by a simple chevron icon that rotates 180 degrees. Ensure smooth height transitions for a premium feel.

### Navigation
- **Mobile:** A bottom-sheet style or full-screen overlay for the hamburger menu to ensure accessibility.
- **Desktop:** A fixed top header with a slight backdrop blur (Glassmorphism) to keep the UI feeling lightweight as the user scrolls.

### Iconography
Use **Lucide** icons with a 2px stroke width. Icons should always be accompanied by labels for users over 40, ensuring the app remains accessible and "helpful" as per the brand tone.