export interface ResetDemoDataResult {
  success: boolean;
  clearedKeys: string[];
  seededCollections: Record<string, number>;
  timestamp: string;
}

export interface StorageItemReport {
  key: string;
  bytes: number;
  formatted: string;
  percentage: number;
}

export interface StorageUsageReport {
  usedBytes: number;
  usedFormatted: string;
  limitBytes: number;
  usagePercentage: number;
  isNearLimit: boolean;  // >= 80%
  isCritical: boolean;   // >= 95%
  breakdown: StorageItemReport[];
}

export interface ISystemService {
  resetDemoData(): Promise<ResetDemoDataResult>;
  initSeedIfEmpty(): void;
  getStorageReport(): StorageUsageReport;
}
