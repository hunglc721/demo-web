/**
 * Storefront Modular Block Configuration Service
 */

import { StorefrontBlockConfig } from '@/types/block';
import { LocalStorageRepository } from '../mock/LocalStorageRepository';
import { STORAGE_KEYS } from '../storage/storageKeys';
import { defaultStorefrontBlocks } from '../seed/blocksSeed';

export class BlockService {
  private repo: LocalStorageRepository<StorefrontBlockConfig>;

  constructor() {
    this.repo = new LocalStorageRepository<StorefrontBlockConfig>(
      STORAGE_KEYS.BLOCKS,
      defaultStorefrontBlocks
    );
  }

  public getRepository(): LocalStorageRepository<StorefrontBlockConfig> {
    return this.repo;
  }

  public async getBlocks(): Promise<StorefrontBlockConfig[]> {
    const blocks = await this.repo.findMany();
    return [...blocks].sort((a, b) => a.order - b.order);
  }

  public async getBlockById(id: string): Promise<StorefrontBlockConfig | null> {
    return this.repo.getById(id);
  }

  public async updateBlock(
    id: string,
    updates: Partial<StorefrontBlockConfig>
  ): Promise<StorefrontBlockConfig> {
    const updated = await this.repo.update(id, updates);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('d2c:blocks-updated', { detail: updated }));
    }
    return updated;
  }

  public async saveBlocks(
    blocks: StorefrontBlockConfig[]
  ): Promise<StorefrontBlockConfig[]> {
    for (const b of blocks) {
      await this.repo.update(b.id, b);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('d2c:blocks-updated', { detail: blocks }));
    }
    return this.getBlocks();
  }

  public async resetBlocks(): Promise<StorefrontBlockConfig[]> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.BLOCKS, JSON.stringify(defaultStorefrontBlocks));
    }
    this.repo = new LocalStorageRepository<StorefrontBlockConfig>(
      STORAGE_KEYS.BLOCKS,
      defaultStorefrontBlocks
    );
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('d2c:blocks-updated', { detail: defaultStorefrontBlocks }));
    }
    return defaultStorefrontBlocks;
  }
}

export const blockService = new BlockService();
