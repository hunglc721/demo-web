import React from 'react';
import { Sparkles, Award } from 'lucide-react';

export interface BrandStoryBlockProps {
  settings?: {
    tag?: string;
    title?: string;
    content?: string;
    image?: string;
    stats?: Array<{ label: string; value: string }>;
  };
}

export const BrandStoryBlock: React.FC<BrandStoryBlockProps> = ({ settings }) => {
  const tag = settings?.tag || 'Câu Chuyện Thương Hiệu';
  const title = settings?.title || 'Từ Xưởng Sản Xuất Đến Thẳng Tủ Đồ Của Bạn';
  const content =
    settings?.content ||
    'Chúng tôi cắt giảm toàn bộ chi phí trung gian của các sàn thương mại điện tử để mang lại sản phẩm chất lượng cao với mức giá chân thật nhất. Từng đường kim mũi chỉ đều được kiểm định nghiêm ngặt.';
  const image =
    settings?.image ||
    'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=800&q=80';

  const defaultStats = [
    { label: 'Khách hàng hài lòng', value: '15.000+' },
    { label: 'Sản phẩm bán ra', value: '50.000+' },
    { label: 'Đánh giá 5 sao', value: '98.5%' },
  ];
  const stats = settings?.stats || defaultStats;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Left: Text & Metrics */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{tag}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-content-main tracking-tight leading-tight">
            {title}
          </h2>

          <p className="text-base text-content-muted leading-relaxed">
            {content}
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border-base">
            {stats.map((s, idx) => (
              <div key={idx} className="space-y-1">
                <span className="text-2xl sm:text-3xl font-black text-primary block">
                  {s.value}
                </span>
                <span className="text-xs text-content-muted block leading-snug">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Brand Image Showcase */}
        <div className="relative rounded-2xl overflow-hidden shadow-xl border border-border-base aspect-[4/3] group">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 p-4 rounded-theme bg-surface-card/90 backdrop-blur-md border border-border-base flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-content-main">Cam Kết Chất Lượng D2C</p>
              <p className="text-[11px] text-content-muted">Kiểm định tỉ mỉ từng chi tiết sản phẩm trước khi giao</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default BrandStoryBlock;
