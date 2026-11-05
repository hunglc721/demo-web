import { Order, OrderStatus, PaymentStatus, PaginatedResponse, BaseFilter } from '@/types';

export interface OrderQueryParams extends BaseFilter<Order> {
  customerId?: string;
  orderNumber?: string;
  paymentMethod?: string;
  paymentStatus?: PaymentStatus;
}

export type CreateOrderDTO = Omit<Order, 'id' | 'orderNumber' | 'timeline' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  orderNumber?: string;
};

export interface IOrderService {
  getOrders(params?: OrderQueryParams): Promise<PaginatedResponse<Order>>;
  getOrderById(id: string): Promise<Order | null>;
  getOrderByNumber(orderNumber: string): Promise<Order | null>;
  createOrder(data: CreateOrderDTO): Promise<Order>;
  updateOrderStatus(orderId: string, status: OrderStatus, note?: string, actor?: string): Promise<Order>;
  updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus, transactionId?: string): Promise<Order>;
  cancelOrder(orderId: string, reason?: string, actor?: string): Promise<Order>;
}
