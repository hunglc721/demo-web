/**
 * Configurable Mock Latency & Chaos Simulator
 */

import { STORAGE_KEYS } from './storageKeys';
import { DalApiError } from '@/types/dal';
import { simulateDelay } from './mockLatency';

export { DalApiError };

export interface MockEngineConfig {
  delayEnabled: boolean;
  minDelayMs: number;
  maxDelayMs: number;
  slowNetworkMode: boolean;
  errorRate: number; // 0 to 1 (e.g. 0.05 = 5%)
  simulateOffline: boolean;
  simulateServerError: boolean;
  logOperations: boolean;
}

export const defaultMockEngineConfig: MockEngineConfig = {
  delayEnabled: true,
  minDelayMs: 200,
  maxDelayMs: 400,
  slowNetworkMode: false,
  errorRate: 0,
  simulateOffline: false,
  simulateServerError: false,
  logOperations: Boolean((import.meta as any)?.env?.DEV),
};

export class MockEngineManager {
  private config: MockEngineConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): MockEngineConfig {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEYS.MOCK_CONFIG);
        if (stored) {
          return { ...defaultMockEngineConfig, ...JSON.parse(stored) };
        }
      }
    } catch {
      // Ignore
    }
    return { ...defaultMockEngineConfig };
  }

  public getConfig(): MockEngineConfig {
    return { ...this.config };
  }

  public updateConfig(partial: Partial<MockEngineConfig>): void {
    this.config = { ...this.config, ...partial };
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.MOCK_CONFIG, JSON.stringify(this.config));
      }
    } catch {
      // Ignore
    }
  }

  public async simulateDelay(): Promise<void> {
    if (!this.config.delayEnabled) return;

    await simulateDelay({
      enabled: this.config.delayEnabled,
      minDelayMs: this.config.minDelayMs,
      maxDelayMs: this.config.maxDelayMs,
      slowNetworkMode: this.config.slowNetworkMode,
    });
  }

  public maybeInjectError(operationName: string): void {
    if (this.config.simulateOffline) {
      throw new DalApiError(
        'Mất kết nối mạng. Không thể gửi yêu cầu đến máy chủ.',
        0,
        'NETWORK_OFFLINE'
      );
    }

    if (this.config.simulateServerError) {
      throw new DalApiError(
        `Máy chủ gặp sự cố nội bộ khi thực hiện [${operationName}].`,
        500,
        'INTERNAL_SERVER_ERROR'
      );
    }

    if (this.config.errorRate > 0 && Math.random() < this.config.errorRate) {
      throw new DalApiError(
        `Mô phỏng lỗi ngẫu nhiên trong [${operationName}] (Tỷ lệ lỗi: ${(this.config.errorRate * 100).toFixed(0)}%).`,
        500,
        'SIMULATED_CHAOS_ERROR'
      );
    }
  }

  public log(op: string, details?: unknown): void {
    if (this.config.logOperations && typeof console !== 'undefined') {
      console.log(`[DAL] ${op}`, details ?? '');
    }
  }
}

export const mockEngine = new MockEngineManager();
