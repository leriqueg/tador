import ValidationMessage from '../ui/ValidationMessage.tsx';
import Button from '../ui/Button.tsx';

export interface BankMissingEntityBannerProps {
  bankName: string;
  entitiesPath: string;
}

/** T019 — bank without entidadId cannot attribute cost/yield by entity. */
export default function BankMissingEntityBanner({
  bankName,
  entitiesPath,
}: BankMissingEntityBannerProps) {
  return (
    <ValidationMessage tone="warning" title={`${bankName} no tiene entidad vinculada`}>
      <p className="mb-sm">
        Para ver costos y ganancias atribuidos al banco, vinculá la cuenta con una entidad tipo
        banco.
      </p>
      <Button to={entitiesPath} variant="outline" size="sm">
        Ir a Entidades
      </Button>
    </ValidationMessage>
  );
}
