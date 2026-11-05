import React from 'react';
import { Printer, X } from 'lucide-react';
import { Order } from '@/types/order';
import { Modal } from '@/core/components/Modal';
import { formatCurrencyVND } from '@/utils/formatters';
import { defaultAppConfig } from '@/config/appConfig';

export interface InvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Utility to convert numbers to Vietnamese currency words
 */
function numberToVietnameseWords(num: number): string {
  if (num === 0) return 'Không đồng';
  const units = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const scales = ['', 'nghìn', 'triệu', 'tỷ'];

  function readThreeDigits(n: number, isLast: boolean): string {
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;
    let res = '';

    if (h > 0 || !isLast) {
      res += `${units[h]} trăm `;
    }

    if (t > 1) {
      res += `${units[t]} mươi `;
      if (u === 1) res += 'mốt ';
      else if (u === 5) res += 'lăm ';
      else if (u > 0) res += `${units[u]} `;
    } else if (t === 1) {
      res += 'mười ';
      if (u === 1) res += 'một ';
      else if (u === 5) res += 'lăm ';
      else if (u > 0) res += `${units[u]} `;
    } else {
      if (h > 0 && u > 0) res += 'lẻ ';
      if (u > 0) res += `${units[u]} `;
    }

    return res.trim();
  }

  let temp = Math.abs(num);
  const groups: number[] = [];
  while (temp > 0) {
    groups.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  let words = '';
  for (let i = groups.length - 1; i >= 0; i--) {
    const val = groups[i];
    if (val > 0) {
      const part = readThreeDigits(val, i === groups.length - 1);
      words += `${part} ${scales[i]} `;
    }
  }

  words = words.trim();
  words = words.charAt(0).toUpperCase() + words.slice(1) + ' đồng chẵn';
  return words;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, isOpen, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const store = defaultAppConfig.store;
  const createdDate = new Date(order.createdAt).toLocaleDateString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="space-y-6">
        {/* Modal Top Actions (Hidden when printing) */}
        <div className="flex items-center justify-between pb-4 border-b border-border-base print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-content-main uppercase tracking-wider">
              Phiếu Giao Hàng & Hóa Đơn Bán Lẻ
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-theme bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Ngay (Print A4)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-theme text-content-muted hover:text-content-main hover:bg-surface-subtle transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div
          id="printable-invoice"
          className="p-8 bg-white text-gray-900 rounded-sm border border-gray-200 text-xs font-sans space-y-6 print:border-none print:p-0 print:m-0"
        >
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-gray-900 pb-5">
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-gray-900">
                {store.name}
              </h1>
              <p className="text-[11px] text-gray-600 mt-1 max-w-sm">
                Địa chỉ: {store.address}
              </p>
              <p className="text-[11px] text-gray-600">
                Hotline: <strong className="text-gray-900">{store.hotline}</strong> | Email: {store.email}
              </p>
            </div>

            <div className="text-right sm:self-center">
              {/* Barcode Mockup */}
              <div className="inline-block text-center bg-gray-50 p-2 border border-gray-200 rounded">
                <svg className="w-44 h-10 mx-auto" viewBox="0 0 160 40">
                  <rect x="0" y="0" width="3" height="32" fill="#000" />
                  <rect x="5" y="0" width="1" height="32" fill="#000" />
                  <rect x="8" y="0" width="4" height="32" fill="#000" />
                  <rect x="14" y="0" width="2" height="32" fill="#000" />
                  <rect x="18" y="0" width="1" height="32" fill="#000" />
                  <rect x="21" y="0" width="5" height="32" fill="#000" />
                  <rect x="28" y="0" width="2" height="32" fill="#000" />
                  <rect x="32" y="0" width="3" height="32" fill="#000" />
                  <rect x="37" y="0" width="1" height="32" fill="#000" />
                  <rect x="40" y="0" width="4" height="32" fill="#000" />
                  <rect x="46" y="0" width="2" height="32" fill="#000" />
                  <rect x="50" y="0" width="6" height="32" fill="#000" />
                  <rect x="58" y="0" width="2" height="32" fill="#000" />
                  <rect x="62" y="0" width="3" height="32" fill="#000" />
                  <rect x="67" y="0" width="1" height="32" fill="#000" />
                  <rect x="70" y="0" width="4" height="32" fill="#000" />
                  <rect x="76" y="0" width="5" height="32" fill="#000" />
                  <rect x="83" y="0" width="2" height="32" fill="#000" />
                  <rect x="87" y="0" width="3" height="32" fill="#000" />
                  <rect x="92" y="0" width="1" height="32" fill="#000" />
                  <rect x="95" y="0" width="4" height="32" fill="#000" />
                  <rect x="101" y="0" width="2" height="32" fill="#000" />
                  <rect x="105" y="0" width="5" height="32" fill="#000" />
                  <rect x="112" y="0" width="2" height="32" fill="#000" />
                  <rect x="116" y="0" width="4" height="32" fill="#000" />
                  <rect x="122" y="0" width="1" height="32" fill="#000" />
                  <rect x="125" y="0" width="3" height="32" fill="#000" />
                  <rect x="130" y="0" width="5" height="32" fill="#000" />
                  <rect x="137" y="0" width="2" height="32" fill="#000" />
                  <rect x="141" y="0" width="4" height="32" fill="#000" />
                  <rect x="147" y="0" width="2" height="32" fill="#000" />
                  <rect x="151" y="0" width="5" height="32" fill="#000" />
                  <rect x="158" y="0" width="2" height="32" fill="#000" />
                </svg>
                <span className="font-mono text-[10px] font-bold tracking-widest text-gray-700">
                  *{order.orderNumber}*
                </span>
              </div>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center space-y-1">
            <h2 className="text-lg font-black uppercase tracking-wider text-gray-900">
              PHIẾU GIAO HÀNG KIÊM HÓA ĐƠN BÁN LẺ D2C
            </h2>
            <div className="text-[11px] text-gray-600 font-medium">
              Số: <strong className="font-mono text-gray-900">{order.orderNumber}</strong> | Ngày đặt:{' '}
              {createdDate}
            </div>
          </div>

          {/* Consignee & Shipping Info (2 cols) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded bg-gray-50 border border-gray-200">
            <div className="space-y-1">
              <div className="font-bold uppercase text-[10px] text-gray-500 tracking-wider">
                Bên Nhận Hàng (Khách hàng)
              </div>
              <div className="font-bold text-gray-900 text-sm">{order.customer.name}</div>
              <div>Điện thoại: <strong className="text-gray-900">{order.customer.phone}</strong></div>
              <div>Email: {order.customer.email || 'Không có'}</div>
              <div>
                Địa chỉ: {order.customer.address?.fullAddress || `${order.customer.address?.street}, ${order.customer.address?.ward}, ${order.customer.address?.district}, ${order.customer.address?.province}`}
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-bold uppercase text-[10px] text-gray-500 tracking-wider">
                Thông Tin Thanh Toán & Giao Vận
              </div>
              <div>
                Hình thức thanh toán:{' '}
                <strong className="uppercase text-gray-900">
                  {order.paymentMethod === 'cod'
                    ? 'Thanh toán khi nhận hàng (COD)'
                    : order.paymentMethod === 'vietqr'
                    ? 'Chuyển khoản VietQR'
                    : order.paymentMethod === 'momo'
                    ? 'Ví MoMo'
                    : 'Thẻ thanh toán'}
                </strong>
              </div>
              <div>
                Trạng thái thanh toán:{' '}
                <span
                  className={`font-semibold ${
                    order.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {order.paymentStatus === 'paid' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN (THU HỘ COD)'}
                </span>
              </div>
              <div>Ghi chú đơn hàng: <em>{order.notes || 'Không có ghi chú'}</em></div>
              <div className="text-[11px] text-gray-600">
                Mã tra cứu: <span className="font-mono font-bold text-gray-900">{order.id}</span>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-gray-300 rounded overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 border-b border-gray-300 font-bold uppercase text-[10px] text-gray-700">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">STT</th>
                  <th className="py-2.5 px-3">Mã SKU</th>
                  <th className="py-2.5 px-3">Tên Sản Phẩm & Phân Loại</th>
                  <th className="py-2.5 px-3 text-center">SL</th>
                  <th className="py-2.5 px-3 text-right">Đơn Giá</th>
                  <th className="py-2.5 px-3 text-right">Thành Tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {order.items.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="py-2.5 px-3 text-center font-medium">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-gray-700">
                      {item.sku || 'N/A'}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-gray-900">{item.title}</div>
                      {item.variantName && (
                        <div className="text-[11px] text-gray-500 font-medium">
                          Phân loại: {item.variantName}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {formatCurrencyVND(item.price)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                      {formatCurrencyVND(item.totalPrice || item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="space-y-1.5 flex-1">
              <div className="text-xs text-gray-700">
                <strong>Số tiền viết bằng chữ:</strong>{' '}
                <span className="italic font-medium text-gray-900">
                  {numberToVietnameseWords(order.total)}
                </span>
              </div>
              <div className="text-[11px] text-gray-500 italic">
                * Giá bán đã bao gồm thuế Giá Trị Gia Tăng (VAT). Khách hàng được quyền kiểm tra hàng trước khi nhận và thanh toán.
              </div>
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-xs text-gray-700 border-t sm:border-t-0 pt-2 sm:pt-0">
              <div className="flex justify-between">
                <span>Tiền hàng (Tạm tính):</span>
                <span className="font-medium text-gray-900">{formatCurrencyVND(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Phí vận chuyển:</span>
                <span className="font-medium text-gray-900">
                  {order.shippingFee > 0 ? formatCurrencyVND(order.shippingFee) : 'Miễn phí'}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Giảm giá ({order.couponCode || 'Voucher'}):</span>
                  <span className="font-medium">-{formatCurrencyVND(order.discount)}</span>
                </div>
              )}
              <div className="border-t border-gray-300 pt-1.5 flex justify-between text-sm font-black text-gray-900">
                <span>TỔNG CỘNG:</span>
                <span className="text-base text-primary">{formatCurrencyVND(order.total)}</span>
              </div>
            </div>
          </div>

          {/* 3 Signature Blocks */}
          <div className="grid grid-cols-3 gap-4 pt-8 text-center text-xs border-t border-gray-300">
            <div>
              <div className="font-bold text-gray-900 uppercase text-[11px]">Người Lập Phiếu</div>
              <div className="text-[10px] text-gray-500 italic mt-0.5">(Ký, ghi rõ họ tên)</div>
              <div className="h-16 flex items-end justify-center font-semibold text-gray-700">
                Quản trị viên
              </div>
            </div>
            <div>
              <div className="font-bold text-gray-900 uppercase text-[11px]">Nhân Viên Giao Vận</div>
              <div className="text-[10px] text-gray-500 italic mt-0.5">(Ký, ghi rõ họ tên)</div>
              <div className="h-16 flex items-end justify-center font-semibold text-gray-700">
                ĐV Vận chuyển
              </div>
            </div>
            <div>
              <div className="font-bold text-gray-900 uppercase text-[11px]">Người Nhận Hàng</div>
              <div className="text-[10px] text-gray-500 italic mt-0.5">(Đồng kiểm, ký nhận)</div>
              <div className="h-16 flex items-end justify-center font-semibold text-gray-700">
                {order.customer.name}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default InvoiceModal;
