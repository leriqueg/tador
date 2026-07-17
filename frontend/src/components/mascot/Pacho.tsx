/**
 * Pacho mascot UI — post-MVP (see specs/foundation/original-idea.md).
 * Storybook / component library only until an animated on-screen advisor exists.
 */
import Icon from '../ui/Icon.tsx';

const PACHO_MENTOR_IMG =
  'https://lh3.googleusercontent.com/aida/AP1WRLvGreLZfwupXh98lF2PDaAcHLXoP2fU3dLW_qC9aSfCkiduczS6YgGRWrKlkv2XB9F3wYkju2LU_LxYTYpF5nSdC0ct9onSsaWTy_FT6TSLbuZnykRPyOeG2baYTewXg5qK6fClOWekNdfXDYrQKL8toHrqebLmklEzqpPud9_0-g2bXxJXBBCuGPodowClsofSg-rEVbvfM5MCoKKVvsQ7cpOHonFml43V1S3tcI0SGz4SVnWKQ6k';

const PACHO_BOWTIE_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuABkI2eI3IQGuOTEqptnmZvBLYotwv_333n1ASwsbrIRBl3ccQTm8_8BVMnHu_Jl1LZSRyHbvVuB_pB546U02RJPXp7ayyxeh0rRVuiXUke0QGGEXwEndbEBJQIezyFkVhqQzw8akHENT2TTkS-0ZPl4Q-f8gtoa7CguODOG4UxHWRxZpwzyyicM3SwZcHNtOnVRtLirIVDBQKYi8x3BBXk21oo6fItw1DBUER-A7lhUH67MyQduPcWL8YAFM_e5yQch1WHtZgL';

export interface PachoMentorCardProps {
  message: string;
  onDismiss?: () => void;
}

export function PachoMentorCard({ message, onDismiss }: PachoMentorCardProps) {
  return (
    <div className="flex gap-md relative group border-l-4 border-primary">
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Cerrar"
        >
          <Icon name="close" className="text-sm" />
        </button>
      )}
      <div className="shrink-0 w-16 h-16 rounded-full bg-secondary-fixed border-2 border-white shadow-sm overflow-hidden relative">
        <img className="w-full h-full object-cover" src={PACHO_MENTOR_IMG} alt="Pacho mentor" />
        <div className="absolute bottom-0 right-0 bg-success-emerald w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
          <Icon name="check" className="text-[8px] text-white font-bold" />
        </div>
      </div>
      <div>
        <h4 className="font-label-md font-bold text-primary mb-1">Pacho Mentor</h4>
        <p className="text-body-md text-on-surface-variant italic">&ldquo;{message}&rdquo;</p>
      </div>
    </div>
  );
}

export interface PachoGreetingProps {
  userName: string;
  subtitle?: string;
}

export function PachoGreeting({ userName, subtitle = 'Modo PRO Activo' }: PachoGreetingProps) {
  return (
    <div className="flex items-center gap-md">
      <div className="w-14 h-14 rounded-full overflow-hidden bg-primary-fixed border-2 border-primary/10">
        <img className="w-full h-full object-cover" src={PACHO_BOWTIE_IMG} alt="Pacho" />
      </div>
      <div>
        <p className="text-label-sm text-text-muted">{subtitle}</p>
        <h4 className="font-headline-md text-primary">¡Hola, {userName}! Pacho está listo.</h4>
      </div>
    </div>
  );
}

export function PachoAssistant() {
  return (
    <div className="bg-primary p-lg rounded-2xl flex flex-col gap-lg">
      <div className="flex items-center gap-sm">
        <div className="w-10 h-10 bg-secondary-container rounded-full flex items-center justify-center">
          <Icon name="face" filled className="text-primary" />
        </div>
        <span className="text-white font-bold">Asistente Pacho</span>
      </div>
      <div className="bg-white/10 border border-white/20 rounded-xl p-md">
        <p className="text-white text-body-md italic mb-4">
          &ldquo;Contame qué pasó, yo me encargo del resto...&rdquo;
        </p>
        <div className="flex items-center gap-md bg-white/10 rounded-lg p-sm border border-white/10">
          <input
            className="bg-transparent border-none text-white focus:ring-0 placeholder:text-white/40 flex-1 px-sm outline-none"
            placeholder="Ayer pagué 5000 de luz..."
          />
          <div className="flex gap-xs text-white/60">
            <Icon name="mic" />
            <Icon name="attach_file" />
          </div>
        </div>
        <button
          type="button"
          className="w-full mt-4 py-3 bg-secondary-container text-primary rounded-xl font-bold flex items-center justify-center gap-sm"
        >
          <Icon name="auto_awesome" />
          Procesar intención
        </button>
      </div>
    </div>
  );
}
