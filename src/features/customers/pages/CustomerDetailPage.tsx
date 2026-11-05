import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  UserX,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Award,
  Crown,
  Star,
  Sparkles,
  Save,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  Calendar,
  Tag,
  ExternalLink,
} from 'lucide-react';
import { Customer, CustomerTier } from '@/types/customer';
import { Order } from '@/types/order';
import { Badge } from '@/core/components/Badge';
import { customerService } from '@/services/api/customerService';
import { orderService } from '@/services/api/orderService';
import { formatCurrencyVND } from '@/utils/formatters';
import { toast } from '@/stores/toastStore';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Load customer profile from DAL
  useEffect(() => {
    let isMounted = true;
    async function loadCustomer() {
      if (!id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const found = await customerService.getCustomerById(id);
        if (isMounted) {
          if (found) {
            setCustomer(found);
            setNotes(found.notes || '');
          } else {
            setCustomer(null);
          }
        }
      } catch (err) {
        console.error('Lỗi tải thông tin khách hàng:', err);
        if (isMounted) setCustomer(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCustomer();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Load customer order history
  useEffect(() => {
    let isMounted = true;
    async function loadCustomerOrders() {
      if (!customer) return;
      setLoadingOrders(true);
      try {
        const res = await orderService.getOrders({ limit: 100 });
        if (isMounted) {
          const matched = res.data.filter(
            (o) =>
              (o.customerId && o.customerId === customer.id) ||
              o.customer.phone === customer.phone ||
              (o.customer.email && customer.email && o.customer.email.toLowerCase() === customer.email.toLowerCase())
          );
          setCustomerOrders(matched);
        }
      } catch (err) {
        console.error('Lỗi tải lịch sử đơn hàng của khách hàng:', err);
      } finally {
        if (isMounted) setLoadingOrders(false);
      }
    }

    if (customer) {
      loadCustomerOrders();
    }

    return () => {
      isMounted = false;
    };
  }, [customer]);

  const handleCopyPhone = () => {
    if (!customer?.phone) return;
    navigator.clipboard.writeText(customer.phone);
    setCopiedPhone(true);
    toast.success(`Đã sao chép SĐT: ${customer.phone}`);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleSaveNotes = async () => {
    if (!customer) return;
    setIsSavingNotes(true);
    try {
      const updated = await customerService.updateCustomer(customer.id, { notes });
      setCustomer(updated);
      toast.success('Đã lưu ghi chú khách hàng thành công!');
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu ghi chú.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!customer) return;
    const nextStatus = customer.status === 'active' ? 'blocked' : 'active';
    try {
      const updated = await customerService.updateCustomer(customer.id, {
        status: nextStatus,
      });
      setCustomer(updated);
      toast.info(
        `Đã ${nextStatus === 'active' ? 'mở khóa' : 'khóa'} tài khoản "${customer.name}"`
      );
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi thay đổi trạng thái tài khoản.');
    }
  };

  const renderTierBadge = (tier: CustomerTier) => {
    switch (tier) {
      case 'vip_gold':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Crown className="w-3.5 h-3.5" />
            <span>VIP Gold</span>
          </span>
        );
      case 'vip':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
            <Star className="w-3.5 h-3.5" />
            <span>VIP</span>
          </span>
        );
      case 'regular':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            <Award className="w-3.5 h-3.5" />
            <span>Thân Thiết</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Khách Mới</span>
          </span>
        );
    }
  };

  const renderOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Hoàn thành</Badge>;
      case 'shipping':
        return <Badge variant="info">Đang giao</Badge>;
      case 'processing':
        return <Badge variant="primary">Đóng gói</Badge>;
      case 'confirmed':
        return <Badge variant="primary">Đã xác nhận</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Đã hủy</Badge>;
      case 'pending':
      default:
        return <Badge variant="warning">Chờ xử lý</Badge>;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center text-content-muted space-y-3">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        <p className="text-xs font-semibold">Đang tải hồ sơ khách hàng #{id}...</p>
      </div>
    );
  }

  // Not Found empty state
  if (!customer) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Link
          to="/admin/customers"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-content-muted hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách khách hàng</span>
        </Link>
        <div className="p-12 text-center rounded-theme bg-surface-card border border-border-base space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-status-danger/10 text-status-danger flex items-center justify-center">
            <UserX className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-content-main">Không tìm thấy khách hàng</h2>
          <p className="text-xs text-content-muted max-w-md mx-auto">
            Không tìm thấy thông tin hồ sơ cho mã khách hàng "#{id}". Khách hàng có thể đã bị xóa hoặc đường dẫn không hợp lệ.
          </p>
          <div className="pt-2">
            <Link
              to="/admin/customers"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-theme bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về danh sách khách hàng</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const initials = customer.name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  const aov =
    customer.totalOrders > 0
      ? Math.round(customer.totalSpend / customer.totalOrders)
      : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/admin/customers"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-content-muted hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách khách hàng</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleStatus}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-theme border text-xs font-semibold shadow-xs transition-colors ${
              customer.status === 'active'
                ? 'border-status-danger/40 bg-status-danger/10 text-status-danger hover:bg-status-danger hover:text-white'
                : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-600 hover:text-white'
            }`}
          >
            {customer.status === 'active' ? (
              <>
                <XCircle className="w-3.5 h-3.5" />
                <span>Khóa tài khoản</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Kích hoạt lại</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="p-6 rounded-theme bg-surface-card border border-border-base space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xl shadow-xs flex-shrink-0">
              {customer.avatar ? (
                <img
                  src={customer.avatar}
                  alt={customer.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : initials ? (
                <span>{initials}</span>
              ) : (
                <User className="w-8 h-8" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-content-main">{customer.name}</h1>
                {renderTierBadge(customer.tier)}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                    customer.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {customer.status === 'active' ? 'Đang hoạt động' : 'Tài khoản đã khóa'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-content-muted">
                <span className="font-mono text-content-subtle font-semibold">#{customer.id}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Gia nhập: {new Date(customer.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-content-muted pt-2 border-t border-border-base">
          <div className="p-4 rounded-theme bg-surface-subtle space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-content-main">
                <Phone className="w-3.5 h-3.5 text-primary" />
                <span>Số điện thoại</span>
              </div>
              <button
                type="button"
                onClick={handleCopyPhone}
                className="text-content-muted hover:text-primary transition-colors p-1"
                title="Sao chép SĐT"
              >
                {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="font-mono text-sm font-semibold text-content-main">{customer.phone}</p>
          </div>

          <div className="p-4 rounded-theme bg-surface-subtle space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-content-main">
              <Mail className="w-3.5 h-3.5 text-primary" />
              <span>Hòm thư điện tử</span>
            </div>
            <p className="font-medium text-sm text-content-main truncate">
              <a href={`mailto:${customer.email}`} className="hover:text-primary transition-colors">
                {customer.email}
              </a>
            </p>
          </div>

          <div className="p-4 rounded-theme bg-surface-subtle space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-content-main">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>Địa chỉ chính</span>
            </div>
            <p className="text-content-main font-medium truncate">
              {customer.addresses && customer.addresses.length > 0
                ? customer.addresses.find((a) => a.isDefault)?.fullAddress || customer.addresses[0].fullAddress || `${customer.addresses[0].district}, ${customer.addresses[0].province}`
                : 'Chưa cập nhật'}
            </p>
          </div>
        </div>
      </div>

      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-theme bg-surface-card border border-border-base shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-content-muted">
            Tổng Chi Tiêu (LTV)
          </span>
          <div className="text-2xl font-black text-content-main">
            {formatCurrencyVND(customer.totalSpend)}
          </div>
          <p className="text-[11px] text-content-muted">
            Tổng doanh thu đóng góp từ trước đến nay
          </p>
        </div>

        <div className="p-5 rounded-theme bg-surface-card border border-border-base shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-content-muted">
            Tổng Số Đơn Hàng
          </span>
          <div className="text-2xl font-black text-content-main">
            {customer.totalOrders}{' '}
            <span className="text-sm font-normal text-content-muted">đơn</span>
          </div>
          <p className="text-[11px] text-content-muted">
            Số lượng đơn hoàn tất và đang giao dịch
          </p>
        </div>

        <div className="p-5 rounded-theme bg-surface-card border border-border-base shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-content-muted">
            Giá Trị TB / Đơn (AOV)
          </span>
          <div className="text-2xl font-black text-content-main">
            {formatCurrencyVND(aov)}
          </div>
          <p className="text-[11px] text-content-muted">
            Giá trị trung bình trên mỗi đơn phát sinh
          </p>
        </div>
      </div>

      {/* Address Book & Customer Tags */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Address Book */}
        <div className="p-5 rounded-theme bg-surface-card border border-border-base shadow-xs space-y-3">
          <h2 className="font-bold text-content-main uppercase text-xs tracking-wider flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary" />
            <span>Sổ Địa Chỉ Giao Hàng ({customer.addresses ? customer.addresses.length : 0})</span>
          </h2>

          {customer.addresses && customer.addresses.length > 0 ? (
            <div className="space-y-3">
              {customer.addresses.map((addr, idx) => (
                <div
                  key={addr.id || idx}
                  className="p-3.5 rounded-theme bg-surface-subtle border border-border-base space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-content-main">{addr.receiverName}</span>
                    {addr.isDefault && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <div className="text-content-muted">
                    <span className="font-medium text-content-main">SĐT:</span> {addr.phone}
                  </div>
                  <div className="text-content-muted leading-relaxed">
                    {addr.fullAddress ||
                      `${addr.street}, ${addr.ward}, ${addr.district}, ${addr.province}`}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-content-muted py-4 italic text-center">
              Chưa lưu địa chỉ nhận hàng nào.
            </div>
          )}
        </div>

        {/* Customer Tags & Admin Internal Notes */}
        <div className="space-y-6">
          {/* Customer Tags */}
          <div className="p-5 rounded-theme bg-surface-card border border-border-base shadow-xs space-y-3">
            <h2 className="font-bold text-content-main uppercase text-xs tracking-wider flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-primary" />
              <span>Thẻ Phân Khúc (Customer Tags)</span>
            </h2>

            {customer.tags && customer.tags.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {customer.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded text-xs font-semibold bg-surface-subtle text-content-main border border-border-base shadow-2xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-xs text-content-muted py-2 italic">
                Chưa gán thẻ phân khúc nào.
              </div>
            )}
          </div>

          {/* Admin Internal CSKH Notes */}
          <div className="p-5 rounded-theme bg-surface-card border border-border-base shadow-xs space-y-3">
            <h2 className="font-bold text-content-main uppercase text-xs tracking-wider flex items-center gap-1.5">
              <Save className="w-4 h-4 text-primary" />
              <span>Ghi Chú Nội Bộ CSKH</span>
            </h2>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú sở thích, thói quen mua sắm hoặc yêu cầu đặc biệt của khách hàng..."
              className="w-full bg-surface-subtle border border-border-base rounded-theme p-3 text-xs text-content-main focus:outline-none focus:ring-1 focus:ring-primary resize-y"
            />
            <div className="flex justify-end">
              <button
                type="button"
                disabled={isSavingNotes}
                onClick={handleSaveNotes}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-theme bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-xs transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingNotes ? 'Đang lưu...' : 'Lưu ghi chú CSKH'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Order History Table */}
      <div className="p-6 rounded-theme bg-surface-card border border-border-base shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-content-main uppercase text-xs tracking-wider flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-primary" />
            <span>Lịch Sử Đơn Hàng ({customerOrders.length})</span>
          </h2>
          <Link
            to="/admin/orders"
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            <span>Tất cả đơn hàng</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingOrders ? (
          <div className="py-8 text-center text-xs text-content-muted space-y-2">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            <p>Đang tải lịch sử đơn hàng...</p>
          </div>
        ) : customerOrders.length === 0 ? (
          <div className="p-8 rounded-theme bg-surface-subtle text-xs text-content-muted text-center space-y-2">
            <ShoppingBag className="w-8 h-8 mx-auto text-content-subtle opacity-40" />
            <p className="font-medium">Khách hàng chưa có đơn hàng nào trong hệ thống.</p>
            <p className="text-[11px] text-content-subtle">
              Các đơn hàng đặt qua Web hoặc tạo tại quầy sẽ được lưu trữ tự động tại đây.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-base">
            {customerOrders.map((ord) => (
              <div
                key={ord.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <Link
                      to={`/admin/orders/${ord.id}`}
                      className="font-bold text-sm text-primary hover:underline font-mono"
                    >
                      {ord.orderNumber}
                    </Link>
                    {renderOrderStatusBadge(ord.status)}
                  </div>
                  <div className="text-xs text-content-muted">
                    <span>{new Date(ord.createdAt).toLocaleDateString('vi-VN')}</span>
                    <span className="mx-1.5">•</span>
                    <span>
                      {ord.items.reduce((s, i) => s + i.quantity, 0)} sản phẩm
                    </span>
                    <span className="mx-1.5">•</span>
                    <span className="capitalize">
                      Phương thức: {ord.paymentMethod.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right flex-shrink-0">
                  <div className="font-bold text-sm text-content-main">
                    {formatCurrencyVND(ord.total)}
                  </div>
                  <div className="text-[11px] text-content-muted">
                    {ord.paymentStatus === 'paid' ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        Đã thanh toán
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        Chờ thanh toán
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetailPage;
