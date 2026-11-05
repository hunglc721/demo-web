import React, { useState } from 'react';
import { Modal } from '@/core/components/Modal';
import { Check, Copy, QrCode, ShieldAlert } from 'lucide-react';
import { formatCurrencyVND } from '@/utils/formatters';
import { toast } from '@/stores/toastStore';

export interface VietQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  amount: number;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}

export const VietQRModal: React.FC<VietQRModalProps> = ({
  isOpen,
  onClose,
  orderNumber,
  amount,
  bankName = 'MB Bank (Ngân hàng Quân Đội)',
  accountNumber = '9999888826',
  accountName = 'D2C STORE VIETNAM',
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const transferMemo = orderNumber;
  const qrUrl = `https://img.vietqr.io/image/MB-${accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
    transferMemo
  )}&accountName=${encodeURIComponent(accountName)}`;

  const copyText = async (text: string, key: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success(`Đã sao chép ${label}.`);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.info(text);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Thanh toán chuyển khoản VietQR"
      description="Quét mã QR bằng ứng dụng ngân hàng bất kỳ để hoàn tất thanh toán."
    >
      <div className="space-y-4 pt-1">
        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-theme border border-border-base">
          {!imageError ? (
            <img
              src={qrUrl}
              alt={`VietQR cho đơn hàng ${orderNumber}`}
              className="w-56 h-56 object-contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-56 h-56 flex flex-col items-center justify-center text-center p-4 bg-gray-50 text-gray-500 rounded border border-dashed border-gray-300">
              <QrCode className="w-12 h-12 text-primary mb-2 opacity-50" />
              <p className="text-xs font-semibold">Chế độ hiển thị ngoại tuyến</p>
              <p className="text-[10px] mt-1">
                Vui lòng chuyển khoản theo thông tin số tài khoản bên dưới
              </p>
            </div>
          )}
          <span className="text-[11px] text-gray-500 mt-2 font-medium">
            Mã QR chuẩn Napas 247 • MB Bank
          </span>
        </div>

        {/* Bank Account Info Table */}
        <div className="space-y-2 rounded-theme bg-surface-subtle p-3 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-border-base">
            <span className="text-content-muted">Ngân hàng:</span>
            <span className="font-semibold text-content-main">{bankName}</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-border-base">
            <span className="text-content-muted">Số tài khoản:</span>
            <div className="flex items-center gap-1.5 font-mono font-bold text-content-main">
              <span>{accountNumber}</span>
              <button
                type="button"
                onClick={() => copyText(accountNumber, 'acc', 'số tài khoản')}
                className="text-primary hover:opacity-80 p-0.5"
                title="Sao chép số tài khoản"
                aria-label="Sao chép số tài khoản"
              >
                {copiedKey === 'acc' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-border-base">
            <span className="text-content-muted">Chủ tài khoản:</span>
            <span className="font-semibold text-content-main uppercase">{accountName}</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-border-base">
            <span className="text-content-muted">Số tiền:</span>
            <div className="flex items-center gap-1.5 font-bold text-primary text-sm">
              <span>{formatCurrencyVND(amount)}</span>
              <button
                type="button"
                onClick={() => copyText(String(amount), 'amt', 'số tiền')}
                className="text-primary hover:opacity-80 p-0.5"
                title="Sao chép số tiền"
                aria-label="Sao chép số tiền"
              >
                {copiedKey === 'amt' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-content-muted">Nội dung chuyển:</span>
            <div className="flex items-center gap-1.5 font-mono font-bold text-content-main">
              <span>{transferMemo}</span>
              <button
                type="button"
                onClick={() => copyText(transferMemo, 'memo', 'nội dung chuyển khoản')}
                className="text-primary hover:opacity-80 p-0.5"
                title="Sao chép nội dung"
                aria-label="Sao chép nội dung"
              >
                {copiedKey === 'memo' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Demo Warning */}
        <div className="flex items-start gap-2 p-2.5 rounded-theme bg-amber-500/10 text-amber-700 text-xs border border-amber-500/20">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Đây là môi trường mô phỏng (UI-only). Vui lòng không thực hiện chuyển tiền thật.</span>
        </div>

        {/* Actions */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-theme bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors"
          >
            Đã hiểu & Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
};
