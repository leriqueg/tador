import type { ReactNode } from 'react';
import Button from '../ui/Button.tsx';
import Icon from '../ui/Icon.tsx';

export interface ApunteSuccessPanelProps {
  plantillaName: string;
  title?: string;
  message?: string;
  /** Reserved for post-MVP mascot slot */
  mascotSlot?: ReactNode;
  onContinueSame: () => void;
  onChooseOther: () => void;
  continueLabel?: string;
  chooseOtherLabel?: string;
}

/** Post-save step: persistent success + two clear next actions (Option B). */
export default function ApunteSuccessPanel({
  plantillaName,
  title = 'Apunte guardado',
  message,
  mascotSlot,
  onContinueSame,
  onChooseOther,
  continueLabel = 'Otro con esta plantilla',
  chooseOtherLabel = 'Elegir otra plantilla',
}: ApunteSuccessPanelProps) {
  return (
    <section
      className="mb-lg rounded-xl border border-success-emerald/25 bg-success-emerald/10 p-lg space-y-lg"
      aria-live="polite"
    >
      <div className="flex gap-md items-start">
        <div
          className="shrink-0 w-12 h-12 rounded-full bg-success-emerald/15 flex items-center justify-center"
          aria-hidden
        >
          <Icon name="check_circle" className="text-success-emerald text-3xl" filled />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-headline-md text-on-surface font-bold mb-xs">{title}</h2>
          <p className="text-body-md text-on-surface-variant">
            {message ?? (
              <>
                Ya está en tu libro con la plantilla{' '}
                <span className="font-semibold text-on-surface">{plantillaName}</span>.
              </>
            )}
          </p>
        </div>
        {mascotSlot}
      </div>

      <div className="flex flex-col md:flex-row md:justify-end gap-sm">
        <Button
          fullWidth
          size="lg"
          className="rounded-xl md:w-auto md:min-w-[11rem]"
          onClick={onContinueSame}
        >
          {continueLabel}
        </Button>
        <Button
          variant="outline"
          fullWidth
          size="lg"
          className="rounded-xl md:w-auto md:min-w-[11rem]"
          onClick={onChooseOther}
        >
          {chooseOtherLabel}
        </Button>
      </div>
    </section>
  );
}
