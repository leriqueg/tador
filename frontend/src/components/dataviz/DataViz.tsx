/** Hardcoded Stitch mock — do not wire. Prefer a data-driven chart when elevating bars. */
export function MonthlyEvolutionChart() {
  const months = [
    { label: 'Ene', height: 'h-24', active: false },
    { label: 'Feb', height: 'h-32', active: false },
    { label: 'Mar', height: 'h-44', active: true, value: '$12k' },
  ];

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-lg">
        <h4 className="font-label-md font-bold text-primary">Evolución Mensual</h4>
        <div className="flex bg-surface-container rounded-lg p-1">
          <button type="button" className="px-3 py-1 bg-white shadow-sm rounded-md text-[10px] font-bold text-primary">
            Ingresos
          </button>
          <button type="button" className="px-3 py-1 text-[10px] font-medium text-text-muted">
            Gastos
          </button>
        </div>
      </div>
      <div className="h-48 flex items-end justify-around gap-2 px-2 relative">
        <div className="absolute inset-x-0 top-0 h-px bg-outline-variant/20" />
        <div className="absolute inset-x-0 top-1/2 h-px bg-outline-variant/20" />
        {months.map((month) => (
          <div key={month.label} className="flex flex-col items-center flex-1">
            <div className={`w-full rounded-t-md relative ${month.active ? 'bg-primary' : 'bg-primary/20'} ${month.height}`}>
              {month.value && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] px-1.5 py-0.5 rounded">
                  {month.value}
                </div>
              )}
            </div>
            <span className={`text-[10px] mt-2 ${month.active ? 'font-bold text-primary' : 'text-text-muted'}`}>
              {month.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Hardcoded Stitch mock — do not wire. Use `charts/BreakdownDonut` (canonical). */
export function PeriodBreakdownDonut() {
  const segments = [
    { color: 'bg-primary', label: 'Vivienda', pct: '45%' },
    { color: 'bg-secondary', label: 'Comida', pct: '25%' },
  ];

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-lg">
        <h4 className="font-label-md font-bold text-primary">Desglose del Periodo</h4>
        <div className="flex bg-surface-container rounded-lg p-1">
          <button type="button" className="px-3 py-1 text-[10px] font-medium text-text-muted">
            Ingresos
          </button>
          <button type="button" className="px-3 py-1 bg-white shadow-sm rounded-md text-[10px] font-bold text-primary">
            Gastos
          </button>
        </div>
      </div>
      <div className="flex flex-col items-center">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
            <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#006a6a" strokeDasharray="45 100" strokeWidth="4" />
            <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#77574a" strokeDasharray="25 100" strokeDashoffset="-45" strokeWidth="4" />
            <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#96d0d0" strokeDasharray="20 100" strokeDashoffset="-70" strokeWidth="4" />
            <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#d8c2be" strokeDasharray="10 100" strokeDashoffset="-90" strokeWidth="4" />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-[9px] text-text-muted uppercase">Total</span>
            <span className="font-bold text-primary">$8.3k</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-6 w-full">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-1.5 text-[10px]">
              <div className={`w-2 h-2 rounded-full ${seg.color}`} />
              <span className="flex-1">{seg.label}</span>
              <span className="font-bold">{seg.pct}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
