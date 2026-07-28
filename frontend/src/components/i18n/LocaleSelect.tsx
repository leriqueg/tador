import { LOCALE_OPTIONS } from '../../i18n/locales.ts';
import { useTranslation } from 'react-i18next';

interface LocaleSelectProps {
  id: string;
  value: string;
  onChange: (locale: string) => void;
  className?: string;
}

/** Curated locale picker backed by i18n labels. */
export default function LocaleSelect({ id, value, onChange, className }: LocaleSelectProps) {
  const { t } = useTranslation();

  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={
        className ??
        'w-full h-12 px-md mb-xl rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md'
      }
    >
      {LOCALE_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {t(option.labelKey)}
        </option>
      ))}
    </select>
  );
}
