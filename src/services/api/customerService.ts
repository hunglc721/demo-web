/**
 * Customer CRM Domain Service Implementation
 */

import {
  ICustomerService,
  CustomerQueryParams,
  CustomerStats,
  CreateCustomerDTO,
  UpdateCustomerDTO,
} from '../contracts/ICustomerService';
import { Customer, PaginatedResponse } from '@/types';
import { LocalStorageRepository } from '../mock/LocalStorageRepository';
import { STORAGE_KEYS } from '../storage/storageKeys';
import { seedCustomers } from '../seed/customersSeed';

export class CustomerService implements ICustomerService {
  private customerRepo: LocalStorageRepository<Customer>;

  constructor() {
    this.customerRepo = new LocalStorageRepository<Customer>(
      STORAGE_KEYS.CUSTOMERS,
      seedCustomers
    );
  }

  public getRepository(): LocalStorageRepository<Customer> {
    return this.customerRepo;
  }

  public async getCustomers(params?: CustomerQueryParams): Promise<PaginatedResponse<Customer>> {
    return this.customerRepo.getAll(params as any);
  }

  public async getCustomerById(id: string): Promise<Customer | null> {
    return this.customerRepo.getById(id);
  }

  public async getCustomerByEmail(email: string): Promise<Customer | null> {
    const customers = await this.customerRepo.findMany();
    const found = customers.find((c) => c.email.toLowerCase() === email.toLowerCase());
    return found ? { ...found } : null;
  }

  public async getCustomerByPhone(phone: string): Promise<Customer | null> {
    const customers = await this.customerRepo.findMany();
    const found = customers.find((c) => c.phone === phone);
    return found ? { ...found } : null;
  }

  public async createCustomer(data: CreateCustomerDTO): Promise<Customer> {
    return this.customerRepo.create({
      ...data,
      status: data.status || 'active',
      tier: data.tier || 'new',
      totalOrders: data.totalOrders || 0,
      totalSpend: data.totalSpend || 0,
      addresses: data.addresses || [],
      tags: data.tags || ['Khách hàng mới'],
    } as any);
  }

  public async updateCustomer(id: string, data: UpdateCustomerDTO): Promise<Customer> {
    return this.customerRepo.update(id, data as any);
  }

  public async getCustomerStats(): Promise<CustomerStats> {
    const customers = await this.customerRepo.findMany();

    const totalCustomers = customers.length;
    const vipCustomers = customers.filter((c) => c.tier === 'vip' || c.tier === 'vip_gold').length;
    const newCustomers = customers.filter((c) => c.tier === 'new').length;
    const activeCustomers = customers.filter((c) => c.status === 'active').length;
    const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpend || 0), 0);

    return {
      totalCustomers,
      vipCustomers,
      newCustomers,
      activeCustomers,
      totalRevenue,
    };
  }
}

export const customerService = new CustomerService();
