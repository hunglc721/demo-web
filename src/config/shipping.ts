export interface ShippingConfig {
  freeShippingThreshold: number; // 299,000 VND
  standardShippingFee: number;   // 30,000 VND
}

export const SHIPPING_CONFIG: ShippingConfig = {
  freeShippingThreshold: 299000,
  standardShippingFee: 30000,
};

export function calculateShippingFee(subtotal: number, threshold = SHIPPING_CONFIG.freeShippingThreshold): number {
  return subtotal >= threshold ? 0 : SHIPPING_CONFIG.standardShippingFee;
}
