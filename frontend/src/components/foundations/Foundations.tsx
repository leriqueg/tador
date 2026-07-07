import {
  componentGuidelines,
  designPrinciples,
  foundationSwatches,
  typography,
  typographyExtensions,
} from '../../design/tokens.ts';

const SWATCH_CLASS: Record<string, { bg: string; text: string }> = {
  primary: { bg: 'bg-primary', text: 'text-on-primary' },
  primaryContainer: { bg: 'bg-primary-container', text: 'text-on-primary-container' },
  secondary: { bg: 'bg-secondary', text: 'text-on-secondary' },
  secondaryContainer: { bg: 'bg-secondary-container', text: 'text-on-secondary-container' },
  tertiary: { bg: 'bg-tertiary', text: 'text-on-tertiary' },
  surfaceContainerLow: { bg: 'bg-surface-container-low', text: 'text-on-surface border border-outline-variant' },
  successEmerald: { bg: 'bg-success-emerald', text: 'text-white' },
  expenseRose: { bg: 'bg-expense-rose', text: 'text-white' },
};

export function ColorPalette() {
  return (
    <div className="grid grid-cols-2 gap-sm">
      {foundationSwatches.map((token) => {
        const classes = SWATCH_CLASS[token.token] ?? { bg: 'bg-surface', text: 'text-on-surface' };
        return (
          <div
            key={token.name}
            className={`h-[100px] rounded-lg flex items-end p-3 text-xs font-bold ${classes.bg} ${classes.text}`}
          >
            {token.name}
            <br />
            {token.hex}
          </div>
        );
      })}
    </div>
  );
}

export function TypographyScale() {
  return (
    <div className="space-y-sm">
      <p className="font-headline text-display-lg text-primary">Display Large</p>
      <p className="font-headline text-headline-xl text-primary">Headline XL</p>
      <p className="font-headline text-headline-lg text-on-surface">Headline Large</p>
      <p className="font-headline text-title-md text-on-surface">Title Medium</p>
      <p className="font-body text-body-lg text-on-surface">Body Large — contexto narrativo</p>
      <p className="font-body text-body-md text-on-surface">Body Medium — texto de párrafo</p>
      <p className="font-body text-label-md text-text-muted">Label Medium — metadatos</p>
      <p className="font-body text-caption text-text-muted">Caption — notas auxiliares</p>
    </div>
  );
}

export function DesignPrinciples() {
  return (
    <div className="space-y-lg max-w-3xl text-body-md text-on-surface-variant">
      <section>
        <h4 className="font-headline text-headline-md text-primary mb-sm">Marca y estilo</h4>
        <p>{designPrinciples.voice}</p>
      </section>
      <section>
        <h4 className="font-headline text-headline-md text-primary mb-sm">Colores</h4>
        <p>{designPrinciples.color}</p>
      </section>
      <section>
        <h4 className="font-headline text-headline-md text-primary mb-sm">Tipografía</h4>
        <p>{designPrinciples.typography}</p>
        <ul className="mt-sm space-y-xs text-label-md">
          <li>Display: {typography.displayLg.fontFamily} {typography.displayLg.fontSize}</li>
          <li>Headline: {typography.headlineLg.fontFamily} {typography.headlineLg.fontSize}</li>
          <li>Body: {typography.bodyMd.fontFamily} {typography.bodyMd.fontSize}</li>
        </ul>
      </section>
      <section>
        <h4 className="font-headline text-headline-md text-primary mb-sm">Componentes</h4>
        <ul className="space-y-sm">
          {Object.entries(componentGuidelines).map(([key, value]) => (
            <li key={key}>
              <span className="font-label-md text-on-surface capitalize">{key}: </span>
              {value}
            </li>
          ))}
        </ul>
      </section>
      <p className="text-label-sm text-text-muted">
        Extensiones Stitch: headline-xl ({typographyExtensions.headlineXl.fontSize}),
        headline-md ({typographyExtensions.headlineMd.fontSize})
      </p>
    </div>
  );
}
