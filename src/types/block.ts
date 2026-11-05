/**
 * Storefront Modular Block Models
 */

export type BlockType =
  | 'header'
  | 'hero_banner'
  | 'value_propositions'
  | 'flash_sale'
  | 'category_showcase'
  | 'featured_products'
  | 'promo_banner'
  | 'testimonials'
  | 'brand_story'
  | 'newsletter'
  | 'footer';

export interface StorefrontBlockConfig<T = Record<string, any>> {
  id: string;
  type: BlockType;
  enabled: boolean;
  order: number;
  settings: T;
}
