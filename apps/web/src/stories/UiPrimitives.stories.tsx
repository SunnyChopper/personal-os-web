import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import Button from '@/components/atoms/Button';
import { FormInput } from '@/components/atoms/FormInput';
import { FormCheckbox } from '@/components/atoms/FormCheckbox';
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from '@/components/atoms/Card';
import { FormField } from '@/components/molecules/FormField';
import Dialog from '@/components/molecules/Dialog';
import ConfirmDialog from '@/components/molecules/ConfirmDialog';
import BottomSheet from '@/components/molecules/BottomSheet';
import Combobox from '@/components/molecules/Combobox';
import MultiCombobox from '@/components/molecules/MultiCombobox';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';

const meta = {
  title: 'UI Primitives',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const ButtonVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="success">Success</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
};

export const FormControls: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      <FormField label="Name" htmlFor="demo-name">
        <FormInput id="demo-name" placeholder="Jane Doe" />
      </FormField>
      <FormField label="Area" htmlFor="demo-area">
        <Select id="demo-area" defaultValue="health">
          <option value="health">Health</option>
          <option value="work">Work</option>
        </Select>
      </FormField>
      <FormField label="Notes" htmlFor="demo-notes">
        <Textarea id="demo-notes" rows={3} placeholder="Optional notes…" />
      </FormField>
      <label className="flex items-center gap-2 text-sm">
        <FormCheckbox /> Remember me
      </label>
    </div>
  ),
};

export const CardExample: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Weekly review</CardTitle>
      </CardHeader>
      <CardBody>Card body uses the canonical surface token.</CardBody>
      <CardFooter>
        <Button size="sm">Action</Button>
      </CardFooter>
    </Card>
  ),
};

function ComboboxDemo() {
  const [value, setValue] = useState('');
  return (
    <Combobox
      value={value}
      onChange={setValue}
      options={['Design', 'Engineering', 'Marketing']}
      allowCreate
      placeholder="Category"
    />
  );
}

export const ComboboxExample: Story = {
  render: () => (
    <div className="w-80">
      <ComboboxDemo />
    </div>
  ),
};

function MultiComboboxDemo() {
  const [value, setValue] = useState<string[]>(['a']);
  return (
    <MultiCombobox
      value={value}
      onChange={setValue}
      options={[
        { value: 'a', label: 'Alpha' },
        { value: 'b', label: 'Beta' },
        { value: 'c', label: 'Gamma' },
      ]}
      maxItems={5}
    />
  );
}

export const MultiComboboxExample: Story = {
  render: () => (
    <div className="w-80">
      <MultiComboboxDemo />
    </div>
  ),
};

function DialogDemo() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Dialog isOpen={open} onClose={() => setOpen(false)} title="Dialog">
        Shared modal primitive with escape handling and scroll lock.
      </Dialog>
    </>
  );
}

export const DialogExample: Story = {
  render: () => <DialogDemo />,
};

function ConfirmDialogDemo() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open confirm</Button>
      <ConfirmDialog
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
        title="Delete file"
        description="This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
}

export const ConfirmDialogExample: Story = {
  render: () => <ConfirmDialogDemo />,
};

function BottomSheetDemo() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open sheet</Button>
      <BottomSheet isOpen={open} onClose={() => setOpen(false)} title="Bottom sheet">
        Mobile-friendly overlay.
      </BottomSheet>
    </>
  );
}

export const BottomSheetExample: Story = {
  render: () => <BottomSheetDemo />,
};
