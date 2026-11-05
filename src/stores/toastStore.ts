import { create } from 'zustand';
import { ToastItem, ToastStoreState, ToastOptions, ToastVariant } from '@/core/components/Toast/types';

export const useToastStore = create<ToastStoreState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const variant: ToastVariant = toast.variant || (toast as any).type || 'info';
    const newToast: ToastItem = { ...toast, variant, id };

    set((state) => ({
      toasts: [...state.toasts.slice(-4), newToast], // Keep max 5 items
    }));

    return id;
  },
  removeToast: (id: string) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearToasts: () => set({ toasts: [] }),
}));

export const toast = (message: string, options?: ToastOptions & { variant?: ToastVariant }) => {
  return useToastStore.getState().addToast({
    message,
    title: options?.title,
    variant: options?.variant || 'info',
    duration: options?.duration ?? 4000,
    action: options?.action,
  });
};

toast.success = (message: string, options?: ToastOptions) => {
  return toast(message, { ...options, variant: 'success' });
};

toast.error = (message: string, options?: ToastOptions) => {
  return toast(message, { ...options, variant: 'error' });
};

toast.warning = (message: string, options?: ToastOptions) => {
  return toast(message, { ...options, variant: 'warning' });
};

toast.info = (message: string, options?: ToastOptions) => {
  return toast(message, { ...options, variant: 'info' });
};

toast.dismiss = (id: string) => {
  useToastStore.getState().removeToast(id);
};

toast.clear = () => {
  useToastStore.getState().clearToasts();
};

export const toastStore = useToastStore;

