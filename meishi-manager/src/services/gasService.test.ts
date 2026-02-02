import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BusinessCard } from '../types';

// 環境変数を設定（gasServiceのインポート前に設定する必要がある）
vi.stubEnv('VITE_GAS_WEB_APP_URL', 'https://script.google.com/test');

import {
  createBusinessCard,
  updateBusinessCard,
  deleteBusinessCard,
  getAllBusinessCards,
  getBusinessCard,
  createCard,
} from './gasService';

// fetchをモック
global.fetch = vi.fn();

describe('gasService', () => {
  const mockCard: BusinessCard = {
    id: '1',
    name: '山田 太郎',
    nameKana: 'ヤマダ タロウ',
    company: '株式会社テスト',
    department: '営業部',
    position: '部長',
    phone: '03-1234-5678',
    fax: '',
    email: 'yamada@test.com',
    address: '東京都渋谷区',
    postalCode: '150-0001',
    url: 'https://test.com',
    tags: ['取引先'],
    rawText: '山田太郎',
    scannedAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createBusinessCard', () => {
    it('成功時に正しいレスポンスを返す', async () => {
      const mockResponse = {
        success: true,
        message: '保存しました',
        data: { id: 'new-id-123' },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await createBusinessCard(mockCard);

      expect(result.success).toBe(true);
      expect(result.message).toBe('保存しました');
      expect(result.id).toBe('new-id-123');
      expect(global.fetch).toHaveBeenCalled();
      // fetchの呼び出し引数を確認
      const [[url, options]] = (global.fetch as any).mock.calls;
      expect(options).toMatchObject({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('失敗時にエラーレスポンスを返す', async () => {
      const mockResponse = {
        success: false,
        message: '保存に失敗しました',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse,
      });

      const result = await createBusinessCard(mockCard);

      expect(result.success).toBe(false);
      expect(result.message).toBe('保存に失敗しました');
    });

    it('fetch失敗時にエラーハンドリング', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await createBusinessCard(mockCard);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Network error');
    });

    it('JSONパースエラー時にエラーハンドリング', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const result = await createBusinessCard(mockCard);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid JSON');
    });
  });

  describe('updateBusinessCard', () => {
    it('成功時に正しいレスポンスを返す', async () => {
      const mockResponse = {
        success: true,
        message: '更新しました',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await updateBusinessCard('1', { name: '新しい名前' });

      expect(result.success).toBe(true);
      expect(result.message).toBe('更新しました');
      expect(global.fetch).toHaveBeenCalled();
      const [[url, options]] = (global.fetch as any).mock.calls;
      expect(options).toMatchObject({
        method: 'POST',
      });
    });

    it('失敗時にエラーレスポンスを返す', async () => {
      const mockResponse = {
        success: false,
        message: '更新に失敗しました',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse,
      });

      const result = await updateBusinessCard('1', { name: '新しい名前' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('更新に失敗しました');
    });

    it('fetch失敗時にエラーハンドリング', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await updateBusinessCard('1', { name: '新しい名前' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Network error');
    });
  });

  describe('deleteBusinessCard', () => {
    it('成功時に正しいレスポンスを返す', async () => {
      const mockResponse = {
        success: true,
        message: '削除しました',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await deleteBusinessCard('1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('削除しました');
      expect(global.fetch).toHaveBeenCalled();
      const [[url, options]] = (global.fetch as any).mock.calls;
      expect(options).toMatchObject({
        method: 'POST',
      });
    });

    it('失敗時にエラーレスポンスを返す', async () => {
      const mockResponse = {
        success: false,
        message: '削除に失敗しました',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse,
      });

      const result = await deleteBusinessCard('1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('削除に失敗しました');
    });

    it('fetch失敗時にエラーハンドリング', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await deleteBusinessCard('1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Network error');
    });
  });

  describe('getAllBusinessCards', () => {
    it('成功時に名刺リストを返す', async () => {
      const mockResponse = {
        success: true,
        message: '取得しました',
        data: {
          cards: [mockCard],
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getAllBusinessCards();

      expect(result.success).toBe(true);
      expect(result.cards).toEqual([mockCard]);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('action=list')
      );
    });

    it('データがない場合は空配列を返す', async () => {
      const mockResponse = {
        success: true,
        message: '取得しました',
        data: {},
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getAllBusinessCards();

      expect(result.success).toBe(true);
      expect(result.cards).toEqual([]);
    });

    it('fetch失敗時にエラーハンドリング', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await getAllBusinessCards();

      expect(result.success).toBe(false);
      expect(result.cards).toEqual([]);
    });
  });

  describe('getBusinessCard', () => {
    it('成功時に名刺を返す', async () => {
      const mockResponse = {
        success: true,
        message: '取得しました',
        data: {
          card: mockCard,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getBusinessCard('1');

      expect(result.success).toBe(true);
      expect(result.card).toEqual(mockCard);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('action=get&id=1')
      );
    });

    it('失敗時にundefinedを返す', async () => {
      const mockResponse = {
        success: false,
        message: '取得に失敗しました',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse,
      });

      const result = await getBusinessCard('1');

      expect(result.success).toBe(false);
      expect(result.card).toBeUndefined();
    });

    it('fetch失敗時にエラーハンドリング', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await getBusinessCard('1');

      expect(result.success).toBe(false);
      expect(result.card).toBeUndefined();
    });
  });

  describe('createCard', () => {
    it('成功時にBusinessCardオブジェクトを返す', async () => {
      const mockResponse = {
        success: true,
        message: '保存しました',
        data: { id: 'new-id-123' },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const cardData = {
        name: '山田 太郎',
        nameKana: 'ヤマダ タロウ',
        company: '株式会社テスト',
        department: '営業部',
        position: '部長',
        phone: '03-1234-5678',
        fax: '',
        email: 'yamada@test.com',
        address: '東京都渋谷区',
        postalCode: '150-0001',
        url: 'https://test.com',
        tags: ['取引先'],
        rawText: '山田太郎',
      };

      const result = await createCard(cardData);

      expect(result.id).toBe('new-id-123');
      expect(result.name).toBe('山田 太郎');
      expect(result.scannedAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('失敗時にエラーをスロー', async () => {
      const mockResponse = {
        success: false,
        message: '保存に失敗しました',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse,
      });

      const cardData = {
        name: '山田 太郎',
        nameKana: 'ヤマダ タロウ',
        company: '株式会社テスト',
        department: '営業部',
        position: '部長',
        phone: '03-1234-5678',
        fax: '',
        email: 'yamada@test.com',
        address: '東京都渋谷区',
        postalCode: '150-0001',
        url: 'https://test.com',
        tags: ['取引先'],
        rawText: '山田太郎',
      };

      await expect(createCard(cardData)).rejects.toThrow('保存に失敗しました');
    });

    it('IDが返されない場合はエラーをスロー', async () => {
      const mockResponse = {
        success: true,
        message: '保存しました',
        data: {},
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const cardData = {
        name: '山田 太郎',
        nameKana: 'ヤマダ タロウ',
        company: '株式会社テスト',
        department: '営業部',
        position: '部長',
        phone: '03-1234-5678',
        fax: '',
        email: 'yamada@test.com',
        address: '東京都渋谷区',
        postalCode: '150-0001',
        url: 'https://test.com',
        tags: ['取引先'],
        rawText: '山田太郎',
      };

      await expect(createCard(cardData)).rejects.toThrow('保存しました');
    });
  });
});
