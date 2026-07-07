import type { Meta, StoryObj } from '@storybook/react-vite';
import AccountBankingRow from '../components/financial/AccountBankingRow.tsx';

const meta = {
  title: 'Financial/Account Banking',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

export const AllRows: StoryObj = {
  render: () => (
    <div className="space-y-sm max-w-4xl">
      <div className="component-demo">
        <AccountBankingRow
          icon="account_balance"
          name="Banco Santander Central"
          subtitle="Actualizado: Hoy, 08:45 AM"
          amount="$45.200,00"
          status="reconciled"
          statusLabel="Conciliado"
          actionLabel="Conciliar"
        />
      </div>
      <div className="component-demo">
        <AccountBankingRow
          icon="credit_card"
          name="Visa Infinite Platinum"
          subtitle="5 movimientos pendientes"
          amount="$2.150,30"
          status="review"
          statusLabel="Revisión necesaria"
          actionLabel="Revisar"
          accent="warning"
        />
      </div>
      <div className="component-demo">
        <AccountBankingRow
          icon="payments"
          name="Caja Menor (Efectivo)"
          subtitle="Arqueo hace 2 días"
          amount="$1.250,00"
          status="reconciled"
          statusLabel="Conciliado"
          actionLabel="Conciliar"
        />
      </div>
    </div>
  ),
};
