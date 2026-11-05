import React from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { defaultAppConfig } from '@/config/appConfig';

export const HelpPage: React.FC = () => {
  const faqs = [
    {
      q: 'Tôi có được kiểm tra hàng trước khi thanh toán không?',
      a: 'Hoàn toàn được! Bạn được mở gói hàng kiểm tra đúng mẫu mã, màu sắc trước khi thanh toán cho shipper (đồng kiểm).',
    },
    {
      q: 'Chính sách đổi trả trong vòng bao nhiêu ngày?',
      a: 'Chúng tôi hỗ trợ đổi trả miễn phí trong vòng 7 ngày kể từ khi nhận hàng nếu sản phẩm còn nguyên tem mác hoặc có lỗi do nhà sản xuất.',
    },
    {
      q: 'Thời gian giao hàng là bao lâu?',
      a: 'Nội thành TP.HCM và Hà Nội: 1-2 ngày làm việc. Các tỉnh thành khác: 2-4 ngày làm việc.',
    },
    {
      q: 'Làm sao để liên hệ hỗ trợ khẩn cấp?',
      a: `Bạn có thể gọi ngay hotline ${defaultAppConfig.store.hotline} hoặc gửi email tới ${defaultAppConfig.store.email}.`,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-content-main">Trung Tâm Trợ Giúp & FAQ</h1>
        <p className="text-sm text-content-muted">Câu hỏi thường gặp và chính sách hỗ trợ khách hàng</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className="p-5 rounded-theme bg-surface-card border border-border-base space-y-2">
            <h2 className="font-semibold text-sm text-content-main flex items-center justify-between">
              <span>{faq.q}</span>
              <ChevronDown className="w-4 h-4 text-content-muted" />
            </h2>
            <p className="text-xs text-content-muted leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
export default HelpPage;
