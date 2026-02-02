import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCards } from './useCards';
import * as gasService from '../services/gasService';
import type { BusinessCard } from '../types';

// gasServiceをモック
vi.mock('../services/gasService');

describe('useCards', () => {
  const mockCards: BusinessCard[] = [
    {
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
      tags: ['取引先', '重要'],
      rawText: '山田太郎\n株式会社テスト',
      scannedAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: '佐藤 花子',
      nameKana: 'サトウ ハナコ',
      company: '株式会社サンプル',
      department: '企画部',
      position: '課長',
      phone: '03-9876-5432',
      fax: '',
      email: 'sato@sample.com',
      address: '東京都新宿区',
      postalCode: '160-0001',
      url: 'https://sample.com',
      tags: ['パートナー'],
      rawText: '佐藤花子\n株式会社サンプル',
      scannedAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('初期状態', () => {
    it('マウント時に自動取得が開始される', async () => {
      vi.spyOn(gasService, 'getAllBusinessCards').mockResolvedValue({
        success: true,
        cards: [],
      });

      const { result } = renderHook(() => useCards());

      // マウント直後はloading状態
      expect(result.current.loading).toBe(true);
      expect(result.current.cards).toEqual([]);
      expect(result.current.error).toBeNull();

      // 取得完了後
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('fetchCards', () => {
    it('正常系: 名刺一覧を取得できる', async () => {
      vi.spyOn(gasService, 'getAllBusinessCards').mockResolvedValue({
        success: true,
        cards: mockCards,
      });

      const { result } = renderHook(() => useCards());

      await act(async () => {
        await result.current.fetchCards();
      });

      await waitFor(() => {
        expect(result.current.cards).toEqual(mockCards);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    it('異常系: エラー時にエラーメッセージが設定される', async () => {
      vi.spyOn(gasService, 'getAllBusinessCards').mockResolvedValue({
        success: false,
        cards: [],
      });

      const { result } = renderHook(() => useCards());

      await act(async () => {
        await result.current.fetchCards();
      });

      await waitFor(() => {
        expect(result.current.cards).toEqual([]);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).not.toBeNull();
      });
    });

    it('異常系: 例外発生時にエラーメッセージが設定される', async () => {
      vi.spyOn(gasService, 'getAllBusinessCards').mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useCards());

      await act(async () => {
        await result.current.fetchCards();
      });

      await waitFor(() => {
        expect(result.current.cards).toEqual([]);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('Network error');
      });
    });

    it('取得中はloadingがtrueになる', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      vi.spyOn(gasService, 'getAllBusinessCards').mockReturnValue(
        promise as any
      );

      const { result } = renderHook(() => useCards());

      act(() => {
        result.current.fetchCards();
      });

      // 取得中はloadingがtrue
      expect(result.current.loading).toBe(true);

      // プロミスを解決
      await act(async () => {
        resolvePromise!({ success: true, cards: mockCards });
        await promise;
      });

      // 完了後はloadingがfalse
      expect(result.current.loading).toBe(false);
    });
  });

  describe('refresh', () => {
    it('refreshを呼ぶと再度データを取得する', async () => {
      const getAllSpy = vi
        .spyOn(gasService, 'getAllBusinessCards')
        .mockResolvedValue({
          success: true,
          cards: mockCards,
        });

      const { result } = renderHook(() => useCards());

      // マウント時の自動取得を待つ
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(getAllSpy).toHaveBeenCalledTimes(1);

      // リフレッシュ
      await act(async () => {
        await result.current.refresh();
      });

      expect(getAllSpy).toHaveBeenCalledTimes(2);
    });

    it('refreshはエラーをクリアしてから再取得する', async () => {
      // 最初はエラー
      vi.spyOn(gasService, 'getAllBusinessCards').mockResolvedValueOnce({
        success: false,
        cards: [],
      });

      const { result } = renderHook(() => useCards());

      await act(async () => {
        await result.current.fetchCards();
      });

      expect(result.current.error).not.toBeNull();

      // 2回目は成功
      vi.spyOn(gasService, 'getAllBusinessCards').mockResolvedValueOnce({
        success: true,
        cards: mockCards,
      });

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.cards).toEqual(mockCards);
      });
    });
  });

  describe('自動取得', () => {
    it('マウント時に自動的にデータを取得する', async () => {
      const getAllSpy = vi
        .spyOn(gasService, 'getAllBusinessCards')
        .mockResolvedValue({
          success: true,
          cards: mockCards,
        });

      renderHook(() => useCards());

      await waitFor(() => {
        expect(getAllSpy).toHaveBeenCalledTimes(1);
      });
    });
  });
});
