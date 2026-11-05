import React, { useEffect, useState } from 'react';
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

const DEFAULT_HERO_IMAGE =
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=2000&q=85';
const AUTOPLAY_INTERVAL_MS = 6000;

export const HeroBannerBlock: React.FC<HeroBannerBlockProps> = ({ settings }) => {
  const configuredSlides = (settings?.slides || []).filter((slide) => slide.backgroundImage?.trim());
  const slides: HeroSlide[] = configuredSlides.length > 0
    ? configuredSlides
    : [
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
          backgroundImage: settings?.backgroundImage || DEFAULT_HERO_IMAGE,
        },
      ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const activeIndex = currentSlide % slides.length;
  const active = slides[activeIndex];
  const nextImageUrl = slides.length > 1
    ? slides[(activeIndex + 1) % slides.length].backgroundImage || DEFAULT_HERO_IMAGE
    : '';

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    if (slides.length <= 1 || isPaused || prefersReducedMotion) return;
    const interval = window.setInterval(() => {
      setCurrentSlide((index) => (index + 1) % slides.length);
    }, AUTOPLAY_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [activeIndex, isPaused, prefersReducedMotion, slides.length]);

  useEffect(() => {
    if (!nextImageUrl) return;
    const nextImage = new Image();
    nextImage.src = nextImageUrl;
  }, [nextImageUrl]);

  const goToSlide = (index: number) => {
    setCurrentSlide((index + slides.length) % slides.length);
  };

  return (
    <section
      aria-label="Banner trang chủ"
      aria-roledescription="carousel"
      className="relative isolate min-h-[540px] overflow-hidden bg-slate-950 text-white sm:min-h-[600px] lg:min-h-[640px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsPaused(false);
      }}
    >
      <div key={active.backgroundImage || DEFAULT_HERO_IMAGE} className="absolute inset-0 animate-in fade-in duration-700">
        <img
          src={active.backgroundImage || DEFAULT_HERO_IMAGE}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center"
          onError={(event) => {
            event.currentTarget.style.visibility = 'hidden';
          }}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-slate-950/40 sm:bg-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/40 to-slate-950/5" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-slate-950/10" />

      <div className="relative z-10 mx-auto flex min-h-[540px] max-w-7xl items-center px-5 py-16 sm:min-h-[600px] sm:px-10 lg:min-h-[640px] lg:px-8">
        <div key={activeIndex} className="max-w-3xl animate-in fade-in slide-in-from-left-3 duration-500">
          {active.tag && (
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {active.tag}
            </div>
          )}

          <h1 className="max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            {active.title}
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
            {active.subtitle}
          </p>

          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            {active.ctaLink && (
              <Link
                to={active.ctaLink}
                className="inline-flex items-center gap-2 rounded-theme bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition-all hover:bg-primary-hover active:scale-95 sm:text-base"
              >
                <ShoppingBag className="h-5 w-5" />
                <span>{active.ctaText || 'Khám Phá Ngay'}</span>
              </Link>
            )}

            {active.secondaryCtaLink && (
              <Link
                to={active.secondaryCtaLink}
                className="inline-flex items-center gap-2 rounded-theme border border-white/30 bg-slate-950/20 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 sm:text-base"
              >
                <span>{active.secondaryCtaText || 'Vào Quản Trị Admin'}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {slides.length > 1 && (
            <div className="mt-9 flex items-center gap-3" aria-label="Điều hướng banner">
              <button
                type="button"
                onClick={() => goToSlide(activeIndex - 1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-slate-950/25 text-white backdrop-blur-sm transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Slide trước"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2" role="group" aria-label="Chọn slide">
                {slides.map((slide, index) => (
                  <button
                    key={`${slide.title}-${index}`}
                    type="button"
                    onClick={() => goToSlide(index)}
                    className={`h-2.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                      activeIndex === index ? 'w-9 bg-white' : 'w-2.5 bg-white/45 hover:bg-white/75'
                    }`}
                    aria-label={`Đi tới slide ${index + 1}`}
                    aria-current={activeIndex === index ? 'true' : undefined}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => goToSlide(activeIndex + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-slate-950/25 text-white backdrop-blur-sm transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Slide tiếp theo"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <span className="ml-1 text-xs font-medium tabular-nums text-white/75" aria-live="polite">
                {String(activeIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroBannerBlock;
