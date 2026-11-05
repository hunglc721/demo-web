import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Save,
  UploadCloud,
  Sparkles,
  Layers,
  Image as ImageIcon,
  DollarSign,
  FileText,
  Trash2,
  Check,
} from 'lucide-react';
import { productService } from '@/services/api/productService';
import { Category, ProductVariant, ProductOption } from '@/types';
import { compressImage } from '@/services/imageCompressor';
import { toast } from '@/stores/toastStore';
import { slugify } from '@/utils/formatters';
import { VariantMatrixBuilder } from '../components/VariantMatrixBuilder';
import { Switch } from '@/core/components/Switch';

export const productFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, 'Tên sản phẩm phải có ít nhất 3 ký tự')
      .max(200, 'Tối đa 200 ký tự'),
    slug: z
      .string()
      .trim()
      .min(3, 'Đường dẫn slug phải có ít nhất 3 ký tự')
      .regex(/^[a-z0-9-]+$/, 'Slug chỉ chứa chữ thường không dấu, số và dấu gạch ngang'),
    sku: z.string().trim().min(2, 'Mã SKU phải có ít nhất 2 ký tự').toUpperCase(),
    categoryId: z.string().min(1, 'Vui lòng chọn danh mục'),
    description: z.string().trim().min(10, 'Mô tả chi tiết phải có ít nhất 10 ký tự'),
    shortDescription: z.string().optional(),
    price: z.coerce.number().min(0, 'Giá bán không được âm'),
    compareAtPrice: z.coerce.number().min(0, 'Giá gốc không được âm').optional(),
    stock: z.coerce.number().int().min(0, 'Tồn kho không được âm'),
    lowStockThreshold: z.coerce.number().int().min(1, 'Ngưỡng cảnh báo tối thiểu 1').default(5),
    status: z.enum(['active', 'draft', 'archived']).default('active'),
    isFeatured: z.boolean().default(false),
    isFlashSale: z.boolean().default(false),
    tags: z.string().optional(),
  })
  .refine(
    (data) => {
      if (
        data.compareAtPrice !== undefined &&
        data.compareAtPrice > 0 &&
        data.compareAtPrice < data.price
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Giá gốc / so sánh phải lớn hơn hoặc bằng giá bán',
      path: ['compareAtPrice'],
    }
  );

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const ProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Media & Variants State
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [options, setOptions] = useState<ProductOption[]>([
    { name: 'Kích cỡ', values: ['S', 'M', 'L'] },
    { name: 'Màu sắc', values: ['Đen', 'Trắng'] },
  ]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      sku: '',
      categoryId: '',
      description: '',
      shortDescription: '',
      price: 199000,
      compareAtPrice: 250000,
      stock: 50,
      lowStockThreshold: 5,
      status: 'active',
      isFeatured: false,
      isFlashSale: false,
      tags: '',
    },
  });

  const watchedName = watch('name');
  const watchedPrice = watch('price');
  const watchedStock = watch('stock');
  const watchedSku = watch('sku');

  // Load Categories & Product Data
  useEffect(() => {
    let isMounted = true;
    async function init() {
      setLoading(true);
      try {
        const cats = await productService.getCategories();
        if (isMounted) setCategories(cats);

        if (id) {
          const prod = await productService.getProductById(id);
          if (prod && isMounted) {
            reset({
              name: prod.name,
              slug: prod.slug,
              sku: prod.sku || '',
              categoryId: prod.categoryId,
              description: prod.description || '',
              shortDescription: prod.shortDescription || '',
              price: prod.price,
              compareAtPrice: prod.compareAtPrice || prod.originalPrice || prod.price,
              stock: prod.stock ?? 0,
              lowStockThreshold: prod.lowStockThreshold || 5,
              status: prod.status,
              isFeatured: Boolean(prod.isFeatured),
              isFlashSale: Boolean(prod.isFlashSale),
              tags: (prod.tags || []).join(', '),
            });
            setImages(prod.images || []);
            if (prod.options && prod.options.length > 0) {
              setOptions(prod.options);
            }
            if (prod.variants && prod.variants.length > 0) {
              setVariants(prod.variants);
            }
          } else if (!prod && isMounted) {
            toast.error('Không tìm thấy sản phẩm.', { title: 'Lỗi' });
            navigate('/admin/products');
          }
        } else if (cats.length > 0 && isMounted) {
          setValue('categoryId', cats[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [id, reset, setValue, navigate]);

  // Vietnamese Auto-Slug Generator
  const handleAutoSlug = () => {
    if (watchedName) {
      setValue('slug', slugify(watchedName), { shouldValidate: true });
    }
  };

  // Image File Upload with Canvas Downscaler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    try {
      const compressedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressedBase64 = await compressImage(file, {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.8,
        });
        compressedUrls.push(compressedBase64);
      }
      setImages((prev) => [...prev, ...compressedUrls]);
      toast.success(`Đã tải lên và nén ${compressedUrls.length} ảnh thành công!`);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi nén ảnh tải lên.');
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  // Add CDN Image URL
  const handleAddImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    setImages((prev) => [...prev, trimmed]);
    setImageUrlInput('');
    toast.success('Đã thêm liên kết ảnh.');
  };

  // Remove an image
  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Set Primary Image (move to index 0)
  const handleSetPrimaryImage = (indexToPrimary: number) => {
    if (indexToPrimary === 0) return;
    setImages((prev) => {
      const target = prev[indexToPrimary];
      const rest = prev.filter((_, idx) => idx !== indexToPrimary);
      return [target, ...rest];
    });
  };

  // Submit Handler
  const onSubmit = async (values: ProductFormValues) => {
    setSubmitting(true);
    try {
      const tagsArray = (values.tags || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const categoryObj = categories.find((c) => c.id === values.categoryId);

      const payload = {
        name: values.name,
        slug: values.slug,
        sku: values.sku,
        categoryId: values.categoryId,
        categoryName: categoryObj?.name || 'Sản phẩm',
        description: values.description,
        shortDescription: values.shortDescription || '',
        price: values.price,
        compareAtPrice: values.compareAtPrice,
        stock: values.stock,
        lowStockThreshold: values.lowStockThreshold,
        status: values.status,
        isFeatured: values.isFeatured,
        isFlashSale: values.isFlashSale,
        tags: tagsArray,
        images:
          images.length > 0
            ? images
            : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'],
        options,
        variants,
      };

      if (isEdit && id) {
        await productService.updateProduct(id, payload);
        toast.success(`Đã cập nhật sản phẩm "${values.name}"!`);
      } else {
        await productService.createProduct(payload as any);
        toast.success(`Đã tạo mới sản phẩm "${values.name}"!`);
      }

      navigate('/admin/products');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Có lỗi xảy ra khi lưu sản phẩm.', { title: 'Thất bại' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-content-muted">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-3" />
        <p className="text-xs font-semibold">Đang tải dữ liệu sản phẩm...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in duration-300">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-base pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="p-2 rounded-theme border border-border-base hover:bg-surface-subtle text-content-muted hover:text-content-main transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-content-main tracking-tight">
              {isEdit ? 'Chỉnh Sửa Sản Phẩm' : 'Tạo Sản Phẩm Mới'}
            </h1>
            <p className="text-xs text-content-muted mt-0.5">
              {isEdit
                ? 'Cập nhật thông tin chi tiết, hình ảnh và bảng biến thể phân loại.'
                : 'Thêm sản phẩm mới vào danh mục bán hàng trực tuyến D2C.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/products"
            className="px-4 py-2 rounded-theme border border-border-base bg-surface-card hover:bg-surface-subtle text-xs font-semibold text-content-main transition-colors"
          >
            Hủy
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-theme bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-sm transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{submitting ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo sản phẩm'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: General, Media, Pricing, Variants (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Basic Info Card */}
          <div className="p-6 rounded-theme bg-surface-card border border-border-base shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-content-main uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span>Thông Tin Chung</span>
            </h3>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-content-main mb-1">
                Tên sản phẩm <span className="text-status-danger">*</span>
              </label>
              <input
                type="text"
                {...register('name')}
                placeholder="VD: Áo Thun Polo Nam Cotton Cao Cấp"
                className="w-full bg-surface-subtle border border-border-base rounded-theme px-3.5 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              {errors.name && (
                <p className="text-status-danger text-[11px] mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Slug & SKU Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-content-main">
                    Đường dẫn tĩnh (Slug) <span className="text-status-danger">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoSlug}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Tạo từ tên</span>
                  </button>
                </div>
                <input
                  type="text"
                  {...register('slug')}
                  placeholder="ao-thun-polo-nam"
                  className="w-full bg-surface-subtle border border-border-base rounded-theme px-3.5 py-2 text-xs text-content-main font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                {errors.slug && (
                  <p className="text-status-danger text-[11px] mt-1">{errors.slug.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-main mb-1">
                  Mã SKU cơ sở <span className="text-status-danger">*</span>
                </label>
                <input
                  type="text"
                  {...register('sku')}
                  placeholder="POLO-01"
                  className="w-full bg-surface-subtle border border-border-base rounded-theme px-3.5 py-2 text-xs text-content-main font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                {errors.sku && (
                  <p className="text-status-danger text-[11px] mt-1">{errors.sku.message}</p>
                )}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-content-main mb-1">
                Danh mục <span className="text-status-danger">*</span>
              </label>
              <select
                {...register('categoryId')}
                className="w-full bg-surface-subtle border border-border-base rounded-theme px-3.5 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-status-danger text-[11px] mt-1">
                  {errors.categoryId.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-content-main mb-1">
                Mô tả chi tiết sản phẩm <span className="text-status-danger">*</span>
              </label>
              <textarea
                rows={5}
                {...register('description')}
                placeholder="Mô tả chất liệu, kiểu dáng, hướng dẫn chọn size và bảo quản..."
                className="w-full bg-surface-subtle border border-border-base rounded-theme p-3 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
              />
              {errors.description && (
                <p className="text-status-danger text-[11px] mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          {/* 2. Media Upload & Gallery */}
          <div className="p-6 rounded-theme bg-surface-card border border-border-base shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-content-main uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-primary" />
              <span>Thư Viện Hình Ảnh</span>
            </h3>

            {/* Upload Dropzone */}
            <label className="border-2 border-dashed border-border-base hover:border-primary/50 bg-surface-subtle/50 rounded-theme p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-content-main">
                  {isCompressing
                    ? 'Đang nén và tối ưu hóa ảnh qua HTML5 Canvas...'
                    : 'Nhấn để chọn ảnh hoặc kéo thả vào đây'}
                </p>
                <p className="text-[11px] text-content-muted mt-0.5">
                  Tự động tối ưu hóa kích thước &lt;800px và bảo vệ giới hạn LocalStorage
                </p>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isCompressing}
                className="hidden"
              />
            </label>

            {/* Direct Image URL Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Hoặc dán URL ảnh trực tiếp từ Unsplash, CDN..."
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddImageUrl();
                  }
                }}
                className="flex-1 bg-surface-subtle border border-border-base rounded-theme px-3.5 py-1.5 text-xs text-content-main focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                disabled={!imageUrlInput.trim()}
                className="px-3 py-1.5 rounded-theme bg-surface-subtle border border-border-base hover:bg-border-base text-xs font-semibold text-content-main disabled:opacity-40 transition-colors"
              >
                + Thêm URL
              </button>
            </div>

            {/* Gallery Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-theme overflow-hidden border border-border-base aspect-square bg-surface-subtle"
                  >
                    <img
                      src={img}
                      alt={`Product photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {idx === 0 && (
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-white shadow-sm">
                        Ảnh chính
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(idx)}
                          className="p-1.5 rounded bg-white/20 hover:bg-white text-white hover:text-gray-900 transition-colors text-[10px] font-bold"
                          title="Đặt làm ảnh chính"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1.5 rounded bg-status-danger text-white hover:bg-red-700 transition-colors"
                        title="Xóa ảnh này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Variant Matrix Builder */}
          <div className="p-6 rounded-theme bg-surface-card border border-border-base shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-content-main uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span>Phân Loại & Biến Thể Sản Phẩm (Variant Matrix)</span>
            </h3>
            <p className="text-xs text-content-muted">
              Chọn ảnh riêng cho từng màu ở cột “Ảnh biến thể”; trang bán sẽ đổi sang ảnh đó khi khách chọn màu.
            </p>

            <VariantMatrixBuilder
              options={options}
              onOptionsChange={setOptions}
              variants={variants}
              onVariantsChange={setVariants}
              images={images}
              basePrice={watchedPrice || 0}
              baseStock={watchedStock || 0}
              baseSku={watchedSku || ''}
            />
          </div>
        </div>

        {/* Right Column: Pricing, Inventory, Organization, SEO (1 col) */}
        <div className="space-y-6">
          {/* Pricing & Stock Card */}
          <div className="p-6 rounded-theme bg-surface-card border border-border-base shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-content-main uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span>Giá Bán & Tồn Kho</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-content-main mb-1">
                Giá bán lẻ (VND) <span className="text-status-danger">*</span>
              </label>
              <input
                type="number"
                {...register('price')}
                min={0}
                className="w-full bg-surface-subtle border border-border-base rounded-theme px-3.5 py-2 text-xs text-content-main font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              {errors.price && (
                <p className="text-status-danger text-[11px] mt-1">{errors.price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-main mb-1">
                Giá gốc / so sánh (Gạch ngang)
              </label>
              <input
                type="number"
                {...register('compareAtPrice')}
                min={0}
                className="w-full bg-surface-subtle border border-border-base rounded-theme px-3.5 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              {errors.compareAtPrice && (
                <p className="text-status-danger text-[11px] mt-1">
                  {errors.compareAtPrice.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-content-main mb-1">
                  Tồn kho cơ sở
                </label>
                <input
                  type="number"
                  {...register('stock')}
                  min={0}
                  className="w-full bg-surface-subtle border border-border-base rounded-theme px-3.5 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                {errors.stock && (
                  <p className="text-status-danger text-[11px] mt-1">{errors.stock.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-main mb-1">
                  Báo sắp hết
                </label>
                <input
                  type="number"
                  {...register('lowStockThreshold')}
                  min={1}
                  className="w-full bg-surface-subtle border border-border-base rounded-theme px-3.5 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          </div>

          {/* Visibility & Organization */}
          <div className="p-6 rounded-theme bg-surface-card border border-border-base shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-content-main uppercase tracking-wider">
              Trạng Thái & Phân Loại
            </h3>

            <div>
              <label className="block text-xs font-semibold text-content-main mb-1">
                Trạng thái hiển thị
              </label>
              <select
                {...register('status')}
                className="w-full bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="active">Đang kinh doanh (Active)</option>
                <option value="draft">Bản nháp (Draft)</option>
                <option value="archived">Lưu trữ (Archived)</option>
              </select>
            </div>

            <div className="space-y-3 pt-2">
              <Controller
                control={control}
                name="isFeatured"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onChange={field.onChange}
                    label="Sản phẩm nổi bật"
                    description="Ưu tiên hiển thị trên trang chủ"
                    size="sm"
                  />
                )}
              />

              <Controller
                control={control}
                name="isFlashSale"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onChange={field.onChange}
                    label="Bật Flash Sale"
                    description="Kích hoạt giá sốc và đồng hồ đếm ngược"
                    size="sm"
                  />
                )}
              />
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-content-main mb-1">
                Thẻ tìm kiếm (Tags)
              </label>
              <input
                type="text"
                {...register('tags')}
                placeholder="áo nam, polo, cotton, hè 2026"
                className="w-full bg-surface-subtle border border-border-base rounded-theme px-3.5 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <p className="text-[11px] text-content-muted mt-1">
                Cách nhau bằng dấu phẩy
              </p>
            </div>
          </div>

          {/* Google Search Preview */}
          <div className="p-6 rounded-theme bg-surface-card border border-border-base shadow-sm space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-content-muted">
              Xem Trước Kết Quả Tìm Kiếm (SEO)
            </h3>
            <div className="pt-2">
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate">
                https://d2cstore.vn/product/{watch('slug') || 'san-pham'}
              </div>
              <div className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 hover:underline cursor-pointer truncate mt-0.5">
                {watch('name') || 'Tên sản phẩm mẫu hiển thị trên Google'}
              </div>
              <div className="text-xs text-content-muted line-clamp-2 mt-1">
                {watch('description') ||
                  'Mô tả tóm tắt của sản phẩm sẽ được các công cụ tìm kiếm index hiển thị cho khách hàng.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default ProductFormPage;
