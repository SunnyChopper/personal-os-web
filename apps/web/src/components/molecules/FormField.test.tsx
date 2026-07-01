import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FormField } from '@/components/molecules/FormField';
import { FormInput } from '@/components/atoms/FormInput';

describe('FormField', () => {
  it('renders label, control, hint, and error', () => {
    render(
      <FormField label="Name" htmlFor="name" required error="Required">
        <FormInput id="name" />
      </FormField>
    );
    expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
    expect(screen.getByText('Required')).toBeInTheDocument();
  });
});
