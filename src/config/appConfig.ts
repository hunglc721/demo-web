export type ThemePreset = 'emerald' | 'indigo' | 'rose' | 'amber' | 'slate';
export type ThemeMode = 'light' | 'dark' | 'system';
export type RadiusPreset = 'none' | 'sm' | 'md' | 'lg' | 'full';

export interface StoreBranding {
  name: string;
  brandSlogan: string;
  logoUrl: string;
  hotline: string;
  email: string;
  address: string;
  currency: 'VND';
  locale: string;
}

export interface ThemeConfig {
  mode: ThemeMode;
  preset: ThemePreset;
  radius: RadiusPreset;
  enableThemeCustomizer: boolean;
}

export interface FeatureFlags {
  reviews: boolean;
  flashSale: boolean;
  coupons: boolean;
  wishlist: boolean;
  supportChat: boolean;
  inventoryTracking: boolean;
  guestCheckout: boolean;
}

export interface NavItem {
  id: string;
  title: string;
  path: string;
  icon: string;
  badgeKey?: string;
  children?: Array<{
    id: string;
    title: string;
    path: string;
  }>;
}

export interface AppConfig {
  store: StoreBranding;
  theme: ThemeConfig;
  features: FeatureFlags;
  adminNav: NavItem[];
  storefrontNav: {
    headerLinks: Array<{ title: string; path: string; isHighlight?: boolean }>;
    categories: Array<{ id: string; name: string; slug: string; icon?: string }>;
    footerColumns: Array<{
      title: string;
      links: Array<{ title: string; path: string }>;
    }>;
  };
}

export const defaultAppConfig: AppConfig = {
  store: {
    name: 'D2C Starter Store',
    brandSlogan: 'Nền Tảng Bán Hàng Trực Tiếp Đột Phá Doanh Thu',
    logoUrl: '/favicon.svg',
    hotline: '1900 6868',
    email: 'hotro@d2cstarter.vn',
    address: '70 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    currency: 'VND',
    locale: 'vi-VN',
  },
  theme: {
    mode: 'light',
    preset: 'emerald',
    radius: 'md',
    enableThemeCustomizer: true,
  },
  features: {
    reviews: true,
    flashSale: true,
    coupons: true,
    wishlist: true,
    supportChat: true,
    inventoryTracking: true,
    guestCheckout: true,
  },
  adminNav: [
    {
      id: 'dashboard',
      title: 'Tổng quan',
      path: '/admin/dashboard',
      icon: 'LayoutDashboard',
    },
    {
      id: 'products',
      title: 'Sản phẩm',
      path: '/admin/products',
      icon: 'Package',
      children: [
        { id: 'prod-list', title: 'Tất cả sản phẩm', path: '/admin/products' },
        { id: 'prod-create', title: 'Thêm mới', path: '/admin/products/new' },
        { id: 'prod-cats', title: 'Danh mục', path: '/admin/categories' },
        { id: 'prod-categories', title: 'Danh mục sản phẩm', path: '/admin/products/categories' },
        { id: 'prod-tags', title: 'Tag sản phẩm', path: '/admin/products/tags' },
        { id: 'prod-inventory', title: 'Tồn kho', path: '/admin/products/inventory' },
        { id: 'prod-reviews', title: 'Đánh giá', path: '/admin/products/reviews' },
        { id: 'prod-custom-fields', title: 'Trường tuỳ chỉnh', path: '/admin/products/custom-fields' },
      ],
    },
    {
      id: 'orders',
      title: 'Đơn hàng',
      path: '/admin/orders',
      icon: 'ShoppingCart',
      badgeKey: 'pendingOrders',
      children: [
        { id: 'order-list', title: 'Tất cả đơn hàng', path: '/admin/orders' },
        { id: 'order-abandoned', title: 'Chưa hoàn tất', path: '/admin/orders/abandoned' },
        { id: 'order-shipping-slips', title: 'Phiếu giao hàng', path: '/admin/orders/shipping-slips' },
        { id: 'order-tags', title: 'Tag đơn hàng', path: '/admin/orders/tags' },
        { id: 'order-custom-fields', title: 'Trường tuỳ chỉnh', path: '/admin/orders/custom-fields' },
      ],
    },
    {
      id: 'customers',
      title: 'Khách hàng',
      path: '/admin/customers',
      icon: 'Users',
    },
    {
      id: 'marketing',
      title: 'Khuyến mãi & Marketing',
      path: '/admin/marketing',
      icon: 'Megaphone',
      children: [
        { id: 'coupons', title: 'Mã giảm giá', path: '/admin/marketing/coupons' },
        { id: 'flash-sale', title: 'Flash Sale', path: '/admin/marketing/flash-sale' },
      ],
    },
    {
      id: 'settings',
      title: 'Cấu hình cửa hàng',
      path: '/admin/settings',
      icon: 'Settings',
    },
  ],
  storefrontNav: {
    headerLinks: [
      { title: 'Trang chủ', path: '/' },
      { title: 'Sản phẩm mới', path: '/catalog?sort=newest' },
      { title: 'Bán chạy nhất', path: '/catalog?tag=best-seller', isHighlight: true },
      { title: 'Flash Sale 🔥', path: '/flash-sale', isHighlight: true },
      { title: 'Về chúng tôi', path: '/about' },
      { title: 'Tra cứu đơn hàng', path: '/order-lookup' },
    ],
    categories: [
      { id: 'thoi-trang-nam', name: 'Thời Trang Nam', slug: 'thoi-trang-nam', icon: 'Shirt' },
      { id: 'thoi-trang-nu', name: 'Thời Trang Nữ', slug: 'thoi-trang-nu', icon: 'Sparkles' },
      { id: 'phu-kien', name: 'Phụ Kiện Cao Cấp', slug: 'phu-kien', icon: 'Watch' },
      { id: 'my-pham', name: 'Chăm Sóc & Mỹ Phẩm', slug: 'my-pham', icon: 'Heart' },
    ],
    footerColumns: [
      {
        title: 'Chăm sóc khách hàng',
        links: [
          { title: 'Trung tâm trợ giúp', path: '/help' },
          { title: 'Chính sách đổi trả 7 ngày', path: '/returns' },
          { title: 'Hướng dẫn đặt hàng', path: '/guide' },
          { title: 'Kiểm tra đơn hàng', path: '/order-lookup' },
        ],
      },
      {
        title: 'Về D2C Starter',
        links: [
          { title: 'Giới thiệu thương hiệu', path: '/about' },
          { title: 'Tuyển dụng', path: '/careers' },
          { title: 'Hệ thống cửa hàng', path: '/stores' },
        ],
      },
      {
        title: 'Chính sách & Điều khoản',
        links: [
          { title: 'Chính sách bảo mật', path: '/privacy' },
          { title: 'Điều khoản dịch vụ', path: '/terms' },
          { title: 'Chính sách vận chuyển', path: '/shipping-policy' },
        ],
      },
    ],
  },
};
