import React from 'react';
import { Truck, RotateCcw, Zap, Headphones, ShieldCheck, Sparkles } from 'lucide-react';

export interface ValuePropItem {
  icon?: string;
  title: string;
  description: string;
}

export interface ValuePropsBlockProps {
  settings?: {
    items?: ValuePropItem[];
  };
}

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  Truck,
  RotateCcw,
  Zap,
  Headphones,
  ShieldCheck,
  Sparkles,
};

export const ValuePropsBlock: React.FC<ValuePropsBlockProps> = ({ settings }) => {
  const defaultItems: ValuePropItem[] = [
    {
      icon: 'Truck',
      title: 'Miễn Phí Vận Chuyển',
      description: 'Đơn từ 299K giao tận nơi toàn quốc nhanh chóng.',
    },
    {
      icon: 'RotateCcw',
      title: 'Đổi Trả 30 Ngày',
      description: 'Hỗ trợ đổi trả miễn phí trong 30 ngày.',
    },
    {
      icon: 'Zap',
      title: 'Giao Hàng Siêu Tốc',
      description: 'Giao hỏa tốc 2h nội thành và 24h toàn quốc.',
    },
    {
      icon: 'Headphones',
      title: 'Hỗ Trợ 24/7',
      description: 'Tư vấn nhiệt tình và giải quyết thắc mắc 24/7.',
    },
  ];

  const items = settings?.items || defaultItems;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item, idx) => {
          const IconComponent = (item.icon && iconMap[item.icon]) || ShieldCheck;
          return (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-theme bg-surface-card border border-border-base hover:border-primary/40 hover:shadow-md transition-all flex items-start gap-4"
            >
              <div className="p-3 rounded-theme bg-primary/10 text-primary flex-shrink-0">
                <IconComponent className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-content-main text-sm">
                  {item.title}
                </h3>
                <p className="text-xs text-content-muted leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
export default ValuePropsBlock;
