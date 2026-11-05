import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, Sun, Moon, Sparkles, X, Menu, Shield } from 'lucide-react';
import { defaultAppConfig } from '@/config/appConfig';
import { useThemeStore } from '@/stores/themeStore';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { productService } from '@/services/api/productService';
import { Product } from '@/types/product';
import { formatCurrencyVND } from '@/utils/formatters';
import { cn } from '@/utils/cn';

export interface HeaderBlockProps {
  settings?: {
    announcementText?: string;
    showAnnouncement?: boolean;
    sticky?: boolean;
  };
}

export const HeaderBlock: React.FC<HeaderBlockProps> = ({ settings }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const { mode, toggleMode } = useThemeStore();
  const { getTotalItems } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const cartCount = getTotalItems();
  const showAnnouncement = settings?.showAnnouncement !== false;
  const announcementText =
    settings?.announcementText ||
    'Ưu đãi khai trương: Miễn phí vận chuyển toàn quốc cho đơn từ 299.000₫ & Tặng mã giảm 15%';

  // Live search debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await productService.getProducts({
          search: searchQuery.trim(),
          pageSize: 5,
        });
        setSearchResults(res.items);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside search container
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowDropdown(false);
      navigate(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="w-full">
      {/* 1. Top Announcement Notification Banner */}
      {showAnnouncement && (
        <div className="bg-primary text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0 animate-bounce" />
          <span>{announcementText}</span>
        </div>
      )}

      {/* 2. Header */}
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

            {/* Search Input Bar with Live Dropdown (Desktop) */}
            <div ref={searchContainerRef} className="hidden md:block relative flex-1 max-w-sm">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Tìm sản phẩm, thương hiệu..."
                  value={searchQuery}
                  onFocus={() => setShowDropdown(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  className="w-full bg-surface-subtle border border-border-base rounded-theme pl-9 pr-4 py-1.5 text-sm placeholder:text-content-subtle text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
                <Search className="w-4 h-4 text-content-muted absolute left-3 top-2.5 pointer-events-none" />
              </form>

              {/* Live Search Suggestions Dropdown */}
              {showDropdown && searchQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 mt-2 rounded-theme bg-surface-card border border-border-base shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="text-[11px] font-semibold text-content-muted px-2 py-1 uppercase tracking-wider flex justify-between">
                    <span>Gợi ý tìm kiếm</span>
                    {isSearching && <span className="animate-pulse">Đang tìm...</span>}
                  </div>

                  {searchResults.length > 0 ? (
                    <div className="divide-y divide-border-base/50">
                      {searchResults.map((p) => (
                        <Link
                          key={p.id}
                          to={`/product/${p.slug}`}
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-3 p-2 rounded-theme hover:bg-surface-subtle transition-colors group"
                        >
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="w-10 h-10 object-cover rounded bg-surface-subtle flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-content-main truncate group-hover:text-primary">
                              {p.name}
                            </p>
                            <p className="text-[11px] font-bold text-primary">
                              {formatCurrencyVND(p.price)}
                            </p>
                          </div>
                        </Link>
                      ))}
                      <div className="pt-2 text-center">
                        <button
                          type="button"
                          onClick={handleSearchSubmit}
                          className="text-xs text-primary font-semibold hover:underline"
                        >
                          Xem tất cả kết quả cho "{searchQuery}"
                        </button>
                      </div>
                    </div>
                  ) : !isSearching ? (
                    <div className="p-4 text-center text-xs text-content-muted">
                      Không tìm thấy sản phẩm phù hợp
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Actions: Theme Toggle, Admin Link, Cart */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Dark/Light mode */}
              <button
                onClick={toggleMode}
                className="p-2 rounded-theme text-content-muted hover:text-content-main hover:bg-surface-subtle transition-colors"
                title={mode === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              >
                {mode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Admin Portal Link */}
              <Link
                to="/admin/dashboard"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-theme text-xs font-medium bg-surface-subtle hover:bg-border-base text-content-main border border-border-base transition-colors"
                title={`Vào trang quản trị Admin (${user?.name})`}
              >
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span>Admin</span>
              </Link>

              {/* Cart Button with live Badge */}
              <Link
                to="/cart"
                className="relative p-2 rounded-theme bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center"
                title="Giỏ hàng"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-status-danger text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center animate-in zoom-in-75">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Slide-down Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border-base bg-surface-card px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
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
    </div>
  );
};
export default HeaderBlock;
