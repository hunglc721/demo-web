import React from 'react';
import { Layers, Plus } from 'lucide-react';
import { defaultAppConfig } from '@/config/appConfig';

export const CategoryListPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-main">Quản Lý Danh Mục</h1>
          <p className="text-sm text-content-muted mt-1">
            Phân loại ngành hàng và cấu trúc bộ sưu tập cửa hàng.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-theme bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-sm transition-all">
          <Plus className="w-4 h-4" />
          <span>Tạo Danh Mục Mới</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {defaultAppConfig.storefrontNav.categories.map((c) => (
          <div key={c.id} className="p-4 rounded-theme bg-surface-card border border-border-base flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-theme bg-primary/10 text-primary">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-content-main">{c.name}</h2>
                <span className="text-xs text-content-muted">/{c.slug}</span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-surface-subtle text-content-muted font-medium">
              Hoạt động
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
export default CategoryListPage;
