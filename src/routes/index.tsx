import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import { StorefrontLayout } from '@/layouts/StorefrontLayout';
import { BlankLayout } from '@/layouts/BlankLayout';
import { PageLoader } from '@/core/components/Feedback/PageLoader';
import { ProtectedRoute } from './RouteGuards';

// Lazy-loaded Storefront Pages
const HomePage = lazy(() => import('@/features/storefront/pages/HomePage'));
const CatalogPage = lazy(() => import('@/features/storefront/pages/CatalogPage'));
const CategoryPage = lazy(() => import('@/features/storefront/pages/CategoryPage'));
const ProductDetailPage = lazy(() => import('@/features/storefront/pages/ProductDetailPage'));
const FlashSalePage = lazy(() => import('@/features/storefront/pages/FlashSalePage'));
const OrderLookupPage = lazy(() => import('@/features/storefront/pages/OrderLookupPage'));
const AboutPage = lazy(() => import('@/features/storefront/pages/AboutPage'));
const HelpPage = lazy(() => import('@/features/storefront/pages/HelpPage'));

// Lazy-loaded Cart & Checkout
const CartPage = lazy(() => import('@/features/cart/pages/CartPage'));
const CheckoutPage = lazy(() => import('@/features/checkout/pages/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('@/features/checkout/pages/OrderSuccessPage'));

// Lazy-loaded Auth & Fallback
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'));
const NotFoundPage = lazy(() => import('@/features/storefront/pages/NotFoundPage'));

// Lazy-loaded Admin Pages
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const ProductListPage = lazy(() => import('@/features/products/pages/ProductListPage'));
const ProductFormPage = lazy(() => import('@/features/products/pages/ProductFormPage'));
const CategoryListPage = lazy(() => import('@/features/products/pages/CategoryListPage'));
const OrderListPage = lazy(() => import('@/features/orders/pages/OrderListPage'));
const OrderDetailPage = lazy(() => import('@/features/orders/pages/OrderDetailPage'));
const CustomerListPage = lazy(() => import('@/features/customers/pages/CustomerListPage'));
const CustomerDetailPage = lazy(() => import('@/features/customers/pages/CustomerDetailPage'));
const MarketingPage = lazy(() => import('@/features/marketing/pages/MarketingPage'));
const CouponListPage = lazy(() => import('@/features/marketing/pages/CouponListPage'));
const MarketingFlashSalePage = lazy(() => import('@/features/marketing/pages/MarketingFlashSalePage'));
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'));

const wrap = (Component: React.ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  // 1. Storefront Surface
  {
    path: '/',
    element: <StorefrontLayout />,
    children: [
      { index: true, element: wrap(HomePage) },
      { path: 'catalog', element: wrap(CatalogPage) },
      { path: 'category/:slug', element: wrap(CategoryPage) },
      { path: 'product/:slug', element: wrap(ProductDetailPage) },
      { path: 'flash-sale', element: wrap(FlashSalePage) },
      { path: 'cart', element: wrap(CartPage) },
      { path: 'order-lookup', element: wrap(OrderLookupPage) },
      { path: 'about', element: wrap(AboutPage) },
      { path: 'help', element: wrap(HelpPage) },
    ],
  },

  // 2. Blank Layout Surface (Checkout, Auth, Error)
  {
    path: '/',
    element: <BlankLayout />,
    children: [
      { path: 'checkout', element: wrap(CheckoutPage) },
      { path: 'order-success/:orderId', element: wrap(OrderSuccessPage) },
      { path: 'login', element: wrap(LoginPage) },
      { path: 'register', element: wrap(RegisterPage) },
      { path: '*', element: wrap(NotFoundPage) },
    ],
  },

  // 3. Admin Backoffice Surface
  {
    path: '/admin',
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: wrap(DashboardPage) },
      { path: 'products', element: wrap(ProductListPage) },
      { path: 'products/new', element: wrap(ProductFormPage) },
      { path: 'products/:id/edit', element: wrap(ProductFormPage) },
      { path: 'categories', element: wrap(CategoryListPage) },
      { path: 'orders', element: wrap(OrderListPage) },
      { path: 'orders/:id', element: wrap(OrderDetailPage) },
      { path: 'customers', element: wrap(CustomerListPage) },
      { path: 'customers/:id', element: wrap(CustomerDetailPage) },
      { path: 'marketing', element: wrap(MarketingPage) },
      { path: 'marketing/coupons', element: wrap(CouponListPage) },
      { path: 'marketing/flash-sale', element: wrap(MarketingFlashSalePage) },
      { path: 'settings', element: wrap(SettingsPage) },
    ],
  },
]);
