import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  Sun,
  Moon,
  Shield,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  QrCode,
  CreditCard,
  Truck,
  Palette,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { defaultAppConfig, type ThemePreset } from '@/config/appConfig';
import { useThemeStore } from '@/stores/themeStore';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { CartDrawer } from '@/features/cart/components/CartDrawer';

const presetOptions: Array<{ id: ThemePreset; name: string; colorClass: string }> = [
  { id: 'emerald', name: 'Ngọc lục bảo', colorClass: 'bg-emerald-500' },
  { id: 'indigo', name: 'Chàm Indigo', colorClass: 'bg-indigo-500' },
  { id: 'rose', name: 'Hồng Rose', colorClass: 'bg-rose-500' },
  { id: 'amber', name: 'Hổ phách', colorClass: 'bg-amber-500' },
  { id: 'slate', name: 'Xám Slate', colorClass: 'bg-slate-700' },
];

export const StorefrontLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPresetPicker, setShowPresetPicker] = useState(false);

  const { mode, toggleMode, preset, setPreset } = useThemeStore();
  const { getTotalItems, openCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const cartCount = getTotalItems();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-base text-content-main">
      {/* 1. Top Announcement Notification Banner */}
      <div className="bg-primary text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 flex-shrink-0 animate-bounce" />
        <span>Ưu đãi khai trương: Miễn phí vận chuyển toàn quốc cho đơn từ 299.000₫ & Tặng mã giảm 15%</span>
      </div>

      {/* 2. Sticky Header */}
      <header className="sticky top-0 z-40 bg-surface-card/95 backdrop-blur-md border-b border-border-base transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-4">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-theme text-content-muted hover:text-content-main hover:bg-surface-subtle"
              aria-label="Mở menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-9 h-9 rounded-theme bg-primary text-white flex items-center justify-center font-black text-xl shadow-sm">
                D
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight text-content-main leading-tight">
                  {defaultAppConfig.store.name}
                </span>
                <span className="text-[10px] text-primary font-semibold hidden sm:inline">
                  D2C Direct Store
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6">
              {defaultAppConfig.storefrontNav.headerLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    cn(
                      'text-sm font-medium transition-colors hover:text-primary',
                      isActive ? 'text-primary font-semibold' : 'text-content-muted',
                      link.isHighlight && 'text-primary font-semibold'
                    )
                  }
                >
                  {link.title}
                </NavLink>
              ))}
            </nav>

            {/* Search Input Bar (Desktop) */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative flex-1 max-w-xs">
              <input
                type="text"
                placeholder="Tìm sản phẩm, thương hiệu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-subtle border border-border-base rounded-theme pl-9 pr-4 py-1.5 text-sm placeholder:text-content-subtle text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
              <Search className="w-4 h-4 text-content-muted absolute left-3 pointer-events-none" />
            </form>

            {/* Actions: Theme, Admin Link, Cart */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Theme Preset Picker */}
              <div className="relative">
                <button
                  onClick={() => setShowPresetPicker(!showPresetPicker)}
                  className="p-2 rounded-theme text-content-muted hover:text-content-main hover:bg-surface-subtle transition-colors"
                  title="Đổi màu sắc chủ đề"
                >
                  <Palette className="w-4 h-4" />
                </button>
                {showPresetPicker && (
                  <div className="absolute right-0 mt-2 w-44 rounded-theme bg-surface-card border border-border-base shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="text-xs font-semibold text-content-muted px-2 py-1 uppercase tracking-wider">
                      Màu giao diện
                    </div>
                    {presetOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setPreset(opt.id);
                          setShowPresetPicker(false);
                        }}
                        className={cn(
                          'w-full flex items-center gap-2 px-2 py-1.5 rounded-theme text-xs font-medium transition-colors text-left',
                          preset === opt.id
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-content-main hover:bg-surface-subtle'
                        )}
                      >
                        <span className={cn('w-3 h-3 rounded-full', opt.colorClass)} />
                        <span>{opt.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dark/Light mode */}
              <button
                onClick={toggleMode}
                className="p-2 rounded-theme text-content-muted hover:text-content-main hover:bg-surface-subtle transition-colors"
                title={mode === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              >
                {mode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Admin Portal Quick Link */}
              <Link
                to="/admin/dashboard"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-theme text-xs font-medium bg-surface-subtle hover:bg-border-base text-content-main border border-border-base transition-colors"
                title={`Vào trang quản trị Admin (${user?.name})`}
              >
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span>{user?.role === 'admin' ? 'Admin' : user?.name || 'Admin'}</span>
              </Link>

              {/* Cart Button with live Badge */}
              <button
                type="button"
                onClick={openCart}
                className="relative p-2 rounded-theme bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center"
                title="Giỏ hàng"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-status-danger text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center animate-in zoom-in-75">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Slide-down Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border-base bg-surface-card px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
            {/* Mobile Search */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Tìm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-subtle border border-border-base rounded-theme pl-9 pr-4 py-2 text-sm text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <Search className="w-4 h-4 text-content-muted absolute left-3 top-3" />
            </form>

            <nav className="flex flex-col space-y-1">
              {defaultAppConfig.storefrontNav.headerLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'px-3 py-2 rounded-theme text-sm font-medium transition-colors',
                      isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-content-main hover:bg-surface-subtle',
                      link.isHighlight && 'text-primary'
                    )
                  }
                >
                  {link.title}
                </NavLink>
              ))}
              <Link
                to="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-theme text-sm font-medium text-primary hover:bg-surface-subtle flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                <span>Trang quản trị Admin</span>
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* 3. Main Outlet Container */}
      <main className="flex-1">
        <Outlet />
      </main>

      <CartDrawer />

      {/* 4. Responsive Footer */}
      <footer className="bg-surface-card border-t border-border-base mt-16 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Column 1 & 2: Brand Information */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-theme bg-primary text-white flex items-center justify-center font-bold text-lg">
                  D
                </div>
                <span className="font-bold text-lg text-content-main">{defaultAppConfig.store.name}</span>
              </div>
              <p className="text-sm text-content-muted max-w-sm leading-relaxed">
                {defaultAppConfig.store.brandSlogan}. Nền tảng bán hàng D2C tiên phong giúp các chủ shop xây dựng thương hiệu độc lập và bền vững.
              </p>

              <div className="space-y-2 text-xs text-content-muted pt-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>Hotline: <strong className="text-content-main">{defaultAppConfig.store.hotline}</strong> (8:00 - 21:00)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>Email: {defaultAppConfig.store.email}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{defaultAppConfig.store.address}</span>
                </div>
              </div>
            </div>

            {/* Dynamic Navigation Columns */}
            {defaultAppConfig.storefrontNav.footerColumns.map((col, idx) => (
              <div key={idx} className="space-y-3">
                <h3 className="text-xs font-semibold text-content-main uppercase tracking-wider">
                  {col.title}
                </h3>
                <ul className="space-y-2 text-sm text-content-muted">
                  {col.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <Link
                        to={link.path}
                        className="hover:text-primary transition-colors text-xs font-medium"
                      >
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Payment & Security Badges */}
          <div className="border-t border-border-base mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-content-muted">
            <div className="flex items-center gap-3">
              <span>Hỗ trợ thanh toán:</span>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-subtle border border-border-base font-semibold text-[11px] text-content-main">
                  <QrCode className="w-3 h-3 text-primary" /> VietQR
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-subtle border border-border-base font-semibold text-[11px] text-content-main">
                  <CreditCard className="w-3 h-3 text-primary" /> MoMo
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-subtle border border-border-base font-semibold text-[11px] text-content-main">
                  <Truck className="w-3 h-3 text-primary" /> COD
                </span>
              </div>
            </div>

            <p>© {new Date().getFullYear()} {defaultAppConfig.store.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
