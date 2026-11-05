import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  title: string;
  variantName?: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  image: string;
  sku?: string;
  stock?: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  couponCode: string;
  couponDiscount: number;
  note?: string;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setCouponCode: (code: string) => void;
  setCouponDiscount: (amount: number) => void;
  setNote: (note: string) => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(persist((set, get) => ({
  items: [],
  isOpen: false,
  couponCode: '',
  couponDiscount: 0,
  note: '',

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set({ isOpen: !get().isOpen }),

  addItem: (item) => {
    if (item.stock !== undefined && item.stock <= 0) return;
    const items = get().items;
    const existingIndex = items.findIndex(
      (i) => i.productId === item.productId && i.variantId === item.variantId
    );
    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity = Math.min(
        item.stock ?? Number.MAX_SAFE_INTEGER,
        updated[existingIndex].quantity + item.quantity
      );
      set({ items: updated });
    } else {
      const newItem: CartItem = {
        ...item,
        quantity: Math.max(1, Math.floor(Math.min(item.quantity, item.stock ?? Number.MAX_SAFE_INTEGER))),
        id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      };
      set({ items: [...items, newItem] });
    }
  },

  removeItem: (id) => {
    set({ items: get().items.filter((i) => i.id !== id) });
  },

  updateQuantity: (id, quantity) => {
    const item = get().items.find((cartItem) => cartItem.id === id);
    if (quantity <= 0 || (item?.stock !== undefined && item.stock <= 0)) {
      get().removeItem(id);
      return;
    }
    set({
      items: get().items.map((i) => (i.id === id
        ? { ...i, quantity: Math.max(1, Math.floor(Math.min(quantity, i.stock ?? Number.MAX_SAFE_INTEGER))) }
        : i)),
    });
  },

  clearCart: () => set({ items: [], couponCode: '', couponDiscount: 0, note: '' }),
  setCouponCode: (couponCode) => set({ couponCode }),
  setCouponDiscount: (couponDiscount) => set({ couponDiscount }),
  setNote: (note) => set({ note }),

  getTotalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
  getSubtotal: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
}), {
  name: 'd2c_ecommerce:cart:v1',
  partialize: ({ items, couponCode, couponDiscount, note }) => ({ items, couponCode, couponDiscount, note }) as CartState,
}));
