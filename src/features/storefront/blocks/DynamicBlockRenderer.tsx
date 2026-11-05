import React, { useState, useEffect } from 'react';
import { StorefrontBlockConfig, BlockType } from '@/types/block';
import { blockService } from '@/services/api/blockService';
import { defaultStorefrontBlocks } from '@/services/seed/blocksSeed';
import { HeaderBlock } from './HeaderBlock';
import { HeroBannerBlock } from './HeroBannerBlock';
import { ValuePropsBlock } from './ValuePropsBlock';
import { CategoryShowcaseBlock } from './CategoryShowcaseBlock';
import { FlashSaleBlock } from './FlashSaleBlock';
import { FeaturedProductsBlock } from './FeaturedProductsBlock';
import { PromoBannerBlock } from './PromoBannerBlock';
import { BrandStoryBlock } from './BrandStoryBlock';
import { TestimonialsBlock } from './TestimonialsBlock';
import { NewsletterBlock } from './NewsletterBlock';
import { FooterBlock } from './FooterBlock';

export interface DynamicBlockRendererProps {
  blocks?: StorefrontBlockConfig[];
  excludeTypes?: BlockType[];
  className?: string;
}

const blockRegistry: Record<BlockType, React.FC<{ settings?: any }>> = {
  header: HeaderBlock,
  hero_banner: HeroBannerBlock,
  value_propositions: ValuePropsBlock,
  category_showcase: CategoryShowcaseBlock,
  flash_sale: FlashSaleBlock,
  featured_products: FeaturedProductsBlock,
  promo_banner: PromoBannerBlock,
  brand_story: BrandStoryBlock,
  testimonials: TestimonialsBlock,
  newsletter: NewsletterBlock,
  footer: FooterBlock,
};

export const DynamicBlockRenderer: React.FC<DynamicBlockRendererProps> = ({
  blocks: propBlocks,
  excludeTypes = ['header', 'footer'], // Default exclude layout header/footer when rendered in page body
  className = '',
}) => {
  const [blocks, setBlocks] = useState<StorefrontBlockConfig[]>(
    propBlocks || defaultStorefrontBlocks
  );

  useEffect(() => {
    if (propBlocks) {
      setBlocks(propBlocks);
      return;
    }

    let isMounted = true;
    const fetchBlocks = async () => {
      try {
        const storedBlocks = await blockService.getBlocks();
        if (isMounted && storedBlocks && storedBlocks.length > 0) {
          setBlocks(storedBlocks);
        }
      } catch {
        if (isMounted) setBlocks(defaultStorefrontBlocks);
      }
    };

    fetchBlocks();

    const handleUpdate = () => fetchBlocks();
    window.addEventListener('d2c:blocks-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('d2c:blocks-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [propBlocks]);

  // Filter enabled blocks, exclude specified types, and sort by order ascending
  const activeBlocks = [...blocks]
    .filter((b) => b.enabled && (!excludeTypes || !excludeTypes.includes(b.type)))
    .sort((a, b) => a.order - b.order);

  return (
    <div className={`space-y-6 sm:space-y-10 ${className}`}>
      {activeBlocks.map((block) => {
        const Component = blockRegistry[block.type];
        if (!Component) return null;

        return (
          <div
            key={block.id}
            id={block.id}
            data-testid={`block-${block.type}`}
            data-block-id={block.id}
            className="w-full transition-opacity duration-300"
          >
            <Component settings={block.settings} />
          </div>
        );
      })}
    </div>
  );
};
export default DynamicBlockRenderer;
