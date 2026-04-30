export type BrainstormModelPickerValue = {
  mode: 'auto' | 'manual';
  /** Catalog model id when mode is manual; ignored when auto */
  manualCatalogModelId: string;
};

export function brainstormValueToApiModelField(v: BrainstormModelPickerValue): string | undefined {
  if (v.mode === 'auto') return undefined;
  return v.manualCatalogModelId || undefined;
}
