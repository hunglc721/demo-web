/**
 * Order Domain Service Implementation
 */

import {
  IOrderService,
  OrderQueryParams,
  CreateOrderDTO,
} from '../contracts/IOrderService';
import { Order, OrderStatus, PaymentStatus, PaginatedResponse, OrderTimelineEvent } from '@/types';
import { LocalStorageRepository } from '../mock/LocalStorageRepository';
import { STORAGE_KEYS } from '../storage/storageKeys';
import { seedOrders } from '../seed/ordersSeed';

export class OrderService implements IOrderService {
  private orderRepo: LocalStorageRepository<Order>;

  constructor() {
    this.orderRepo = new LocalStorageRepository<Order>(
      STORAGE_KEYS.ORDERS,
      seedOrders
    );
  }

  public getRepository(): LocalStorageRepository<Order> {
    return this.orderRepo;
  }

  public async getOrders(params?: OrderQueryParams): Promise<PaginatedResponse<Order>> {
    return this.orderRepo.getAll(params as any);
  }

  public async getOrderById(id: string): Promise<Order | null> {
    return this.orderRepo.getById(id);
  }

  public async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    const orders = await this.orderRepo.findMany();
    const found = orders.find((o) => o.orderNumber === orderNumber);
    return found ? { ...found } : null;
  }

  public async createOrder(data: CreateOrderDTO): Promise<Order> {
    const now = new Date().toISOString();
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const orderNumber = data.orderNumber || `ORD-2026-${randomSuffix}`;
    const id = data.id || orderNumber;

    const initialTimeline: OrderTimelineEvent[] = [
      {
        id: `tl_${id}_created`,
        status: data.status || 'pending',
        title: 'Đơn hàng được đặt thành công',
        description: `Đơn hàng ${orderNumber} đã được tạo bởi khách hàng ${data.customer.name}.`,
        timestamp: now,
        actor: data.customer.name || 'Khách hàng',
      },
    ];

    return this.orderRepo.create({
      ...data,
      id,
      orderNumber,
      status: data.status || 'pending',
      paymentStatus: data.paymentStatus || 'pending',
      timeline: initialTimeline,
    } as any);
  }

  public async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    note?: string,
    actor = 'Quản trị viên'
  ): Promise<Order> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) {
      throw new Error(`Không tìm thấy đơn hàng với mã "${orderId}".`);
    }

    const now = new Date().toISOString();
    const statusTitles: Record<OrderStatus, string> = {
      pending: 'Chờ xác nhận',
      confirmed: 'Xác nhận đơn hàng',
      processing: 'Đang đóng gói và chuẩn bị',
      shipping: 'Đã bàn giao đơn vị vận chuyển',
      completed: 'Giao hàng thành công',
      cancelled: 'Đã hủy đơn hàng',
    };

    const newEvent: OrderTimelineEvent = {
      id: `tl_${orderId}_${Date.now()}`,
      status,
      title: statusTitles[status] || status,
      description: note || `Đơn hàng đã được chuyển trạng thái sang [${statusTitles[status]}].`,
      timestamp: now,
      actor,
    };

    const updatedTimeline = [...order.timeline, newEvent];

    return this.orderRepo.update(orderId, {
      status,
      timeline: updatedTimeline,
    });
  }

  public async updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
    transactionId?: string
  ): Promise<Order> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) {
      throw new Error(`Không tìm thấy đơn hàng với mã "${orderId}".`);
    }

    const now = new Date().toISOString();
    const updatedDetails = {
      ...order.paymentDetails,
      ...(transactionId ? { transactionId } : {}),
      ...(paymentStatus === 'paid' ? { paidAt: now } : {}),
    };

    const timelineEvent: OrderTimelineEvent = {
      id: `tl_${orderId}_pay_${Date.now()}`,
      status: order.status,
      title: paymentStatus === 'paid' ? 'Thanh toán thành công' : `Cập nhật thanh toán: ${paymentStatus}`,
      description: paymentStatus === 'paid'
        ? `Đã nhận thanh toán ${order.total.toLocaleString('vi-VN')}₫ qua ${order.paymentMethod.toUpperCase()}${transactionId ? ` (Mã GD: ${transactionId})` : ''}.`
        : `Trạng thái thanh toán: ${paymentStatus}`,
      timestamp: now,
      actor: 'Hệ thống tự động',
    };

    return this.orderRepo.update(orderId, {
      paymentStatus,
      paymentDetails: updatedDetails,
      timeline: [...order.timeline, timelineEvent],
    });
  }

  public async cancelOrder(orderId: string, reason?: string, actor = 'Khách hàng'): Promise<Order> {
    return this.updateOrderStatus(
      orderId,
      'cancelled',
      reason ? `Lý do hủy: ${reason}` : 'Khách hàng yêu cầu hủy đơn.',
      actor
    );
  }
}

export const orderService = new OrderService();
