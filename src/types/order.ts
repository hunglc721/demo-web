/**
 * Order & Timeline Domain Models
 */

export type OrderStatus =
  | 'pending' // Chờ xác nhận
  | 'confirmed' // Đã xác nhận
  | 'processing' // Đang đóng gói
  | 'shipping' // Đang giao hàng
  | 'completed' // Đã hoàn thành
  | 'cancelled'; // Đã hủy

export type PaymentMethod = 'cod' | 'vietqr' | 'momo' | 'card';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';
export type ShippingMethod = 'standard' | 'express';

export interface OrderItem {
  id: string;
  productId: string;
  variantId?: string;
  title: string;
  variantName?: string;
  sku: string;
  price: number;
  quantity: number;
  totalPrice: number;
  image: string;
}

export interface CustomerAddress {
  id: string;
  isDefault?: boolean;
  receiverName: string;
  phone: string;
  street: string;
  ward: string;
  district?: string;
  province: string;
  fullAddress: string;
}

export interface CustomerOrderInfo {
  name: string;
  phone: string;
  email: string;
  address: CustomerAddress;
  customerId?: string;
}

export interface OrderTimelineEvent {
  id: string;
  status: OrderStatus;
  title: string;
  description: string;
  timestamp: string; // ISO 8601
  actor: string; // "Khách hàng", "Hệ thống tự động", "Nguyễn Quản Trị"
}

export interface OrderPaymentDetails {
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  transactionId?: string;
  paidAt?: string;
  qrCodeUrl?: string;
}

export interface Order {
  id: string; // e.g. "ORD-2026-001"
  orderNumber: string;
  customerId?: string;
  customer: CustomerOrderInfo;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  couponCode?: string;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentDetails?: OrderPaymentDetails;
  notes?: string;
  timeline: OrderTimelineEvent[];
  createdAt: string;
  updatedAt: string;
}
