import React, { useState, useEffect } from 'react';
import {
  Palette,
  RotateCcw,
  Sliders,
  Store,
  Check,
  Sun,
  Moon,
  Monitor,
  AlertTriangle,
  HardDrive,
  Sparkles,
} from 'lucide-react';
import {
  defaultAppConfig,
  type ThemePreset,
  type RadiusPreset,
  type ThemeMode,
  type FeatureFlags,
} from '@/config/appConfig';
import { useThemeStore } from '@/stores/themeStore';
import { cn } from '@/utils/cn';
import { systemService } from '@/services/systemService';
import { STORAGE_KEYS } from '@/services/storage/storageKeys';
import { StorageUsageReport } from '@/services/contracts/ISystemService';
import { Modal } from '@/core/components/Modal';
import { Switch } from '@/core/components/Switch';
import { Badge } from '@/core/components/Badge';
import { Button } from '@/core/components/Button';
import { toast } from '@/stores/toastStore';

const presetOptions: Array<{ id: ThemePreset; name: string; colorClass: string }> = [
  { id: 'emerald', name: 'Emerald (Ngọc lục bảo)', colorClass: 'bg-emerald-500' },
  { id: 'indigo', name: 'Indigo (Chàm hiện đại)', colorClass: 'bg-indigo-500' },
  { id: 'rose', name: 'Rose (Hồng thời trang)', colorClass: 'bg-rose-500' },
  { id: 'amber', name: 'Amber (Hổ phách ấm áp)', colorClass: 'bg-amber-500' },
  { id: 'slate', name: 'Slate (Xám sang trọng)', colorClass: 'bg-slate-700' },
];

const radiusOptions: Array<{ id: RadiusPreset; label: string }> = [
  { id: 'none', label: 'Vuông (0px)' },
  { id: 'sm', label: 'Nhỏ (4px)' },
  { id: 'md', label: 'Vừa (8px)' },
  { id: 'lg', label: 'Lớn (12px)' },
  { id: 'full', label: 'Bo tròn (Pill)' },
];

export const SettingsPage: React.FC = () => {
  const { mode, setMode, preset, setPreset, radius, setRadius } = useThemeStore();

  // Features initialized from LocalStorage or default
  const [features, setFeatures] = useState<FeatureFlags>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        return { ...defaultAppConfig.features, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback
    }
    return defaultAppConfig.features;
  });

  // Storage report
  const [storageReport, setStorageReport] = useState<StorageUsageReport | null>(null);

  // Reset modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    try {
      setStorageReport(systemService.getStorageReport());
    } catch {
      // ignore in non-browser
    }
  }, []);

  const handleToggleFeature = (key: keyof FeatureFlags) => {
    const updated = { ...features, [key]: !features[key] };
    setFeatures(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      toast.success(
        `Đã ${updated[key] ? 'bật' : 'tắt'} module [${key.toUpperCase()}] thành công!`
      );
    } catch {
      toast.error('Lỗi khi lưu cài đặt module.');
    }
  };

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      await systemService.resetDemoData();
      setIsResetModalOpen(false);
      setFeatures(defaultAppConfig.features);
      setStorageReport(systemService.getStorageReport());
      toast.success('Toàn bộ dữ liệu demo đã được khôi phục về trạng thái hạt giống ban đầu!');
    } catch (err) {
      toast.error('Có lỗi xảy ra khi đặt lại dữ liệu.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-black text-content-main tracking-tight">
          Cấu Hình Cửa Hàng & Theme Studio
        </h1>
        <p className="text-sm text-content-muted mt-0.5">
          Tùy chỉnh thông tin thương hiệu, giao diện động (CSS Variables tokens) và bật/tắt module tính năng D2C.
        </p>
      </div>

      {/* 1. Theme Studio */}
      <div className="p-6 rounded-theme bg-surface-card border border-border-base shadow-sm space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-border-base">
          <Palette className="w-5 h-5 text-primary" />
          <h2 className="text-base font-bold text-content-main">
            Theme Studio (Giao Diện Thời Gian Thực)
          </h2>
        </div>

        {/* 3-Way Mode Switcher (Light / Dark / System) */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-content-main uppercase tracking-wider">
            Chế độ giao diện (Theme Mode)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'light', label: 'Sáng (Light)', icon: Sun },
              { id: 'dark', label: 'Tối (Dark)', icon: Moon },
              { id: 'system', label: 'Hệ thống (System)', icon: Monitor },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id as ThemeMode)}
                className={cn(
                  'flex items-center justify-center gap-2 py-2.5 px-3 rounded-theme border text-xs font-semibold transition-all cursor-pointer',
                  mode === m.id
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-surface-subtle text-content-muted border-border-base hover:bg-border-base hover:text-content-main'
                )}
              >
                <m.icon className="w-4 h-4" />
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Color Presets */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-content-main uppercase tracking-wider">
            Bảng màu chủ đạo (Color Preset)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {presetOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPreset(opt.id)}
                className={cn(
                  'p-3 rounded-theme border text-xs font-medium flex flex-col items-center gap-2 transition-all text-center cursor-pointer',
                  preset === opt.id
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/10 text-primary font-bold shadow-xs'
                    : 'border-border-base hover:bg-surface-subtle text-content-main'
                )}
              >
                <span
                  className={cn(
                    'w-6 h-6 rounded-full shadow-xs flex items-center justify-center text-white',
                    opt.colorClass
                  )}
                >
                  {preset === opt.id && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </span>
                <span className="truncate w-full font-semibold">{opt.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Corner Radius */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-content-main uppercase tracking-wider">
            Độ bo góc giao diện (Corner Radius Scale)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {radiusOptions.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRadius(r.id)}
                className={cn(
                  'py-2 px-3 border text-xs font-medium transition-all text-center cursor-pointer',
                  r.id === 'none' && 'rounded-none',
                  r.id === 'sm' && 'rounded-sm',
                  r.id === 'md' && 'rounded-md',
                  r.id === 'lg' && 'rounded-lg',
                  r.id === 'full' && 'rounded-full',
                  radius === r.id
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/10 text-primary font-bold shadow-xs'
                    : 'border-border-base hover:bg-surface-subtle text-content-muted hover:text-content-main'
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Theme Preview Component */}
        <div className="pt-2 border-t border-border-base space-y-3">
          <label className="block text-xs font-bold text-content-main uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Xem Trước Giao Diện Mẫu (Live Token Preview)</span>
          </label>
          <div className="p-4 rounded-theme bg-surface-subtle border border-border-base flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" size="sm">
                Nút Bấm Chính
              </Button>
              <Button variant="outline" size="sm">
                Nút Viền
              </Button>
              <Badge variant="primary">Badge Chủ Đạo</Badge>
              <Badge variant="success">Badge Thành Công</Badge>
            </div>
            <div className="text-right">
              <span className="text-xs text-content-muted block">Giá bán demo:</span>
              <span className="text-base font-black text-primary">299.000 ₫</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Feature Module Switches */}
      <div className="p-6 rounded-theme bg-surface-card border border-border-base shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border-base">
          <Sliders className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-base font-bold text-content-main">
              Quản Lý Module Tính Năng (Feature Flags)
            </h2>
            <p className="text-xs text-content-muted mt-0.5">
              Bật hoặc tắt các phân hệ chức năng trên toàn bộ cửa hàng và lưu tự động vào LocalStorage.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-theme bg-surface-subtle border border-border-base">
            <Switch
              checked={features.reviews}
              onChange={() => handleToggleFeature('reviews')}
              label="Đánh giá & Bình luận sản phẩm (Reviews)"
              description="Cho phép khách hàng gửi xếp hạng sao và nhận xét"
            />
          </div>

          <div className="p-4 rounded-theme bg-surface-subtle border border-border-base">
            <Switch
              checked={features.flashSale}
              onChange={() => handleToggleFeature('flashSale')}
              label="Chương trình Flash Sale"
              description="Hiển thị đồng hồ đếm ngược và thanh tiến độ tồn kho"
            />
          </div>

          <div className="p-4 rounded-theme bg-surface-subtle border border-border-base">
            <Switch
              checked={features.coupons}
              onChange={() => handleToggleFeature('coupons')}
              label="Mã giảm giá & Khuyến mãi (Coupons)"
              description="Kích hoạt ô nhập voucher tại giỏ hàng và thanh toán"
            />
          </div>

          <div className="p-4 rounded-theme bg-surface-subtle border border-border-base">
            <Switch
              checked={features.wishlist}
              onChange={() => handleToggleFeature('wishlist')}
              label="Danh sách yêu thích (Wishlist)"
              description="Lưu các sản phẩm quan tâm để mua sắm sau"
            />
          </div>

          <div className="p-4 rounded-theme bg-surface-subtle border border-border-base sm:col-span-2">
            <Switch
              checked={features.supportChat}
              onChange={() => handleToggleFeature('supportChat')}
              label="Hỗ trợ trực tuyến & Hotline CSKH (Support Chat)"
              description="Kích hoạt widget tư vấn và nút gọi điện nhanh"
            />
          </div>
        </div>
      </div>

      {/* 3. Store Branding Info */}
      <div className="p-6 rounded-theme bg-surface-card border border-border-base shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border-base">
          <Store className="w-5 h-5 text-primary" />
          <h2 className="text-base font-bold text-content-main">Thông Tin Thương Hiệu Store</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-content-main mb-1">Tên cửa hàng</label>
            <input
              type="text"
              readOnly
              value={defaultAppConfig.store.name}
              className="w-full bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-content-main font-semibold"
            />
          </div>
          <div>
            <label className="block font-semibold text-content-main mb-1">Hotline CSKH</label>
            <input
              type="text"
              readOnly
              value={defaultAppConfig.store.hotline}
              className="w-full bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-content-main font-semibold"
            />
          </div>
          <div>
            <label className="block font-semibold text-content-main mb-1">Email hỗ trợ</label>
            <input
              type="text"
              readOnly
              value={defaultAppConfig.store.email}
              className="w-full bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-content-main font-semibold"
            />
          </div>
          <div>
            <label className="block font-semibold text-content-main mb-1">Địa chỉ trụ sở</label>
            <input
              type="text"
              readOnly
              value={defaultAppConfig.store.address}
              className="w-full bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-content-main font-semibold"
            />
          </div>
        </div>
      </div>

      {/* 4. LocalStorage Usage Report */}
      {storageReport && (
        <div className="p-6 rounded-theme bg-surface-card border border-border-base shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-content-main flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-primary" />
              <span>Dung Lượng LocalStorage (Quota Guard)</span>
            </h2>
            <span className="text-xs text-content-muted font-mono">
              Đã dùng: <strong className="text-content-main">{storageReport.usedFormatted}</strong> (
              {storageReport.usagePercentage.toFixed(1)}%)
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-surface-subtle rounded-full h-2.5 overflow-hidden">
            <div
              style={{ width: `${Math.min(100, storageReport.usagePercentage)}%` }}
              className={`h-full rounded-full transition-all ${
                storageReport.isCritical
                  ? 'bg-status-danger'
                  : storageReport.isNearLimit
                  ? 'bg-amber-500'
                  : 'bg-primary'
              }`}
            />
          </div>

          {/* Key breakdown pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            {storageReport.breakdown.slice(0, 6).map((item) => (
              <span
                key={item.key}
                className="px-2 py-1 rounded bg-surface-subtle text-content-muted border border-border-base text-[11px]"
              >
                <span className="font-mono text-content-main">{item.key.split(':')[1] || item.key}</span>:{' '}
                {item.formatted}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 5. 1-Click Reset Demo Data */}
      <div className="p-6 rounded-theme bg-surface-card border border-rose-500/30 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-status-danger">
          <RotateCcw className="w-5 h-5" />
          <h2 className="text-base font-bold">Khôi Phục Dữ Liệu Demo Gốc (Factory Reset)</h2>
        </div>
        <p className="text-xs text-content-muted leading-relaxed">
          Xóa toàn bộ các sản phẩm tạo mới, đơn hàng phát sinh và giỏ hàng trong LocalStorage và nạp lại bộ dữ liệu hạt giống (seed data) mẫu ban đầu cho toàn hệ thống.
        </p>
        <button
          type="button"
          onClick={() => setIsResetModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-theme bg-status-danger text-white text-xs font-bold hover:bg-red-700 shadow-sm transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Đặt lại toàn bộ dữ liệu demo</span>
        </button>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Khôi Phục Dữ Liệu Demo Gốc"
        size="md"
      >
        <div className="space-y-4 text-xs text-content-main">
          <div className="p-3.5 rounded-theme bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Cảnh báo hành động không thể hoàn tác!</div>
              <div className="text-[11px] text-rose-600/90 mt-0.5 leading-relaxed">
                Thao tác này sẽ xóa toàn bộ các sản phẩm, đơn hàng, khách hàng đã tạo trong phiên làm việc và nạp lại dữ liệu mẫu hạt giống gốc (24 sản phẩm, 12 đơn hàng, 10 khách hàng).
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="px-4 py-2 rounded-theme border border-border-base bg-surface-card hover:bg-surface-subtle text-xs font-semibold text-content-main transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              disabled={isResetting}
              onClick={handleConfirmReset}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-theme bg-status-danger text-white text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>{isResetting ? 'Đang khôi phục...' : 'Xác Nhận Đặt Lại'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsPage;
