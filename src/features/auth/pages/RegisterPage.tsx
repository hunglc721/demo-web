import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export const RegisterPage: React.FC = () => {
  const { switchRole } = useAuthStore();
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    switchRole('customer');
    navigate('/');
  };

  return (
    <div className="max-w-md w-full mx-auto p-8 rounded-theme bg-surface-card border border-border-base shadow-sm space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <UserPlus className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-content-main">Tạo Tài Khoản Mới</h1>
        <p className="text-xs text-content-muted">
          Đăng ký để nhận ưu đãi thành viên và theo dõi đơn hàng tiện lợi.
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-content-main uppercase tracking-wider mb-1.5">
            Họ và tên
          </label>
          <input
            type="text"
            required
            defaultValue="Nguyễn Văn A"
            className="w-full bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-content-main uppercase tracking-wider mb-1.5">
            Email
          </label>
          <input
            type="email"
            required
            defaultValue="nguyenvana@gmail.com"
            className="w-full bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-content-main uppercase tracking-wider mb-1.5">
            Mật khẩu
          </label>
          <input
            type="password"
            required
            defaultValue="12345678"
            className="w-full bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 px-4 rounded-theme bg-primary text-white font-semibold hover:bg-primary-hover shadow-sm transition-all text-xs flex items-center justify-center gap-2"
        >
          <span>Đăng Ký Tài Khoản</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      <div className="text-center text-xs text-content-muted pt-2 border-t border-border-base">
        <span>Đã có tài khoản? </span>
        <Link to="/login" className="text-primary font-semibold hover:underline">
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
};
export default RegisterPage;
