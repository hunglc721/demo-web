import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import { defaultAppConfig } from '@/config/appConfig';

export interface HeroSlide {
  tag?: string;
  title: string;
  subtitle: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  backgroundImage?: string;
}

export interface HeroBannerBlockProps {
  settings?: {
    slides?: HeroSlide[];
    tag?: string;
    title?: string;
    subtitle?: string;
    ctaText?: string;
    ctaLink?: string;
    secondaryCtaText?: string;
    secondaryCtaLink?: string;
    backgroundImage?: string;
  };
}

export const HeroBannerBlock: React.FC<HeroBannerBlockProps> = ({ settings }) => {
  const slides: HeroSlide[] = settings?.slides || [
    {
      tag: settings?.tag || 'Nền Tảng E-Commerce D2C Khởi Nghiệp',
      title: settings?.title || 'Xây Dựng Thương Hiệu Độc Lập — Tự Do Tăng Trưởng Doanh Thu',
      subtitle:
        settings?.subtitle ||
        `${defaultAppConfig.store.brandSlogan}. Giải pháp tối ưu cho nhà bán hàng rời sàn với trải nghiệm mua sắm mượt mà.`,
      ctaText: settings?.ctaText || 'Khám Phá Ngay',
      ctaLink: settings?.ctaLink || '/catalog',
      secondaryCtaText: settings?.secondaryCtaText || 'Vào Quản Trị Admin',
      secondaryCtaLink: settings?.secondaryCtaLink || '/admin/dashboard',
      backgroundImage:
        settings?.backgroundImage ||
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80',
    },
    {
      tag: 'Bộ Sưu Tập Thu Đông Mới Nhất',
      title: 'Thời Trang Tối Giản — Phong Cách Đẳng Cấp Cho Giới Trẻ',
      subtitle: 'Chất liệu vải dệt organic thoáng mát, thân thiện với làn da, phom dáng tôn lên nét thanh lịch hiện đại.',
      ctaText: 'Xem Bộ Sưu Tập',
      ctaLink: '/catalog?category=thoi-trang-nam',
      secondaryCtaText: 'Săn Deal Flash Sale',
      secondaryCtaLink: '/flash-sale',
      backgroundImage:
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80',
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const active = slides[currentSlide];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-surface-card to-surface-subtle border-b border-border-base transition-all duration-700">
      {/* Background Image Overlay with Gradient */}
      <div className="absolute inset-0 z-0 opacity-15 dark:opacity-10 pointer-events-none transition-opacity duration-700">
        <img
          src={active.backgroundImage}
          alt={active.title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center space-y-6">
        {active.tag && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider shadow-sm animate-in fade-in slide-in-from-top-2">
            <Sparkles className="w-3.5 h-3.5" />
            {active.tag}
          </div>
        )}

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-content-main tracking-tight max-w-4xl mx-auto leading-tight animate-in fade-in zoom-in-95 duration-300">
          {active.title}
        </h1>

        <p className="text-base sm:text-lg text-content-muted max-w-2xl mx-auto leading-relaxed">
          {active.subtitle}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
          {active.ctaLink && (
            <Link
              to={active.ctaLink}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-theme bg-primary text-white font-semibold hover:bg-primary-hover shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-95 transition-all text-sm sm:text-base"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>{active.ctaText || 'Khám Phá Ngay'}</span>
            </Link>
          )}

          {active.secondaryCtaLink && (
            <Link
              to={active.secondaryCtaLink}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-theme bg-surface-card border border-border-base text-content-main font-semibold hover:bg-surface-subtle transition-all text-sm sm:text-base shadow-sm"
            >
              <span>{active.secondaryCtaText || 'Vào Quản Trị Admin'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Carousel Slide Indicators */}
        {slides.length > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            <button
              onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
              className="p-1.5 rounded-full bg-surface-card border border-border-base text-content-muted hover:text-primary transition-colors"
              aria-label="Slide trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentSlide === idx ? 'w-8 bg-primary' : 'w-2 bg-border-base hover:bg-content-muted'
                }`}
                aria-label={`Đi tới slide ${idx + 1}`}
              />
            ))}
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
              className="p-1.5 rounded-full bg-surface-card border border-border-base text-content-muted hover:text-primary transition-colors"
              aria-label="Slide tiếp theo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
export default HeroBannerBlock;
