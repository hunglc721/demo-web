import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Sun, Moon, ArrowLeft, LogIn, LogOut } from 'lucide-react';
import { defaultAppConfig } from '@/config/appConfig';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';

export const BlankLayout: React.FC = () => {
  const { mode, toggleMode } = useThemeStore();
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-surface-base text-content-main flex flex-col">
      {/* Minimal Header */}
      <header className="h-16 border-b border-border-base bg-surface-card px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs font-medium text-content-muted hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về trang chủ</span>
          </Link>

          <div className="h-4 w-px bg-border-base hidden sm:block" />

          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-theme bg-primary text-white flex items-center justify-center font-bold text-sm">
              D
            </div>
            <span className="font-bold text-base text-content-main">
              {defaultAppConfig.store.name}
            </span>
          </Link>
        </div>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-2 rounded-theme bg-surface-subtle px-2.5 py-1.5 text-xs text-content-main">
            <span className="max-w-32 truncate">{user.name}</span>
            <button type="button" onClick={logout} title="Đăng xuất" aria-label="Đăng xuất" className="text-content-muted hover:text-status-danger">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <Link to="/login" className="flex items-center gap-1.5 rounded-theme px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10">
            <LogIn className="h-3.5 w-3.5" />
            <span>Đăng nhập</span>
          </Link>
        )}

        {/* Theme Mode Toggle */}
        <button
          onClick={toggleMode}
          className="p-2 rounded-theme text-content-muted hover:text-content-main hover:bg-surface-subtle transition-colors"
          title={mode === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
        >
          {mode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Minimal Footer */}
      <footer className="py-4 text-center text-xs text-content-muted border-t border-border-base bg-surface-card">
        © {new Date().getFullYear()} {defaultAppConfig.store.name}. Bảo mật và mã hóa giao dịch an toàn.
      </footer>
    </div>
  );
};
