import React, { useState } from 'react';
import { Search, PackageCheck } from 'lucide-react';

export const OrderLookupPage: React.FC = () => {
  const [orderCode, setOrderCode] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Tra cứu đơn hàng ${orderCode} cho số điện thoại ${phone}. Hệ thống tra cứu realtime sẽ được kích hoạt tại M6.`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <PackageCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-content-main">Tra Cứu Đơn Hàng</h1>
        <p className="text-sm text-content-muted">
          Nhập mã đơn hàng và số điện thoại đặt hàng để theo dõi trạng thái giao vận.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-theme bg-surface-card border border-border-base shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-semibold text-content-main uppercase tracking-wider mb-1.5">
            Mã đơn hàng
          </label>
          <input
            type="text"
            required
            placeholder="VD: D2C-89234"
            value={orderCode}
            onChange={(e) => setOrderCode(e.target.value)}
            className="w-full bg-surface-subtle border border-border-base rounded-theme px-3.5 py-2.5 text-sm text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40 uppercase"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-content-main uppercase tracking-wider mb-1.5">
            Số điện thoại nhận hàng
          </label>
          <input
            type="tel"
            required
            placeholder="VD: 0912345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-surface-subtle border border-border-base rounded-theme px-3.5 py-2.5 text-sm text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 px-4 rounded-theme bg-primary text-white font-semibold hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
        >
          <Search className="w-4 h-4" />
          <span>Tra cứu trạng thái</span>
        </button>
      </form>
    </div>
  );
};
export default OrderLookupPage;
