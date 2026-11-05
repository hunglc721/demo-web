import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, QrCode, CreditCard, Truck } from 'lucide-react';
import { defaultAppConfig } from '@/config/appConfig';

export interface FooterBlockProps {
  settings?: {
    brandBio?: string;
    showPayments?: boolean;
    copyrightText?: string;
  };
}

export const FooterBlock: React.FC<FooterBlockProps> = ({ settings }) => {
  const brandBio =
    settings?.brandBio ||
    `${defaultAppConfig.store.brandSlogan}. Nền tảng bán hàng D2C tiên phong giúp các chủ shop xây dựng thương hiệu độc lập và bền vững.`;
  const showPayments = settings?.showPayments !== false;
  const copyrightText =
    settings?.copyrightText ||
    `© ${new Date().getFullYear()} ${defaultAppConfig.store.name}. All rights reserved.`;

  return (
    <footer className="bg-surface-card border-t border-border-base mt-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Column 1 & 2: Brand Information */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-theme bg-primary text-white flex items-center justify-center font-bold text-lg">
                D
              </div>
              <span className="font-bold text-lg text-content-main">
                {defaultAppConfig.store.name}
              </span>
            </Link>
            <p className="text-sm text-content-muted max-w-sm leading-relaxed">
              {brandBio}
            </p>

            <div className="space-y-2 text-xs text-content-muted pt-2">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>
                  Hotline:{' '}
                  <strong className="text-content-main">
                    {defaultAppConfig.store.hotline}
                  </strong>{' '}
                  (8:00 - 21:00)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>Email: {defaultAppConfig.store.email}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                <span>{defaultAppConfig.store.address}</span>
              </div>
            </div>
          </div>

          {/* Dynamic Navigation Columns */}
          {defaultAppConfig.storefrontNav.footerColumns.map((col, idx) => (
            <div key={idx} className="space-y-3">
              <h3 className="text-xs font-semibold text-content-main uppercase tracking-wider">
                {col.title}
              </h3>
              <ul className="space-y-2 text-sm text-content-muted">
                {col.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <Link
                      to={link.path}
                      className="hover:text-primary transition-colors text-xs font-medium"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment & Security Badges */}
        {showPayments && (
          <div className="border-t border-border-base mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-content-muted">
            <div className="flex items-center gap-3">
              <span>Hỗ trợ thanh toán an toàn:</span>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-subtle border border-border-base font-semibold text-[11px] text-content-main">
                  <QrCode className="w-3 h-3 text-primary" /> VietQR
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-subtle border border-border-base font-semibold text-[11px] text-content-main">
                  <CreditCard className="w-3 h-3 text-primary" /> MoMo
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-subtle border border-border-base font-semibold text-[11px] text-content-main">
                  <Truck className="w-3 h-3 text-primary" /> COD
                </span>
              </div>
            </div>

            <p>{copyrightText}</p>
          </div>
        )}
      </div>
    </footer>
  );
};
export default FooterBlock;
