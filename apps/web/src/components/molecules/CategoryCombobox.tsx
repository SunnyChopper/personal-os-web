import Combobox from '@/components/molecules/Combobox';

export interface CategoryComboboxProps {
  value: string;
  onChange: (next: string) => void;
  options: string[];
  disabled?: boolean;
  placeholder?: string;
  isLoadingOptions?: boolean;
}

/**
 * Category picker — thin wrapper over shared Combobox with create-from-typed-value.
 */
export default function CategoryCombobox({
  value,
  onChange,
  options,
  disabled = false,
  placeholder = 'Enter or select a category',
  isLoadingOptions = false,
}: CategoryComboboxProps) {
  return (
    <Combobox
      value={value}
      onChange={onChange}
      options={options}
      disabled={disabled}
      placeholder={placeholder}
      isLoading={isLoadingOptions}
      allowCreate
    />
  );
}
