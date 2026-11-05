import React from 'react';
import { defaultAppConfig } from '@/config/appConfig';
import { Award, Target, Users2 } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold text-content-main">Về {defaultAppConfig.store.name}</h1>
        <p className="text-base text-content-muted max-w-2xl mx-auto">
          {defaultAppConfig.store.brandSlogan}
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none text-content-muted text-sm leading-relaxed space-y-4">
        <p>
          Chào mừng bạn đến với {defaultAppConfig.store.name}! Chúng tôi là thương hiệu D2C (Direct-to-Consumer) trực tiếp kết nối từ xưởng sản xuất chất lượng cao đến tay người tiêu dùng Việt Nam, loại bỏ các chi phí trung gian không cần thiết để đem lại giá trị sản phẩm thực chất nhất.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <div className="p-6 rounded-theme bg-surface-card border border-border-base text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Target className="w-6 h-6" />
          </div>
          <h2 className="font-bold text-sm text-content-main">Sứ Mệnh</h2>
          <p className="text-xs text-content-muted">Nâng tầm trải nghiệm mua sắm trực tuyến minh bạch, tiện lợi.</p>
        </div>
        <div className="p-6 rounded-theme bg-surface-card border border-border-base text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Award className="w-6 h-6" />
          </div>
          <h2 className="font-bold text-sm text-content-main">Cam Kết</h2>
          <p className="text-xs text-content-muted">100% nguyên bản, kiểm soát chặt chẽ từng đường kim mũi chỉ.</p>
        </div>
        <div className="p-6 rounded-theme bg-surface-card border border-border-base text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Users2 className="w-6 h-6" />
          </div>
          <h2 className="font-bold text-sm text-content-main">Khách Hàng</h2>
          <p className="text-xs text-content-muted">Đặt quyền lợi và sự hài lòng của người dùng làm trung tâm.</p>
        </div>
      </div>
    </div>
  );
};
export default AboutPage;
