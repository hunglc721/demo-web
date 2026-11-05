/**
 * Customer CRM Domain Models
 */

import { CustomerAddress } from './order';

export type CustomerTier = 'new' | 'regular' | 'vip' | 'vip_gold';
export type CustomerStatus = 'active' | 'blocked';

export interface Customer {
  id: string; // e.g. "cust_01"
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  status: CustomerStatus;
  tier: CustomerTier;
  totalOrders: number;
  totalSpend: number;
  addresses: CustomerAddress[];
  tags: string[];
  notes?: string;
  lastOrderAt?: string;
  createdAt: string;
  updatedAt: string;
}
