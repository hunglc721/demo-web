import React, { useState } from 'react';
import { Star, CheckCircle, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

export interface TestimonialItem {
  name: string;
  role?: string;
  avatar?: string;
  rating?: number;
  comment: string;
}

export interface TestimonialsBlockProps {
  settings?: {
    title?: string;
    subtitle?: string;
    items?: TestimonialItem[];
  };
}

export const TestimonialsBlock: React.FC<TestimonialsBlockProps> = ({ settings }) => {
  const defaultItems: TestimonialItem[] = [
    {
      name: 'Trần Tuấn Anh',
      role: 'Khách VIP',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      rating: 5,
      comment:
        'Chất vải polo pique cực kỳ dày dặn và đứng phom. Giao hàng hoả tốc Landmark 81 chỉ trong 2 tiếng, đóng gói sang trọng!',
    },
    {
      name: 'Đặng Thu Hương',
      role: 'Trưởng phòng Marketing',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      rating: 5,
      comment:
        'Váy linen mặc rất nhẹ và mát, đường may chuẩn chỉ không có sợi chỉ thừa. Đổi size nhanh chóng và thân thiện.',
    },
    {
      name: 'Vũ Minh Trí',
      role: 'Lập trình viên',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      rating: 5,
      comment:
        'Ví da bò sáp cầm chắc tay, đóng hộp sang trọng rất thích hợp làm quà tặng. Dịch vụ chăm sóc khách hàng 10/10.',
    },
  ];

  const items = settings?.items || defaultItems;
  const [currentIndex, setCurrentIndex] = useState(0);

  const title = settings?.title || 'Khách Hàng Nói Gì Về Chúng Tôi';
  const subtitle =
    settings?.subtitle || 'Hơn 15.000 khách hàng đã tin tưởng lựa chọn sản phẩm D2C';

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-content-main tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-content-muted mt-1">{subtitle}</p>
        </div>

        {/* Carousel buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-2 rounded-full bg-surface-card border border-border-base text-content-muted hover:text-primary hover:border-primary transition-colors"
            aria-label="Đánh giá trước"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-full bg-surface-card border border-border-base text-content-muted hover:text-primary hover:border-primary transition-colors"
            aria-label="Đánh giá tiếp"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Grid of Testimonials */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((item, idx) => {
          const rating = item.rating || 5;
          return (
            <div
              key={idx}
              className={`p-6 rounded-theme bg-surface-card border border-border-base hover:border-primary/40 hover:shadow-lg transition-all flex flex-col justify-between space-y-4 relative ${
                currentIndex === idx ? 'ring-2 ring-primary/20' : ''
              }`}
            >
              <Quote className="w-8 h-8 text-primary/20 absolute top-4 right-4" />

              <div className="space-y-3">
                {/* Stars */}
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, sIdx) => (
                    <Star
                      key={sIdx}
                      className={`w-4 h-4 ${
                        sIdx < rating ? 'fill-amber-500 text-amber-500' : 'text-border-base'
                      }`}
                    />
                  ))}
                </div>

                <p className="text-sm text-content-muted leading-relaxed italic">
                  "{item.comment}"
                </p>
              </div>

              {/* Reviewer info */}
              <div className="flex items-center gap-3 pt-3 border-t border-border-base">
                <img
                  src={
                    item.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                  }
                  alt={item.name}
                  className="w-10 h-10 rounded-full object-cover bg-surface-subtle border border-border-base"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-content-main truncate">
                      {item.name}
                    </span>
                    <span
                      title="Đã mua hàng chính hãng"
                      className="text-primary flex-shrink-0"
                    >
                      <CheckCircle className="w-3.5 h-3.5 fill-primary text-white" />
                    </span>
                  </div>
                  <span className="text-[11px] text-content-muted block truncate">
                    {item.role || 'Khách hàng đã xác thực'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
export default TestimonialsBlock;
