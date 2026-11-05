import { Customer, CustomerTier, PaginatedResponse, BaseFilter } from '@/types';

export interface CustomerQueryParams extends BaseFilter<Customer> {
  tier?: CustomerTier;
  phone?: string;
  email?: string;
}

export interface CustomerStats {
  totalCustomers: number;
  vipCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  totalRevenue: number;
}

export type CreateCustomerDTO = Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Customer, 'id'>>;
export type UpdateCustomerDTO = Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>;

export interface ICustomerService {
  getCustomers(params?: CustomerQueryParams): Promise<PaginatedResponse<Customer>>;
  getCustomerById(id: string): Promise<Customer | null>;
  getCustomerByEmail(email: string): Promise<Customer | null>;
  getCustomerByPhone(phone: string): Promise<Customer | null>;
  createCustomer(data: CreateCustomerDTO): Promise<Customer>;
  updateCustomer(id: string, data: UpdateCustomerDTO): Promise<Customer>;
  getCustomerStats(): Promise<CustomerStats>;
}
