import { useState } from 'react';

export type ModalType = 'rename' | 'delete' | 'metadata' | null;

/**
 * Hook for managing modal state
 */
export function useModalState() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const openModal = (type: ModalType) => setActiveModal(type);
  const closeModal = () => setActiveModal(null);

  return {
    activeModal,
    openModal,
    closeModal,
    isRenameOpen: activeModal === 'rename',
    isDeleteOpen: activeModal === 'delete',
    isMetadataOpen: activeModal === 'metadata',
  };
}
