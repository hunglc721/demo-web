import React from 'react';
import { Tabs, TabList, TabTrigger, TabContent } from '@/core/components/Tabs';
import { Product } from '@/types/product';
import { ProductReviews } from './ProductReviews';
import { ShieldCheck, Award } from 'lucide-react';

export interface ProductTabsProps {
  product: Product;
}

export const ProductTabs: React.FC<ProductTabsProps> = ({ product }) => {
  return (
    <div className="rounded-2xl bg-surface-card border border-border-base p-6 sm:p-8 shadow-sm">
      <Tabs defaultValue="description" variant="line">
        <TabList className="border-b border-border-base">
          <TabTrigger value="description" className="text-xs sm:text-sm font-semibold pb-3">
            Mô Tả Sản Phẩm
          </TabTrigger>
          <TabTrigger value="specs" className="text-xs sm:text-sm font-semibold pb-3">
            Thông Số Kỹ Thuật
          </TabTrigger>
          <TabTrigger value="reviews" className="text-xs sm:text-sm font-semibold pb-3">
            Đánh Giá ({product.reviewCount || 0})
          </TabTrigger>
        </TabList>

        {/* Tab 1: Description */}
        <TabContent value="description" className="pt-6 space-y-6">
          <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-content-muted leading-relaxed space-y-4">
            {product.shortDescription && (
              <p className="text-sm sm:text-base font-semibold text-content-main leading-snug">
                {product.shortDescription}
              </p>
            )}

            <div className="whitespace-pre-line space-y-3">
              {product.description.split('\n\n').map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>

            {/* Feature Highlights Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border-base">
              <div className="p-4 rounded-theme bg-surface-subtle border border-border-base flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary flex-shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-content-main">Chất Liệu Tuyển Chọn</h4>
                  <p className="text-xs text-content-muted mt-0.5">
                    100% nguyên phụ liệu chuẩn D2C cao cấp, bền bỉ và an toàn tuyệt đối.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-theme bg-surface-subtle border border-border-base flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary flex-shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-content-main">Kiểm Định Tỉ Mỉ</h4>
                  <p className="text-xs text-content-muted mt-0.5">
                    Được kiểm định chất lượng nghiêm ngặt trước khi xuất xưởng đóng gói.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabContent>

        {/* Tab 2: Specifications Table */}
        <TabContent value="specs" className="pt-6">
          <div className="overflow-hidden rounded-theme border border-border-base">
            <table className="w-full text-xs sm:text-sm text-left">
              <tbody className="divide-y divide-border-base">
                <tr className="bg-surface-subtle/50">
                  <td className="py-3 px-4 font-semibold text-content-main w-1/3">Thương hiệu</td>
                  <td className="py-3 px-4 text-content-muted">D2C Official Store</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-content-main">Mã sản phẩm (SKU)</td>
                  <td className="py-3 px-4 font-mono text-content-muted">{product.sku}</td>
                </tr>
                <tr className="bg-surface-subtle/50">
                  <td className="py-3 px-4 font-semibold text-content-main">Danh mục</td>
                  <td className="py-3 px-4 text-content-muted">{product.categoryName || 'Sản phẩm D2C'}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-content-main">Xuất xứ</td>
                  <td className="py-3 px-4 text-content-muted">Việt Nam</td>
                </tr>
                <tr className="bg-surface-subtle/50">
                  <td className="py-3 px-4 font-semibold text-content-main">Chính sách bảo hành</td>
                  <td className="py-3 px-4 text-content-muted">12 tháng chính hãng (1 đổi 1 trong 30 ngày)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-content-main">Chính sách đổi trả</td>
                  <td className="py-3 px-4 text-content-muted">Hỗ trợ đổi size/màu trong 7 ngày kể từ khi nhận hàng</td>
                </tr>
                <tr className="bg-surface-subtle/50">
                  <td className="py-3 px-4 font-semibold text-content-main">Quy cách đóng gói</td>
                  <td className="py-3 px-4 text-content-muted">Hộp carton bảo vệ 2 lớp + túi zip chống bụi cao cấp</td>
                </tr>
              </tbody>
            </table>
          </div>
        </TabContent>

        {/* Tab 3: Reviews */}
        <TabContent value="reviews" className="pt-6">
          <ProductReviews productId={product.id} productName={product.name} />
        </TabContent>
      </Tabs>
    </div>
  );
};
export default ProductTabs;
