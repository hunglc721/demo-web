import { describe, test, beforeAll, beforeEach } from '../runner.mjs';
import { assert, assertEqual } from '../helpers/assertions.mjs';
import { useCartStore } from '../../../src/stores/cartStore.ts';
import { createCheckoutOrder } from '../../../src/features/checkout/services/checkoutService.ts';
import { productService } from '../../../src/services/api/productService.ts';
import { orderService } from '../../../src/services/api/orderService.ts';
import { couponService } from '../../../src/services/api/couponService.ts';
import { mockEngine } from '../../../src/services/mock/mockEngine.ts';
import { readFileSync } from 'node:fs';

const checkoutDetails = {
  receiverName: 'Nguyễn Văn An', phone: '0912345678', email: 'an@example.com',
  street: '12 Nguyễn Huệ', province: 'TP. Hồ Chí Minh', district: 'Quận 1',
  ward: 'Phường Bến Nghé', paymentMethod: 'cod', note: '',
};
const item = (overrides = {}) => ({
  id: 'cart-test-1', productId: 'prod_01', variantId: 'var_01_blk_m',
  title: 'Áo Polo', variantName: 'Đen / M', sku: 'POLO-01-BLK-M',
  price: 299000, quantity: 1, image: '/polo.jpg', stock: 12, ...overrides,
});

describe('M6 Checkout and Cart Workflows', () => {
  beforeAll(() => mockEngine.updateConfig({ delayEnabled: false, errorRate: 0, simulateOffline: false, simulateServerError: false }));
  beforeEach(() => {
    useCartStore.getState().clearCart();
    productService.getRepository().resetToSeed();
    orderService.getRepository().resetToSeed();
    couponService.getRepository().resetToSeed();
  });

  test('M6-64: adding the same product variant merges quantity without exceeding stock', () => {
    const cart = useCartStore.getState();
    cart.addItem(item({ quantity: 8 }));
    cart.addItem(item({ quantity: 8 }));
    assertEqual(useCartStore.getState().items.length, 1);
    assertEqual(useCartStore.getState().items[0].quantity, 12);
  });

  test('M6-65: separate variants remain separate cart lines', () => {
    const cart = useCartStore.getState();
    cart.addItem(item());
    cart.addItem(item({ id: 'cart-test-2', variantId: 'var_01_blk_l', variantName: 'Đen / L' }));
    assertEqual(useCartStore.getState().items.length, 2);
  });

  test('M6-65b: sold-out variants cannot be added', () => {
    useCartStore.getState().addItem(item({ stock: 0 }));
    assertEqual(useCartStore.getState().items.length, 0);
  });

  test('M6-66: decrementing quantity to zero removes the line and updates totals', () => {
    useCartStore.getState().addItem(item());
    const id = useCartStore.getState().items[0].id;
    useCartStore.getState().updateQuantity(id, 0);
    assertEqual(useCartStore.getState().items.length, 0);
    assertEqual(useCartStore.getState().getTotalItems(), 0);
  });

  test('M6-67: cart subtotal and item count include line quantities', () => {
    useCartStore.getState().addItem(item({ quantity: 2 }));
    assertEqual(useCartStore.getState().getSubtotal(), 598000);
    assertEqual(useCartStore.getState().getTotalItems(), 2);
  });

  test('M6-68: clearing the cart also clears an applied voucher', () => {
    const cart = useCartStore.getState();
    cart.addItem(item());
    cart.setCouponCode('CHAOBAN');
    cart.setCouponDiscount(29900);
    cart.clearCart();
    assertEqual(useCartStore.getState().couponCode, '');
    assertEqual(useCartStore.getState().couponDiscount, 0);
  });

  test('M6-69: coupon validation rejects codes that do not exist', async () => {
    const result = await couponService.validateCoupon('NO_SUCH_CODE', 500000);
    assertEqual(result.isValid, false);
    assertEqual(result.discountAmount, 0);
  });

  test('M6-70: checkout rejects a quantity above current variant stock without creating an order', async () => {
    const initialOrders = (await orderService.getOrders({ page: 1, pageSize: 1000 })).items.length;
    let rejected = false;
    try {
      await createCheckoutOrder([item({ quantity: 99 })], checkoutDetails);
    } catch (error) {
      rejected = error.message.includes('không đủ tồn kho');
    }
    assert(rejected, 'Checkout should reject unavailable stock');
    assertEqual((await orderService.getOrders({ page: 1, pageSize: 1000 })).items.length, initialOrders);
  });

  test('M6-70b: checkout compensates inventory and removes the new order if stock writing fails', async () => {
    const initialOrders = (await orderService.getOrders({ page: 1, pageSize: 1000 })).items.length;
    const originalUpdate = productService.updateProduct.bind(productService);
    let calls = 0;
    productService.updateProduct = async (...args) => {
      calls += 1;
      if (calls === 1) throw new Error('simulated inventory write failure');
      return originalUpdate(...args);
    };
    let rejected = false;
    try {
      await createCheckoutOrder([item()], checkoutDetails);
    } catch (error) {
      rejected = error.message.includes('simulated inventory write failure');
    } finally {
      productService.updateProduct = originalUpdate;
    }
    assert(rejected, 'The original stock failure should be reported after successful compensation');
    assertEqual((await orderService.getOrders({ page: 1, pageSize: 1000 })).items.length, initialOrders);
    assertEqual((await productService.getProductById('prod_01')).stock, 45);
  });

  test('M6 address data: includes all current provinces and linked commune/ward records', () => {
    const provinces = JSON.parse(readFileSync(new URL('../../../public/data/vietnam-provinces.json', import.meta.url), 'utf8'));
    const wards = JSON.parse(readFileSync(new URL('../../../public/data/vietnam-wards.json', import.meta.url), 'utf8'));
    assertEqual(provinces.length, 34);
    assertEqual(wards.length, 3321);
    assert(wards.every(ward => provinces.some(province => province.id === ward.parent.id)), 'Every commune/ward must reference a listed province');
  });

  test('M6-71: COD order records the recipient and consumes product and variant inventory', async () => {
    const created = await createCheckoutOrder([item()], checkoutDetails);
    const product = await productService.getProductById('prod_01');
    assertEqual(created.customer.phone, checkoutDetails.phone);
    assertEqual(created.paymentMethod, 'cod');
    assertEqual(created.status, 'pending');
    assertEqual(product.stock, 44);
    assertEqual(product.variants.find(variant => variant.id === 'var_01_blk_m').stock, 11);
  });

  test('M6-72: valid coupon discount is applied to the order and usage count', async () => {
    const created = await createCheckoutOrder([item()], checkoutDetails, 'CHAOBAN');
    const coupon = await couponService.getCouponByCode('CHAOBAN');
    assertEqual(created.discount, 29900);
    assertEqual(created.total, 269100);
    assertEqual(created.couponCode, 'CHAOBAN');
    assertEqual(coupon.usedCount, 143);
  });

  test('M6-73: VietQR order includes dynamic amount destination and transfer note', async () => {
    const created = await createCheckoutOrder([item()], { ...checkoutDetails, paymentMethod: 'vietqr' });
    assertEqual(created.paymentMethod, 'vietqr');
    assertEqual(created.paymentDetails.accountNumber, '9999888826');
    assertEqual(created.paymentDetails.accountName, 'D2C STORE VIETNAM');
    assert(created.orderNumber.length > 0, 'Order number is generated for the transfer note');
  });
});
