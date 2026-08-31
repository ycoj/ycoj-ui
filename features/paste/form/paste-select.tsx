'use client';

import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

type Props = {
  id: string;
  label: string;
  value: string;
  options: Record<string, string>;
  onChange: (value: string) => void;
  disabled: boolean;
  error?: string;
};

const emptyValue = '$plain';

export default function PasteSelect({
  id,
  label,
  value,
  options,
  onChange,
  disabled,
  error,
}: Props) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        value={value || emptyValue}
        onValueChange={(next) => onChange(next === emptyValue ? '' : next)}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="w-full" aria-invalid={!!error}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(options).map(([key, text]) => (
            <SelectItem key={key} value={key || emptyValue}>
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError errors={[{ message: error }]} />
    </Field>
  );
}
