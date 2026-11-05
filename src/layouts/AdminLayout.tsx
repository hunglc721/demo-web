import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Megaphone,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sun,
  Moon,
  ExternalLink,
  Store,
  Palette,
  Shield,
  UserCheck,
  CheckCircle2,
  LogOut,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { defaultAppConfig, type ThemePreset } from '@/config/appConfig';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore, type UserRole } from '@/stores/authStore';
import { toast } from '@/stores/toastStore';

const rolePermissions: Record<UserRole, { title: string; desc: string; access: string[] }> = {
  admin: {
    title: 'Quản trị viên toàn quyền',
    desc: 'Truy cập đầy đủ mọi phân hệ quản trị và cấu hình',
    access: [
      'Quản trị Sản phẩm & Kho hàng',
      'Xử lý Đơn hàng & In hóa đơn VAT',
      'Quản lý Khách hàng & CRM',
      'Marketing Coupons & Khuyến mãi',
      'Theme Studio & Đặt lại Dữ liệu',
    ],
  },
  staff: {
    title: 'Nhân viên tác nghiệp',
    desc: 'Phụ trách xử lý vận đơn và hỗ trợ khách hàng',
    access: [
      'Xem danh mục Sản phẩm',
      'Cập nhật tiến độ Đơn hàng',
      'Xem thông tin Khách hàng',
      'Không thay đổi cài đặt hệ thống',
    ],
  },
  customer: {
    title: 'Khách hàng mua sắm',
    desc: 'Xem trước giao diện Admin dưới góc nhìn khách',
    access: [
      'Duyệt Catalog Storefront',
      'Đặt hàng COD & VietQR',
      'Tra cứu lịch sử đơn hàng',
      'Quyền Admin bị giới hạn',
    ],
  },
};

const navIcons: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="w-5 h-5 flex-shrink-0" />,
  Package: <Package className="w-5 h-5 flex-shrink-0" />,
  ShoppingCart: <ShoppingCart className="w-5 h-5 flex-shrink-0" />,
  Users: <Users className="w-5 h-5 flex-shrink-0" />,
  Megaphone: <Megaphone className="w-5 h-5 flex-shrink-0" />,
  Settings: <Settings className="w-5 h-5 flex-shrink-0" />,
};

const presetOptions: Array<{ id: ThemePreset; name: string; colorClass: string }> = [
  { id: 'emerald', name: 'Ngọc lục bảo', colorClass: 'bg-emerald-500' },
  { id: 'indigo', name: 'Chàm Indigo', colorClass: 'bg-indigo-500' },
  { id: 'rose', name: 'Hồng Rose', colorClass: 'bg-rose-500' },
  { id: 'amber', name: 'Hổ phách', colorClass: 'bg-amber-500' },
  { id: 'slate', name: 'Xám Slate', colorClass: 'bg-slate-700' },
];

export const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { mode, toggleMode, preset, setPreset } = useThemeStore();
  const { user, switchRole, logout } = useAuthStore();

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Tổng quan thống kê';
    if (path.includes('/products/new')) return 'Thêm sản phẩm mới';
    if (path.includes('/products')) return 'Quản lý sản phẩm';
    if (path.includes('/orders')) return 'Quản lý đơn hàng';
    if (path.includes('/customers')) return 'Danh sách khách hàng';
    if (path.includes('/marketing')) return 'Khuyến mãi & Marketing';
    if (path.includes('/settings')) return 'Cài đặt hệ thống';
    return 'Bảng điều khiển';
  };

  const roles: Array<{ key: UserRole; label: string; color: string }> = [
    { key: 'admin', label: 'Quản trị viên (Admin)', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
    { key: 'staff', label: 'Nhân viên bán hàng (Staff)', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
    { key: 'customer', label: 'Khách hàng (Customer)', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  ];

  const currentRoleConfig = roles.find((r) => r.key === user?.role) || roles[0];

  return (
    <div className="min-h-screen bg-surface-base text-content-main flex">
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 h-screen z-50 bg-surface-card border-r border-border-base flex flex-col transition-all duration-300',
          collapsed ? 'w-20' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-border-base flex items-center justify-between">
          <Link to="/admin/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-theme bg-primary/10 text-primary flex items-center justify-center font-bold text-lg flex-shrink-0">
              <Store className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-content-main truncate">
                  {defaultAppConfig.store.name}
                </span>
                <span className="text-[11px] text-content-muted font-medium uppercase tracking-wider">
                  Admin Portal
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-theme text-content-muted hover:bg-surface-subtle"
            aria-label="Đóng thanh điều hướng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          {defaultAppConfig.adminNav.map((item) => {
            const icon = navIcons[item.icon] || <Package className="w-5 h-5" />;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-theme text-sm font-medium transition-all group relative',
                    isActive
                      ? 'bg-primary text-white shadow-sm font-semibold'
                      : 'text-content-muted hover:text-content-main hover:bg-surface-subtle'
                  )
                }
                title={collapsed ? item.title : undefined}
              >
                {icon}
                {!collapsed && <span className="truncate">{item.title}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-border-base space-y-2">
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-theme text-xs font-medium text-content-muted hover:text-primary hover:bg-surface-subtle transition-colors',
              collapsed && 'justify-center'
            )}
            title="Xem cửa hàng D2C"
          >
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Xem Cửa Hàng</span>}
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-full items-center justify-center p-2 rounded-theme text-content-muted hover:bg-surface-subtle hover:text-content-main transition-colors"
            title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 sticky top-0 z-30 bg-surface-card/90 backdrop-blur-md border-b border-border-base px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-theme text-content-muted hover:bg-surface-subtle"
              aria-label="Mở menu điều hướng"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-content-muted hidden sm:inline">Admin</span>
              <span className="text-content-muted hidden sm:inline">/</span>
              <h1 className="font-semibold text-content-main text-base sm:text-lg">{getBreadcrumb()}</h1>
            </div>
          </div>

          {/* Topbar Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Preset Picker */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowPresetPicker(!showPresetPicker);
                  setShowRolePicker(false);
                }}
                className="p-2 rounded-theme text-content-muted hover:text-content-main hover:bg-surface-subtle transition-colors flex items-center gap-1.5"
                title="Thay đổi màu chủ đề"
              >
                <Palette className="w-4 h-4" />
                <span className="text-xs font-medium hidden md:inline capitalize">{preset}</span>
              </button>
              {showPresetPicker && (
                <div className="absolute right-0 mt-2 w-48 rounded-theme bg-surface-card border border-border-base shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
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

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleMode}
              className="p-2 rounded-theme text-content-muted hover:text-content-main hover:bg-surface-subtle transition-colors"
              title={mode === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            >
              {mode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Role Switcher & Profile Popover */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowRolePicker(!showRolePicker);
                  setShowPresetPicker(false);
                }}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-theme border text-xs font-medium transition-all cursor-pointer',
                  currentRoleConfig.color
                )}
                title="Đổi phân quyền tài khoản (Demo Role Switcher)"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-semibold">{user?.name}</span>
                <span className="uppercase text-[10px] tracking-wider font-bold">({user?.role})</span>
              </button>

              {showRolePicker && (
                <div className="absolute right-0 mt-2 w-80 rounded-theme bg-surface-card border border-border-base shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 space-y-4">
                  {/* User Profile Header */}
                  <div className="flex items-center gap-3 pb-3 border-b border-border-base">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {user?.name?.[0] || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-content-main truncate">
                        {user?.name}
                      </div>
                      <div className="text-[11px] text-content-muted truncate">{user?.email}</div>
                      <span className={cn('inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border', currentRoleConfig.color)}>
                        {user?.role}
                      </span>
                    </div>
                  </div>

                  {/* Permissions Reflection Preview */}
                  {user && rolePermissions[user.role] && (
                    <div className="p-3 rounded-theme bg-surface-subtle border border-border-base space-y-1.5">
                      <div className="font-bold text-[11px] text-content-main">
                        {rolePermissions[user.role].title}
                      </div>
                      <p className="text-[10px] text-content-muted">
                        {rolePermissions[user.role].desc}
                      </p>
                      <ul className="space-y-1 pt-1">
                        {rolePermissions[user.role].access.map((acc, idx) => (
                          <li
                            key={idx}
                            className="flex items-center gap-1.5 text-[10px] text-content-main"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                            <span>{acc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 1-Click Role Switcher */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-content-muted uppercase tracking-wider">
                      Chuyển phân quyền demo tức thì:
                    </div>
                    {roles.map((r) => (
                      <button
                        key={r.key}
                        onClick={() => {
                          switchRole(r.key);
                          setShowRolePicker(false);
                          toast.info(`Đã chuyển phân quyền sang: ${r.label}`);
                        }}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-theme text-xs font-semibold transition-colors text-left cursor-pointer',
                          user?.role === r.key
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'text-content-main hover:bg-surface-subtle border border-transparent'
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span className={cn('w-2 h-2 rounded-full', r.key === 'admin' ? 'bg-red-500' : r.key === 'staff' ? 'bg-blue-500' : 'bg-emerald-500')} />
                          <span>{r.label}</span>
                        </span>
                        {user?.role === r.key && <UserCheck className="w-3.5 h-3.5 text-primary" />}
                      </button>
                    ))}
                  </div>

                  {/* Logout Button */}
                  <div className="pt-2 border-t border-border-base">
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setShowRolePicker(false);
                        toast.info('Đã đăng xuất tài khoản.');
                        navigate('/login');
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-theme bg-surface-subtle hover:bg-rose-500/10 text-status-danger text-xs font-bold transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Đăng xuất tài khoản</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
