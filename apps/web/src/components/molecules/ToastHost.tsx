import { ToastContainer } from '@/components/molecules/Toast';
import { useToastSnapshot } from '@/hooks/use-toast';

/** Single admin-shell mount point — do not render ToastContainer elsewhere. */
export function ToastHost() {
  const { toasts, dismissToast } = useToastSnapshot();
  return <ToastContainer toasts={toasts} onDismiss={dismissToast} />;
}
