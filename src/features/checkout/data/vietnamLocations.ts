export interface VietnamDivision {
  id: string;
  level: number;
  name: { local: string; en: string; slug: string };
  parent: { id: string; level: number; name: { local: string; en: string; slug: string } } | null;
}

export interface VietnamLocationData {
  provinces: VietnamDivision[];
  wards: VietnamDivision[];
}

let cachedLocations: Promise<VietnamLocationData> | undefined;

export function loadVietnamLocations(): Promise<VietnamLocationData> {
  if (!cachedLocations) {
    cachedLocations = Promise.all([
      fetch('/data/vietnam-provinces.json').then(assertOk).then(response => response.json() as Promise<VietnamDivision[]>),
      fetch('/data/vietnam-wards.json').then(assertOk).then(response => response.json() as Promise<VietnamDivision[]>),
    ]).then(([provinces, wards]) => ({
      provinces: provinces.filter(division => division.level === 1),
      wards: wards.filter(division => division.level === 2 && division.parent),
    })).catch(error => {
      cachedLocations = undefined;
      throw error;
    });
  }
  return cachedLocations;
}

function assertOk(response: Response): Response {
  if (!response.ok) throw new Error(`Không tải được danh mục địa chỉ (${response.status}).`);
  return response;
}
