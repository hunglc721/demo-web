import React, { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import {
  getVietnam63Provinces,
  getDistrictsByProvince,
  getWardsByDistrict,
} from '../data/vietnamAddressData';

export interface VietnamAddressCascaderProps {
  province: string;
  district: string;
  ward: string;
  street?: string;
  errors?: {
    province?: string;
    district?: string;
    ward?: string;
  };
  onProvinceChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  onWardChange: (value: string) => void;
  disabled?: boolean;
}

export const VietnamAddressCascader: React.FC<VietnamAddressCascaderProps> = ({
  province,
  district,
  ward,
  street = '',
  errors,
  onProvinceChange,
  onDistrictChange,
  onWardChange,
  disabled = false,
}) => {
  const provinces = useMemo(() => getVietnam63Provinces(), []);
  const districts = useMemo(() => getDistrictsByProvince(province), [province]);
  const wards = useMemo(() => getWardsByDistrict(province, district), [province, district]);

  const handleSelectProvince = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextProv = e.target.value;
    onProvinceChange(nextProv);
    onDistrictChange('');
    onWardChange('');
  };

  const handleSelectDistrict = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextDist = e.target.value;
    onDistrictChange(nextDist);
    onWardChange('');
  };

  const handleSelectWard = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onWardChange(e.target.value);
  };

  const fullAddressPreview = [street.trim(), ward.trim(), district.trim(), province.trim()]
    .filter(Boolean)
    .join(', ');

  const selectClass =
    'w-full rounded-theme border border-border-base bg-surface-subtle px-3 py-2 text-xs sm:text-sm text-content-main outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all';

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {/* 1. Tỉnh / Thành phố */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-content-main">
            Tỉnh / Thành phố <span className="text-status-danger">*</span>
          </label>
          <select
            value={province}
            onChange={handleSelectProvince}
            disabled={disabled}
            className={`${selectClass} ${errors?.province ? 'border-status-danger' : ''}`}
            aria-label="Tỉnh hoặc Thành phố"
          >
            <option value="">-- Chọn Tỉnh / Thành --</option>
            {provinces.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {errors?.province && (
            <p role="alert" className="text-[11px] text-status-danger">
              {errors.province}
            </p>
          )}
        </div>

        {/* 2. Quận / Huyện */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-content-main">
            Quận / Huyện <span className="text-status-danger">*</span>
          </label>
          <select
            value={district}
            onChange={handleSelectDistrict}
            disabled={disabled || !province || districts.length === 0}
            className={`${selectClass} ${errors?.district ? 'border-status-danger' : ''}`}
            aria-label="Quận hoặc Huyện"
          >
            <option value="">
              {!province ? '-- Chọn Tỉnh trước --' : '-- Chọn Quận / Huyện --'}
            </option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {errors?.district && (
            <p role="alert" className="text-[11px] text-status-danger">
              {errors.district}
            </p>
          )}
        </div>

        {/* 3. Phường / Xã */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-content-main">
            Phường / Xã <span className="text-status-danger">*</span>
          </label>
          <select
            value={ward}
            onChange={handleSelectWard}
            disabled={disabled || !district || wards.length === 0}
            className={`${selectClass} ${errors?.ward ? 'border-status-danger' : ''}`}
            aria-label="Phường hoặc Xã"
          >
            <option value="">
              {!district ? '-- Chọn Huyện trước --' : '-- Chọn Phường / Xã --'}
            </option>
            {wards.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
          {errors?.ward && (
            <p role="alert" className="text-[11px] text-status-danger">
              {errors.ward}
            </p>
          )}
        </div>
      </div>

      {/* Live Full Address Preview */}
      {fullAddressPreview && (
        <div className="flex items-start gap-2 rounded-theme border border-primary/20 bg-primary/5 p-2.5 text-xs text-content-main">
          <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-primary">Địa chỉ giao hàng dự kiến:</span>
            <p className="font-medium text-content-main">{fullAddressPreview}</p>
          </div>
        </div>
      )}
    </div>
  );
};
