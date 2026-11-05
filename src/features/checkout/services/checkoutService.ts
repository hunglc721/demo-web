import type { CartItem } from '@/stores/cartStore';
import { couponService } from '@/services/api/couponService';
import { orderService } from '@/services/api/orderService';
import { productService } from '@/services/api/productService';
import type { Order, OrderItem, PaymentMethod } from '@/types/order';
import type { Product } from '@/types/product';
import type { Coupon } from '@/types/coupon';
import { calculateShippingFee } from '@/config/shipping';

export interface CheckoutDetails {
  receiverName: string;
  phone: string;
  email?: string;
  street: string;
  province: string;
  district?: string;
  ward: string;
  paymentMethod: PaymentMethod;
  note?: string;
}

export async function createCheckoutOrder(
  items: CartItem[],
  details: CheckoutDetails,
  couponCode = ''
): Promise<Order> {
  if (!items.length) throw new Error('Giỏ hàng đang trống.');
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = calculateShippingFee(subtotal);
  const reserved = new Map<string, number>();
  const productsBefore = new Map<string, Product>();

  for (const item of items) {
    const product = await productService.getProductById(item.productId);
    if (!product) throw new Error(`Sản phẩm "${item.title}" không còn tồn tại.`);
    productsBefore.set(product.id, product);
    const key = `${item.productId}:${item.variantId || ''}`;
    const available = item.variantId
      ? product.variants.find(variant => variant.id === item.variantId)?.stock ?? 0
      : product.stock;
    const totalForVariant = (reserved.get(key) || 0) + item.quantity;
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || available < totalForVariant) {
      throw new Error(`"${item.title}" hiện không đủ tồn kho.`);
    }
    reserved.set(key, totalForVariant);
  }

  let discount = 0;
  let appliedCoupon: string | undefined;
  if (couponCode) {
    const validation = await couponService.validateCoupon(couponCode, subtotal, shippingFee);
    if (!validation.isValid) throw new Error(validation.message);
    discount = validation.discountAmount;
    appliedCoupon = validation.coupon?.code;
  }

  const orderItems: OrderItem[] = items.map(item => ({
    id: item.id, productId: item.productId, variantId: item.variantId,
    title: item.title, variantName: item.variantName, sku: item.sku || '',
    price: item.price, quantity: item.quantity, totalPrice: item.price * item.quantity, image: item.image,
  }));
  const fullAddress = [details.street, details.ward, details.district, details.province].filter(Boolean).join(', ');
  let createdOrder: Order | null = null;
  let couponBefore: Coupon | null = null;
  const inventoryTouched: Product[] = [];

  let paymentDetails: Order['paymentDetails'] = undefined;
  if (details.paymentMethod === 'vietqr') {
    paymentDetails = { bankName: 'MB Bank', accountNumber: '9999888826', accountName: 'D2C STORE VIETNAM' };
  } else if (details.paymentMethod === 'momo') {
    paymentDetails = { bankName: 'MoMo', accountNumber: '0918889999', accountName: 'D2C STORE VIETNAM' };
  } else if (details.paymentMethod === 'card') {
    paymentDetails = {
      bankName: 'Visa / MasterCard',
      transactionId: `TX_${Date.now().toString().slice(-8)}`,
      paidAt: new Date().toISOString(),
    };
  }

  try {
    createdOrder = await orderService.createOrder({
      customer: {
        name: details.receiverName, phone: details.phone, email: details.email || '',
        address: { id: `addr_${Date.now()}`, receiverName: details.receiverName, phone: details.phone, street: details.street, ward: details.ward, ...(details.district ? { district: details.district } : {}), province: details.province, fullAddress },
      },
      items: orderItems, subtotal, shippingFee, discount, couponCode: appliedCoupon,
      total: Math.max(0, subtotal + shippingFee - discount), status: 'pending',
      paymentMethod: details.paymentMethod,
      paymentStatus: details.paymentMethod === 'card' ? 'paid' : 'pending',
      notes: details.note || undefined,
      paymentDetails,
    });

    const productIds = [...new Set(items.map(item => item.productId))];
    for (const productId of productIds) {
      const product = productsBefore.get(productId);
      if (!product) continue;
      const purchased = items.filter(item => item.productId === productId);
      const variants = product.variants.map(variant => {
        const quantity = purchased.filter(item => item.variantId === variant.id).reduce((sum, item) => sum + item.quantity, 0);
        return quantity ? { ...variant, stock: Math.max(0, variant.stock - quantity) } : variant;
      });
      const totalPurchased = purchased.reduce((sum, item) => sum + item.quantity, 0);
      inventoryTouched.push(product);
      await productService.updateProduct(product.id, { stock: Math.max(0, product.stock - totalPurchased), variants });
    }

    if (appliedCoupon) {
      couponBefore = await couponService.getCouponByCode(appliedCoupon);
      if (couponBefore) await couponService.updateCoupon(couponBefore.id, { usedCount: couponBefore.usedCount + 1 });
    }
    return createdOrder;
  } catch (error) {
    const rollbackErrors: unknown[] = [];
    if (couponBefore) {
      try { await couponService.updateCoupon(couponBefore.id, { usedCount: couponBefore.usedCount }); }
      catch (rollbackError) { rollbackErrors.push(rollbackError); }
    }
    for (const product of inventoryTouched.reverse()) {
      try { await productService.updateProduct(product.id, { stock: product.stock, variants: product.variants }); }
      catch (rollbackError) { rollbackErrors.push(rollbackError); }
    }
    if (createdOrder) {
      try { await orderService.getRepository().delete(createdOrder.id); }
      catch (rollbackError) { rollbackErrors.push(rollbackError); }
    }
    if (rollbackErrors.length) {
      throw new Error(`Đặt hàng lỗi và rollback chưa hoàn tất. Kiểm tra đơn ${createdOrder?.orderNumber || 'mới nhất'} trước khi thử lại.`);
    }
    throw error;
  }
}
