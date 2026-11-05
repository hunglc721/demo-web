import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuthStore, type UserRole } from '@/stores/authStore';

export const LoginPage: React.FC = () => {
  const location = useLocation();
  const checkoutRedirect = location.state?.from?.pathname === '/checkout';
  const [role, setRole] = useState<UserRole>(checkoutRedirect ? 'customer' : 'admin');
  const { switchRole } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    switchRole(role);
    if (role === 'admin' || role === 'staff') {
      navigate('/admin/dashboard');
    } else {
      navigate(checkoutRedirect ? '/checkout' : '/');
    }
  };

  return (
    <div className="max-w-md w-full mx-auto p-8 rounded-theme bg-surface-card border border-border-base shadow-sm space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-content-main">Đăng Nhập Hệ Thống</h1>
        <p className="text-xs text-content-muted">
          Chế độ UI_ONLY hỗ trợ 1-click chuyển đổi vai trò người dùng để trải nghiệm đầy đủ.
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-content-main uppercase tracking-wider mb-1.5">
            Chọn vai trò đăng nhập demo
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['admin', 'staff', 'customer'] as UserRole[]).map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRole(r)}
                className={`py-2 px-3 rounded-theme border text-xs font-semibold uppercase tracking-wider transition-all ${
                  role === r
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface-subtle text-content-muted border-border-base hover:bg-border-base'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-content-main uppercase tracking-wider mb-1.5">
            Email
          </label>
          <div className="relative">
            <input
              type="email"
              value={role === 'admin' ? 'admin@d2cstarter.vn' : role === 'staff' ? 'staff@d2cstarter.vn' : 'khachhang@gmail.com'}
              readOnly
              className="w-full bg-surface-subtle border border-border-base rounded-theme pl-9 pr-3 py-2 text-xs text-content-main"
            />
            <Mail className="w-4 h-4 text-content-muted absolute left-3 top-2.5" />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 px-4 rounded-theme bg-primary text-white font-semibold hover:bg-primary-hover shadow-sm transition-all text-xs flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Đăng Nhập Với Quyền {role.toUpperCase()}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      <div className="text-center text-xs text-content-muted pt-2 border-t border-border-base">
        <span>Chưa có tài khoản? </span>
        <Link to="/register" className="text-primary font-semibold hover:underline">
          Đăng ký ngay
        </Link>
      </div>
    </div>
  );
};
export default LoginPage;
