import Button from '../ui/Button.tsx';
import Icon from '../ui/Icon.tsx';

export function ConversationalWizard() {
  return (
    <div className="space-y-md">
      <p className="text-label-sm font-bold text-text-muted">Registro Conversacional (Step-by-Step)</p>
      <div className="space-y-xl">
        <div>
          <div className="flex items-center gap-xs mb-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <h2 className="text-primary font-bold">de mi cuenta...</h2>
          </div>
          <div className="bg-surface-container-lowest p-md rounded-xl border-2 border-primary flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-md">
              <div className="w-10 h-10 bg-expense-rose/10 text-expense-rose rounded-lg flex items-center justify-center">
                <Icon name="account_balance" />
              </div>
              <div>
                <p className="text-xs font-bold">Banco Santander</p>
                <p className="text-[10px] text-text-muted">**** 4920</p>
              </div>
            </div>
            <Icon name="check_circle" filled className="text-primary" />
          </div>
        </div>
        <div>
          <h2 className="text-text-muted font-label-md mb-2">por un monto de...</h2>
          <div className="relative">
            <span className="absolute left-md top-1/2 -translate-y-1/2 text-headline-md font-bold text-primary">
              $
            </span>
            <input
              type="number"
              placeholder="0.00"
              className="w-full bg-surface-container-low border-none rounded-xl py-lg pl-xl text-headline-md font-bold text-primary focus:ring-2 focus:ring-primary/10 outline-none"
            />
          </div>
        </div>
        <Button fullWidth size="lg" iconRight="arrow_forward" className="rounded-xl shadow-lg">
          Continuar
        </Button>
      </div>
    </div>
  );
}

export function AITemplateResult() {
  return (
    <div className="space-y-md">
      <p className="text-label-sm font-bold text-text-muted">Resultado de Procesamiento IA</p>
      <div className="flex items-center gap-xs mb-sm">
        <Icon name="check_circle" filled className="text-success-emerald" />
        <p className="text-label-md">
          Plantilla: <span className="font-bold text-primary">Pago de Servicios</span>
        </p>
      </div>
      <div className="bg-surface-container-lowest rounded-xl p-md border-l-4 border-success-emerald shadow-sm space-y-md">
        <div className="grid grid-cols-2 gap-md">
          <div className="space-y-1">
            <p className="text-[9px] text-text-muted uppercase font-bold">Monto</p>
            <p className="text-headline-md font-bold text-primary">$5.000,00</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] text-text-muted uppercase font-bold">Categoría</p>
            <p className="font-medium">Hogar</p>
          </div>
        </div>
        <div className="pt-sm border-t border-surface-container">
          <button
            type="button"
            className="w-full py-2 bg-primary-container text-white rounded-lg text-xs font-bold"
          >
            Confirmar y Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export function FabButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-gutter right-gutter w-14 h-14 bg-primary text-secondary-container rounded-full shadow-2xl flex items-center justify-center z-50 active:scale-90 transition-transform"
      aria-label="Agregar"
    >
      <Icon name="add" className="text-3xl" />
    </button>
  );
}
