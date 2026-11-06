import React, { useState, useEffect } from 'react';
import {
  Truck,
  Search,
  Plus,
  Printer,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  XCircle,
  PackageCheck,
  X,
} from 'lucide-react';
import { formatCurrencyVND } from '@/utils/formatters';
import { STORAGE_KEYS } from '@/services/storage/storageKeys';
import { toast } from '@/stores/toastStore';
import { cn } from '@/utils/cn';

export type ShippingStatus =
  | 'ready_to_pick'
  | 'delivering'
  | 'delivered'
  | 'returning'
  | 'returned'
  | 'cancelled';

export interface ShippingSlip {
  id: string;
  trackingCode: string;
  carrier: 'GHN' | 'Viettel Post' | 'J&T Express';
  orderCode: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  codAmount: number;
  status: ShippingStatus;
  weightGrams: number;
  shippingFee: number;
  createdAt: string;
  estimatedDeliveryAt?: string;
  notes?: string;
}

const SEED_SHIPPING_SLIPS: ShippingSlip[] = [
  {
    id: 'slip_01',
    trackingCode: 'GHN-88291039',
    carrier: 'GHN',
    orderCode: 'ORD-2026-001',
    recipientName: 'Nguyễn Văn An',
    recipientPhone: '0901234567',
    recipientAddress: '123 Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    codAmount: 890000,
    status: 'delivering',
    weightGrams: 500,
    shippingFee: 32000,
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    estimatedDeliveryAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    notes: 'Gọi trước khi giao 15 phút',
  },
  {
    id: 'slip_02',
    trackingCode: 'VTP-99120481',
    carrier: 'Viettel Post',
    orderCode: 'ORD-2026-002',
    recipientName: 'Lê Thị Bình',
    recipientPhone: '0912345678',
    recipientAddress: '45 Lý Thường Kiệt, Quận Hoàn Kiếm, Hà Nội',
    codAmount: 0,
    status: 'ready_to_pick',
    weightGrams: 300,
    shippingFee: 28000,
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    notes: 'Khách đã thanh toán qua VietQR',
  },
  {
    id: 'slip_03',
    trackingCode: 'JNT-77401923',
    carrier: 'J&T Express',
    orderCode: 'ORD-2026-003',
    recipientName: 'Phạm Hùng Cường',
    recipientPhone: '0988776655',
    recipientAddress: '12 Lê Lợi, TP. Đà Nẵng',
    codAmount: 1450000,
    status: 'delivered',
    weightGrams: 800,
    shippingFee: 35000,
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    estimatedDeliveryAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
  {
    id: 'slip_04',
    trackingCode: 'GHN-88291040',
    carrier: 'GHN',
    orderCode: 'ORD-2026-004',
    recipientName: 'Đặng Thu Thảo',
    recipientPhone: '0977112233',
    recipientAddress: '88 Nguyễn Trãi, Quận Ninh Kiều, Cần Thơ',
    codAmount: 420000,
    status: 'returning',
    weightGrams: 350,
    shippingFee: 30000,
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    notes: 'Khách hẹn giao lại nhưng không nghe máy',
  },
];

const carrierStyles: Record<string, { bg: string; text: string; border: string }> = {
  GHN: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/20' },
  'Viettel Post': { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/20' },
  'J&T Express': { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20' },
};

const statusConfigs: Record<ShippingStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  ready_to_pick: {
    label: 'Chờ lấy hàng',
    bg: 'bg-amber-500/10 border-amber-500/20',
    text: 'text-amber-600 dark:text-amber-400',
    icon: <PackageCheck className="w-3.5 h-3.5" />,
  },
  delivering: {
    label: 'Đang giao',
    bg: 'bg-blue-500/10 border-blue-500/20',
    text: 'text-blue-600 dark:text-blue-400',
    icon: <Truck className="w-3.5 h-3.5" />,
  },
  delivered: {
    label: 'Đã giao',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  returning: {
    label: 'Chờ chuyển hoàn',
    bg: 'bg-purple-500/10 border-purple-500/20',
    text: 'text-purple-600 dark:text-purple-400',
    icon: <RotateCcw className="w-3.5 h-3.5" />,
  },
  returned: {
    label: 'Đã chuyển hoàn',
    bg: 'bg-slate-500/10 border-slate-500/20',
    text: 'text-slate-600 dark:text-slate-400',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  cancelled: {
    label: 'Huỷ giao',
    bg: 'bg-rose-500/10 border-rose-500/20',
    text: 'text-rose-600 dark:text-rose-400',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

export const ShippingSlipsPage: React.FC = () => {
  const [slips, setSlips] = useState<ShippingSlip[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | ShippingStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all'); // all, cod, prepaid
  const [printSlip, setPrintSlip] = useState<ShippingSlip | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New slip form state
  const [newCarrier, setNewCarrier] = useState<'GHN' | 'Viettel Post' | 'J&T Express'>('GHN');
  const [newOrderCode, setNewOrderCode] = useState('');
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newRecipientPhone, setNewRecipientPhone] = useState('');
  const [newRecipientAddress, setNewRecipientAddress] = useState('');
  const [newCodAmount, setNewCodAmount] = useState<number>(0);
  const [newWeight, setNewWeight] = useState<number>(500);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SHIPPING_SLIPS);
      if (raw) {
        setSlips(JSON.parse(raw));
      } else {
        localStorage.setItem(STORAGE_KEYS.SHIPPING_SLIPS, JSON.stringify(SEED_SHIPPING_SLIPS));
        setSlips(SEED_SHIPPING_SLIPS);
      }
    } catch {
      setSlips(SEED_SHIPPING_SLIPS);
    }
  }, []);

  const saveSlips = (updated: ShippingSlip[]) => {
    setSlips(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.SHIPPING_SLIPS, JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSlips = slips.filter((s) => {
    if (activeTab !== 'all' && s.status !== activeTab) return false;
    if (carrierFilter !== 'all' && s.carrier !== carrierFilter) return false;
    if (paymentFilter === 'cod' && s.codAmount <= 0) return false;
    if (paymentFilter === 'prepaid' && s.codAmount > 0) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTrack = s.trackingCode.toLowerCase().includes(q);
      const matchOrder = s.orderCode.toLowerCase().includes(q);
      const matchName = s.recipientName.toLowerCase().includes(q);
      const matchPhone = s.recipientPhone.includes(q);
      if (!matchTrack && !matchOrder && !matchName && !matchPhone) return false;
    }

    return true;
  });

  const getTabCount = (tab: 'all' | ShippingStatus) => {
    if (tab === 'all') return slips.length;
    return slips.filter((s) => s.status === tab).length;
  };

  const handleCreateSlip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderCode.trim() || !newRecipientName.trim() || !newRecipientPhone.trim()) {
      toast.warning('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }

    const randomSuffix = Math.floor(10000000 + Math.random() * 90000000);
    const prefix = newCarrier === 'GHN' ? 'GHN-' : newCarrier === 'Viettel Post' ? 'VTP-' : 'JNT-';

    const newSlip: ShippingSlip = {
      id: `slip_${Date.now()}`,
      trackingCode: `${prefix}${randomSuffix}`,
      carrier: newCarrier,
      orderCode: newOrderCode.trim().toUpperCase(),
      recipientName: newRecipientName.trim(),
      recipientPhone: newRecipientPhone.trim(),
      recipientAddress: newRecipientAddress.trim() || 'TP. Hồ Chí Minh',
      codAmount: Number(newCodAmount) || 0,
      status: 'ready_to_pick',
      weightGrams: Number(newWeight) || 500,
      shippingFee: 30000,
      createdAt: new Date().toISOString(),
      estimatedDeliveryAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    };

    saveSlips([newSlip, ...slips]);
    toast.success(`Đã tạo phiếu giao hàng mới với mã vận đơn: ${newSlip.trackingCode}`);
    setCreateModalOpen(false);
    // Reset form
    setNewOrderCode('');
    setNewRecipientName('');
    setNewRecipientPhone('');
    setNewRecipientAddress('');
    setNewCodAmount(0);
  };

  const handleUpdateStatus = (slipId: string, newStatus: ShippingStatus) => {
    const updated = slips.map((s) => (s.id === slipId ? { ...s, status: newStatus } : s));
    saveSlips(updated);
    toast.success('Đã cập nhật trạng thái vận đơn thành công.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-base pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-content-main tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" />
            <span>Phiếu giao hàng</span>
          </h1>
          <p className="text-xs sm:text-sm text-content-muted mt-1">
            Quản lý hoạt động vận chuyển của các đơn hàng.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-theme bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Tạo vận đơn mới</span>
        </button>
      </div>

      {/* 7 Tabs matching screenshot */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border-base pb-1">
        {(
          [
            { key: 'all', label: 'Tất cả' },
            { key: 'ready_to_pick', label: 'Chờ lấy hàng' },
            { key: 'delivering', label: 'Đang giao' },
            { key: 'delivered', label: 'Đã giao' },
            { key: 'returning', label: 'Chờ chuyển hoàn' },
            { key: 'returned', label: 'Đã chuyển hoàn' },
            { key: 'cancelled', label: 'Huỷ giao' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-3.5 py-2 text-xs font-semibold rounded-t-theme transition-colors border-b-2 whitespace-nowrap',
              activeTab === tab.key
                ? 'border-primary text-primary bg-primary/5 font-bold'
                : 'border-transparent text-content-muted hover:text-content-main'
            )}
          >
            {tab.label} ({getTabCount(tab.key)})
          </button>
        ))}
      </div>

      {/* Toolbar matching screenshot */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm phiếu giao hàng theo tên khách hàng, mã vận đơn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-subtle border border-border-base rounded-theme pl-9 pr-3 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Carrier Filter */}
          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            className="bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-xs text-content-main focus:outline-none cursor-pointer"
          >
            <option value="all">Tất cả đơn vị vận chuyển</option>
            <option value="GHN">Giao Hàng Nhanh (GHN)</option>
            <option value="Viettel Post">Viettel Post</option>
            <option value="J&T Express">J&T Express</option>
          </select>

          {/* Payment filter dropdown */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-xs text-content-main focus:outline-none cursor-pointer"
          >
            <option value="all">Tất cả thu tiền</option>
            <option value="cod">Thu hộ COD</option>
            <option value="prepaid">Đã thanh toán trước</option>
          </select>
        </div>
      </div>

      {/* Table or Empty State */}
      {filteredSlips.length === 0 ? (
        <div className="p-12 text-center rounded-theme bg-surface-card border border-border-base">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <Truck className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-content-main">Chưa có phiếu giao hàng nào</h3>
          <p className="text-xs text-content-muted mt-1 max-w-md mx-auto">
            Phiếu giao hàng sẽ xuất hiện ở đây khi bạn tạo vận đơn cho đơn hàng.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-theme border border-border-base bg-surface-card shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-subtle/80 border-b border-border-base text-content-muted font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">MÃ VẬN ĐƠN / ĐƠN VỊ</th>
                <th className="p-3">MÃ ĐƠN HÀNG</th>
                <th className="p-3">NGƯỜI NHẬN & ĐỊA CHỈ</th>
                <th className="p-3">THU HỘ COD</th>
                <th className="p-3">TRẠNG THÁI</th>
                <th className="p-3">NGÀY TẠO</th>
                <th className="p-3 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {filteredSlips.map((slip) => {
                const carrierConf = carrierStyles[slip.carrier] || carrierStyles['GHN'];
                const statusConf = statusConfigs[slip.status];
                return (
                  <tr key={slip.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3">
                      <div className="font-mono font-bold text-content-main">
                        {slip.trackingCode}
                      </div>
                      <span
                        className={cn(
                          'inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold border',
                          carrierConf.bg,
                          carrierConf.text,
                          carrierConf.border
                        )}
                      >
                        {slip.carrier}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-semibold text-primary">
                      {slip.orderCode}
                    </td>
                    <td className="p-3 max-w-xs">
                      <div className="font-semibold text-content-main">{slip.recipientName}</div>
                      <div className="text-[11px] text-content-muted font-mono">{slip.recipientPhone}</div>
                      <div className="text-[10px] text-content-muted truncate">{slip.recipientAddress}</div>
                    </td>
                    <td className="p-3">
                      {slip.codAmount > 0 ? (
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {formatCurrencyVND(slip.codAmount)}
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          0 ₫ (Đã thanh toán)
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border',
                          statusConf.bg,
                          statusConf.text
                        )}
                      >
                        {statusConf.icon}
                        <span>{statusConf.label}</span>
                      </span>
                    </td>
                    <td className="p-3 text-content-muted text-[11px]">
                      {new Date(slip.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-3 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => setPrintSlip(slip)}
                        className="p-1.5 rounded hover:bg-surface-subtle text-content-muted hover:text-content-main transition-colors"
                        title="In phiếu giao hàng (Shipping Label)"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <select
                        value={slip.status}
                        onChange={(e) => handleUpdateStatus(slip.id, e.target.value as ShippingStatus)}
                        className="bg-surface-subtle border border-border-base rounded px-1.5 py-1 text-[11px] text-content-main cursor-pointer"
                      >
                        <option value="ready_to_pick">Chờ lấy</option>
                        <option value="delivering">Đang giao</option>
                        <option value="delivered">Đã giao</option>
                        <option value="returning">Chờ hoàn</option>
                        <option value="returned">Đã hoàn</option>
                        <option value="cancelled">Huỷ giao</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Shipping Slip Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleCreateSlip}
            className="bg-surface-card border border-border-base rounded-theme shadow-2xl max-w-lg w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border-base pb-3">
              <h3 className="font-bold text-base text-content-main flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                <span>Tạo phiếu giao hàng mới</span>
              </h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded text-content-muted hover:text-content-main hover:bg-surface-subtle"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-content-main mb-1">
                    Đơn vị vận chuyển <span className="text-status-danger">*</span>
                  </label>
                  <select
                    value={newCarrier}
                    onChange={(e) => setNewCarrier(e.target.value as any)}
                    className="w-full bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="GHN">Giao Hàng Nhanh (GHN)</option>
                    <option value="Viettel Post">Viettel Post</option>
                    <option value="J&T Express">J&T Express</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-content-main mb-1">
                    Mã đơn hàng <span className="text-status-danger">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: ORD-2026-088"
                    value={newOrderCode}
                    onChange={(e) => setNewOrderCode(e.target.value)}
                    required
                    className="w-full bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-content-main font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-content-main mb-1">
                    Tên người nhận <span className="text-status-danger">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={newRecipientName}
                    onChange={(e) => setNewRecipientName(e.target.value)}
                    required
                    className="w-full bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-content-main mb-1">
                    Số điện thoại <span className="text-status-danger">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="0912345678"
                    value={newRecipientPhone}
                    onChange={(e) => setNewRecipientPhone(e.target.value)}
                    required
                    className="w-full bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-content-main font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-content-main mb-1">
                  Địa chỉ giao hàng chi tiết
                </label>
                <input
                  type="text"
                  placeholder="Số nhà, đường, phường, quận, tỉnh/thành..."
                  value={newRecipientAddress}
                  onChange={(e) => setNewRecipientAddress(e.target.value)}
                  className="w-full bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-content-main mb-1">
                    Tiền thu hộ COD (VND)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newCodAmount}
                    onChange={(e) => setNewCodAmount(Number(e.target.value))}
                    className="w-full bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-content-main font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-content-main mb-1">
                    Khối lượng (gram)
                  </label>
                  <input
                    type="number"
                    min={50}
                    value={newWeight}
                    onChange={(e) => setNewWeight(Number(e.target.value))}
                    className="w-full bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-base">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-3 py-1.5 rounded-theme border border-border-base text-xs font-semibold text-content-main hover:bg-surface-subtle"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-theme bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-sm"
              >
                Tạo vận đơn
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Print Slip Modal */}
      {printSlip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white text-gray-900 border border-gray-300 rounded-lg shadow-2xl max-w-md w-full p-6 space-y-4 font-sans">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-gray-800" />
                <span className="font-bold text-sm tracking-wide">PHIẾU GIAO HÀNG (LADISALES)</span>
              </div>
              <button
                onClick={() => setPrintSlip(null)}
                className="p-1 rounded text-gray-500 hover:text-black hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="text-center py-2 border-2 border-dashed border-gray-400 rounded">
                <div className="text-[10px] text-gray-500">MÃ VẬN ĐƠN</div>
                <div className="font-mono text-xl font-black tracking-widest">{printSlip.trackingCode}</div>
                <div className="text-[10px] font-bold text-gray-600 mt-1 uppercase">ĐVVC: {printSlip.carrier}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 border rounded">
                  <div className="font-bold text-gray-600">NGƯỜI GỬI:</div>
                  <div className="font-semibold">D2C Official Store</div>
                  <div>Hotline: 1900 6868</div>
                  <div>TP. Hồ Chí Minh</div>
                </div>
                <div className="p-2 border rounded">
                  <div className="font-bold text-gray-600">NGƯỜI NHẬN:</div>
                  <div className="font-semibold">{printSlip.recipientName}</div>
                  <div>SĐT: {printSlip.recipientPhone}</div>
                  <div className="line-clamp-2">{printSlip.recipientAddress}</div>
                </div>
              </div>

              <div className="p-2 border rounded bg-gray-50 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-gray-600">TIỀN THU HỘ (COD):</span>
                  <div className="text-base font-black text-red-600">{formatCurrencyVND(printSlip.codAmount)}</div>
                </div>
                <div className="text-right text-[11px]">
                  <div>Mã đơn: <span className="font-mono font-bold">{printSlip.orderCode}</span></div>
                  <div>Trọng lượng: <span className="font-semibold">{printSlip.weightGrams}g</span></div>
                </div>
              </div>

              {printSlip.notes && (
                <div className="text-[10px] text-gray-600 italic">
                  Ghi chú: {printSlip.notes}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setPrintSlip(null)}
                className="px-3 py-1.5 rounded border border-gray-300 text-xs font-semibold hover:bg-gray-100"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  window.print();
                  toast.success('Đã gửi lệnh in phiếu giao hàng!');
                }}
                className="inline-flex items-center gap-1 px-4 py-1.5 rounded bg-gray-900 text-white text-xs font-bold hover:bg-black"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In phiếu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingSlipsPage;
