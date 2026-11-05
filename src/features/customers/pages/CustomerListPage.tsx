import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Users,
  User,
  Crown,
  Star,
  Award,
  Sparkles,
  Eye,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  UserCheck,
  TrendingUp,
} from 'lucide-react';
import { customerService } from '@/services/api/customerService';
import { Customer, CustomerTier, CustomerStatus } from '@/types/customer';
import { CustomerStats } from '@/services/contracts/ICustomerService';
import { Pagination } from '@/core/components/Pagination';
import { formatCurrencyVND } from '@/utils/formatters';
import { matchesVietnameseSearch } from '@/utils/vietnameseSearch';
import { CustomerDetailDrawer } from '../components/CustomerDetailDrawer';
import { toast } from '@/stores/toastStore';

export const CustomerListPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    vipCustomers: 0,
    newCustomers: 0,
    activeCustomers: 0,
    totalRevenue: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTierTab, setSelectedTierTab] = useState<'all' | CustomerTier>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | CustomerStatus>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [refreshKey, setRefreshKey] = useState(0);

  // Drawer state
  const [drawerCustomer, setDrawerCustomer] = useState<Customer | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Load Customers & Stats from DAL
  useEffect(() => {
    let isMounted = true;
    async function loadCustomers() {
      setLoading(true);
      try {
        const [custRes, statsRes] = await Promise.all([
          customerService.getCustomers({ limit: 100 }),
          customerService.getCustomerStats(),
        ]);
        if (isMounted) {
          setCustomers(custRes.data);
          setStats(statsRes);
        }
      } catch (err) {
        console.error('Lỗi tải CRM khách hàng:', err);
        toast.error('Không thể tải danh sách khách hàng.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadCustomers();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Tier Counts
  const tierCounts = useMemo(() => {
    return {
      all: customers.length,
      vip_gold: customers.filter((c) => c.tier === 'vip_gold').length,
      vip: customers.filter((c) => c.tier === 'vip').length,
      regular: customers.filter((c) => c.tier === 'regular').length,
      new: customers.filter((c) => c.tier === 'new').length,
    };
  }, [customers]);

  // Filtering
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // 1. Tier Tab
      if (selectedTierTab !== 'all' && c.tier !== selectedTierTab) {
        return false;
      }

      // 2. Status
      if (selectedStatus !== 'all' && c.status !== selectedStatus) {
        return false;
      }

      // 3. Search (accent-insensitive)
      if (searchQuery.trim()) {
        const matched = matchesVietnameseSearch(
          [c.name, c.phone, c.email, ...(c.tags || []), c.notes || ''],
          searchQuery
        );
        if (!matched) return false;
      }

      return true;
    });
  }, [customers, selectedTierTab, selectedStatus, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  // Copy phone number
  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
    toast.success(`Đã sao chép SĐT: ${phone}`);
  };

  // Status toggle
  const handleToggleStatus = async (customer: Customer) => {
    const nextStatus = customer.status === 'active' ? 'blocked' : 'active';
    try {
      const updated = await customerService.updateCustomer(customer.id, {
        status: nextStatus,
      });
      setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toast.info(
        `Đã ${nextStatus === 'active' ? 'mở khóa' : 'khóa'} tài khoản "${customer.name}"`
      );
    } catch (err) {
      toast.error('Lỗi khi đổi trạng thái tài khoản.');
    }
  };

  // Render Tier Badge
  const renderTierBadge = (tier: CustomerTier) => {
    switch (tier) {
      case 'vip_gold':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Crown className="w-3.5 h-3.5" />
            <span>VIP Gold</span>
          </span>
        );
      case 'vip':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
            <Star className="w-3.5 h-3.5" />
            <span>VIP</span>
          </span>
        );
      case 'regular':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            <Award className="w-3.5 h-3.5" />
            <span>Thân Thiết</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Khách Mới</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-content-main tracking-tight">
            Quản Lý Khách Hàng (CRM)
          </h1>
          <p className="text-sm text-content-muted mt-0.5">
            Danh bạ khách hàng, phân hạng thành viên LTV và theo dõi tần suất mua sắm.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-theme border border-border-base bg-surface-card hover:bg-surface-subtle text-xs font-semibold text-content-main shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-theme bg-surface-card border border-border-base shadow-sm space-y-2 hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between text-content-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng khách hàng</span>
            <div className="p-2 rounded-theme bg-primary/10 text-primary">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-content-main tracking-tight">
            {stats.totalCustomers}{' '}
            <span className="text-xs font-normal text-content-muted">khách</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{stats.activeCustomers} đang hoạt động</span>
          </div>
        </div>

        <div className="p-5 rounded-theme bg-surface-card border border-border-base shadow-sm space-y-2 hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between text-content-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Khách hàng VIP</span>
            <div className="p-2 rounded-theme bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-content-main tracking-tight">
            {stats.vipCustomers}{' '}
            <span className="text-xs font-normal text-content-muted">thành viên</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Đóng góp &gt; 65% doanh thu</span>
          </div>
        </div>

        <div className="p-5 rounded-theme bg-surface-card border border-border-base shadow-sm space-y-2 hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between text-content-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Khách hàng mới</span>
            <div className="p-2 rounded-theme bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-content-main tracking-tight">
            {stats.newCustomers}{' '}
            <span className="text-xs font-normal text-content-muted">khách</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Gia nhập trong 30 ngày</span>
          </div>
        </div>

        <div className="p-5 rounded-theme bg-surface-card border border-border-base shadow-sm space-y-2 hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between text-content-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng doanh thu LTV</span>
            <div className="p-2 rounded-theme bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-content-main tracking-tight">
            {formatCurrencyVND(stats.totalRevenue)}
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Giá trị tích lũy toàn sàn</span>
          </div>
        </div>
      </div>

      {/* Tier Filter Tabs with Count Pills */}
      <div className="flex items-center gap-2 border-b border-border-base overflow-x-auto pb-px">
        {[
          { key: 'all', label: 'Tất cả khách hàng', count: tierCounts.all },
          { key: 'vip_gold', label: 'VIP Gold', count: tierCounts.vip_gold },
          { key: 'vip', label: 'VIP', count: tierCounts.vip },
          { key: 'regular', label: 'Thân Thiết', count: tierCounts.regular },
          { key: 'new', label: 'Khách Mới', count: tierCounts.new },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setSelectedTierTab(tab.key as any);
              setCurrentPage(1);
            }}
            className={`inline-flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-xs whitespace-nowrap transition-colors ${
              selectedTierTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-content-muted hover:text-content-main'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                selectedTierTab === tab.key
                  ? 'bg-primary/10 text-primary'
                  : 'bg-surface-subtle text-content-muted'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-theme bg-surface-card border border-border-base flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Tìm theo họ tên khách hàng, email, số điện thoại, tag phân khúc..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-surface-subtle border border-border-base rounded-theme pl-9 pr-8 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <Search className="w-4 h-4 text-content-muted absolute left-3 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-content-muted hover:text-content-main text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>

        <div className="w-full md:w-52">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="all">Trạng thái: Tất cả</option>
            <option value="active">Đang hoạt động</option>
            <option value="blocked">Đã khóa tài khoản</option>
          </select>
        </div>

        {(searchQuery || selectedTierTab !== 'all' || selectedStatus !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedTierTab('all');
              setSelectedStatus('all');
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-theme border border-border-base hover:bg-surface-subtle text-xs font-semibold text-content-muted hover:text-content-main transition-colors whitespace-nowrap"
          >
            Đặt lại bộ lọc
          </button>
        )}
      </div>

      {/* Customer Table */}
      <div className="rounded-theme border border-border-base bg-surface-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-base bg-surface-subtle text-content-muted font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5">Khách Hàng</th>
                <th className="py-3 px-3">Số Điện Thoại</th>
                <th className="py-3 px-3">Phân Hạng (Tier)</th>
                <th className="py-3 px-3 text-center">Số Đơn</th>
                <th className="py-3 px-3">Tổng Chi Tiêu (LTV)</th>
                <th className="py-3 px-3">Gia Nhập</th>
                <th className="py-3 px-3">Trạng Thái</th>
                <th className="py-3 px-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-content-muted">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mb-2" />
                    <p>Đang tải danh sách khách hàng...</p>
                  </td>
                </tr>
              ) : paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-content-muted">
                    <Users className="w-10 h-10 text-border-base mx-auto mb-2" />
                    <p className="text-xs font-semibold text-content-main">
                      Không tìm thấy khách hàng nào
                    </p>
                    <p className="text-[11px] text-content-muted mt-0.5">
                      Thử thay đổi từ khóa tìm kiếm hoặc phân hạng thành viên.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((cust) => {
                  const initials = cust.name
                    .split(' ')
                    .filter(Boolean)
                    .slice(-2)
                    .map((w) => w[0]?.toUpperCase())
                    .join('');

                  return (
                    <tr key={cust.id} className="hover:bg-surface-subtle transition-colors">
                      {/* Customer Name & Avatar */}
                      <td className="py-3.5 px-3.5 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {initials || <User className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => {
                                setDrawerCustomer(cust);
                                setIsDrawerOpen(true);
                              }}
                              className="font-bold text-content-main hover:text-primary transition-colors block truncate text-left"
                            >
                              {cust.name}
                            </button>
                            <div className="text-[11px] text-content-muted truncate mt-0.5">
                              {cust.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5 font-mono text-content-main">
                          <span>{cust.phone}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyPhone(cust.phone)}
                            className="text-content-muted hover:text-content-main p-0.5"
                            title="Sao chép SĐT"
                          >
                            {copiedPhone === cust.phone ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Tier Badge */}
                      <td className="py-3.5 px-3">{renderTierBadge(cust.tier)}</td>

                      {/* Orders Count */}
                      <td className="py-3.5 px-3 text-center font-bold text-content-main">
                        {cust.totalOrders}
                      </td>

                      {/* Total Spend */}
                      <td className="py-3.5 px-3 font-bold text-content-main">
                        {formatCurrencyVND(cust.totalSpend)}
                      </td>

                      {/* Date Joined */}
                      <td className="py-3.5 px-3 text-content-muted text-[11px]">
                        {new Date(cust.createdAt).toLocaleDateString('vi-VN')}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-3">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(cust)}
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                            cust.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                          }`}
                        >
                          {cust.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setDrawerCustomer(cust);
                              setIsDrawerOpen(true);
                            }}
                            className="p-1.5 rounded-theme text-content-muted hover:text-primary hover:bg-surface-subtle transition-colors"
                            title="Xem chi tiết khách hàng"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <Link
                            to={`/admin/customers/${cust.id}`}
                            className="p-1.5 rounded-theme text-content-muted hover:text-content-main hover:bg-surface-subtle transition-colors"
                            title="Xem trang riêng"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {filteredCustomers.length > itemsPerPage && (
          <div className="p-4 border-t border-border-base flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-content-muted">
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{' '}
              {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} trên tổng số{' '}
              {filteredCustomers.length} khách hàng
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={itemsPerPage}
              totalItems={filteredCustomers.length}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>

      {/* Customer Detail Drawer */}
      <CustomerDetailDrawer
        customer={drawerCustomer}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onCustomerUpdated={(updated) => {
          setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          setDrawerCustomer(updated);
        }}
      />
    </div>
  );
};

export default CustomerListPage;
