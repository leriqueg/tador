import Icon from '../ui/Icon.tsx';

export function NetResultWidget({
  amount = '$ 45.230,00',
  budgetLabel = 'Presupuesto mensual',
  trend = '+12% vs anterior',
  progress = 65,
}: {
  amount?: string;
  budgetLabel?: string;
  trend?: string;
  progress?: number;
}) {
  return (
    <div className="bg-white p-lg flex flex-col justify-between h-56 rounded-xl">
      <p className="text-label-sm text-text-muted uppercase tracking-wider mb-2">Resultado Neto (Hogar)</p>
      <h4 className="font-headline-xl text-primary">{amount}</h4>
      <div className="mt-4">
        <div className="flex justify-between items-center mb-xs">
          <span className="text-label-sm text-text-muted">{budgetLabel}</span>
          <span className="text-label-sm text-success-emerald">{trend}</span>
        </div>
        <div className="h-12 w-full bg-primary-fixed/20 rounded-lg overflow-hidden relative wave-container">
          <div
            className="absolute bottom-0 left-0 h-full bg-primary/60 rounded-r-lg"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function TotalIncomeWidget({
  amount = '$ 12.450,00',
  trend = '+8.2%',
}: {
  amount?: string;
  trend?: string;
}) {
  const bars = ['h-1/2', 'h-3/4', 'h-2/3', 'h-full', 'h-5/6'];

  return (
    <div className="bg-white p-lg flex flex-col justify-between h-56 rounded-xl">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-label-sm text-text-muted uppercase tracking-wide">Ingresos Totales (PRO)</p>
          <h4 className="font-headline-lg text-primary mt-1">{amount}</h4>
        </div>
        <span className="text-success-emerald text-label-sm font-bold flex items-center">
          <Icon name="trending_up" className="text-sm" />
          {trend}
        </span>
      </div>
      <div className="h-10 w-full bg-success-emerald/10 rounded-full flex items-end px-1 gap-1">
        {bars.map((height) => (
          <div key={height} className={`bg-success-emerald ${height} flex-1 rounded-t-sm`} />
        ))}
      </div>
    </div>
  );
}

export function OperatingExpensesWidget({
  amount = '$ 8.320,50',
  trend = '-2.4%',
}: {
  amount?: string;
  trend?: string;
}) {
  const bars = ['h-5/6', 'h-4/6', 'h-3/4', 'h-1/2', 'h-2/3'];

  return (
    <div className="bg-white p-lg flex flex-col justify-between h-56 rounded-xl">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-label-sm text-text-muted uppercase tracking-wide">Gastos Operativos (PRO)</p>
          <h4 className="font-headline-lg text-expense-rose mt-1">{amount}</h4>
        </div>
        <span className="text-expense-rose text-label-sm font-bold flex items-center">
          <Icon name="trending_down" className="text-sm" />
          {trend}
        </span>
      </div>
      <div className="h-10 w-full bg-expense-rose/10 rounded-full flex items-end px-1 gap-1">
        {bars.map((height) => (
          <div key={height} className={`bg-expense-rose ${height} flex-1 rounded-t-sm`} />
        ))}
      </div>
    </div>
  );
}

export function NetProfitWidget({
  amount = '$4.129,50',
  margin = 'Margen operativo del 33.1%',
}: {
  amount?: string;
  margin?: string;
}) {
  return (
    <div className="bg-primary text-white p-lg flex flex-col justify-between h-56 relative overflow-hidden shadow-xl rounded-xl">
      <div className="relative z-10">
        <p className="text-on-primary/70 text-label-sm uppercase tracking-wide">Resultado Neto (PyG)</p>
        <h4 className="text-headline-lg font-bold mt-2">{amount}</h4>
        <p className="text-on-primary/50 text-label-sm mt-1">{margin}</p>
      </div>
      <Icon
        name="account_balance_wallet"
        className="absolute -bottom-6 -right-6 text-9xl text-white/5 font-light"
      />
    </div>
  );
}
