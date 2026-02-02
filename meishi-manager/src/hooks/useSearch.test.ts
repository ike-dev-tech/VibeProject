import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearch } from './useSearch';
import type { BusinessCard } from '../types';

describe('useSearch', () => {
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
      rawText: '山田太郎',
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
      rawText: '佐藤花子',
      scannedAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
    {
      id: '3',
      name: '田中 一郎',
      nameKana: 'タナカ イチロウ',
      company: '株式会社テスト',
      department: '技術部',
      position: 'エンジニア',
      phone: '03-5555-1234',
      fax: '',
      email: 'tanaka@test.com',
      address: '東京都港区',
      postalCode: '105-0001',
      url: 'https://test.com',
      tags: ['取引先', 'エンジニア'],
      rawText: '田中一郎',
      scannedAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z',
    },
  ];

  describe('初期状態', () => {
    it('検索クエリが空の場合は全ての名刺が返される', () => {
      const { result } = renderHook(() => useSearch(mockCards));

      expect(result.current.filteredCards).toHaveLength(3);
      expect(result.current.query).toBe('');
      expect(result.current.selectedTags).toEqual([]);
    });
  });

  describe('名前検索', () => {
    it('名前で検索できる', () => {
      const { result } = renderHook(() => useSearch(mockCards));

      act(() => {
        result.current.setQuery('山田');
      });

      expect(result.current.filteredCards).toHaveLength(1);
      expect(result.current.filteredCards[0].name).toBe('山田 太郎');
    });

    it('部分一致で検索できる', () => {
      const { result } = renderHook(() => useSearch(mockCards));

      act(() => {
        result.current.setQuery('太郎');
      });

      expect(result.current.filteredCards).toHaveLength(1);
      expect(result.current.filteredCards[0].name).toBe('山田 太郎');
    });

    it('大文字小文字を区別しない', () => {
      const { result } = renderHook(() => useSearch(mockCards));

      act(() => {
        result.current.setQuery('yamada');
      });

      expect(result.current.filteredCards).toHaveLength(1);
      expect(result.current.filteredCards[0].email).toBe('yamada@test.com');
    });
  });

  describe('会社名検索', () => {
    it('会社名で検索できる', () => {
      const { result } = renderHook(() => useSearch(mockCards));

      act(() => {
        result.current.setQuery('サンプル');
      });

      expect(result.current.filteredCards).toHaveLength(1);
      expect(result.current.filteredCards[0].company).toBe('株式会社サンプル');
    });

    it('同じ会社の複数の名刺が検索される', () => {
      const { result } = renderHook(() => useSearch(mockCards));

      act(() => {
        result.current.setQuery('テスト');
      });

      expect(result.current.filteredCards).toHaveLength(2);
      expect(result.current.filteredCards[0].company).toBe('株式会社テスト');
      expect(result.current.filteredCards[1].company).toBe('株式会社テスト');
    });
  });

  describe('複数フィールド検索', () => {
    it('部署名で検索できる', () => {
      const { result } = renderHook(() => useSearch(mockCards));

      act(() => {
        result.current.setQuery('営業部');
      });

      expect(result.current.filteredCards).toHaveLength(1);
      expect(result.current.filteredCards[0].department).toBe('営業部');
    });

    it('役職で検索できる', () => {
      const { result } = renderHook(() => useSearch(mockCards));

      act(() => {
        result.current.setQuery('部長');
      });

      expect(result.current.filteredCards).toHaveLength(1);
      expect(result.current.filteredCards[0].position).toBe('部長');
    });

    it('電話番号で検索できる', () => {
      const { result } = renderHook(() => useSearch(mockCards));

      act(() => {
        result.current.setQuery('03-1234');
      });

      expect(result.current.filteredCards).toHaveLength(1);
      expect(result.current.filteredCards[0].phone).toBe('03-1234-5678');
    });

    it('メールアドレスで検索できる', () => {
      const { result } = renderHook(() => useSearch(mockCards));

      act(() => {
        result.current.setQuery('sample.com');
      });

      expect(result.current.filteredCards).toHaveLength(1);
      expect(result.current.filteredCards[0].email).toBe('sato@sample.com');
    });
  });

  describe('タグフィルタリング', () => {
    it('タグで絞り込みができる', () => {
      const { result } = renderHook(() => useSearch(mockCards));

      act(() => {
        result.current.setSelectedTags(['重要']);
      });

      expect(result.current.filteredCards).toHaveLength(1);
      expect(result.current.filteredCards[0].tags).toContain('重要');
    });

    it('複数タグでOR条件フィルタリングできる', () => {
      const { result } = renderHook(() => useSearch(mockCards));

      act(() => {
        result.current.setSelectedTags(['重要', 'パートナー']);
      });

      expect(result.current.filteredCards).toHaveLength(2);
    });

    it('複数タグを持つ名刺が検索される', () => {
      const { result } = renderHook(() => useSearch(mockCards));

      act(() => {
        result.current.setSelectedTags(['エンジニア']);
      });

      expect(result.current.filteredCards).toHaveLength(1);
      expect(result.current.filteredCards[0].name).toBe('田中 一郎');
    });
  });

  describe('検索クエリとタグの組み合わせ', () => {
    it('検索クエリとタグの両方が指定された場合はAND条件で絞り込む', () => {
      const { result } = renderHook(() => useSearch(mockCards));

      act(() => {
        result.current.setQuery('テスト');
        result.current.setSelectedTags(['重要']);
      });

      expect(result.current.filteredCards).toHaveLength(1);
      expect(result.current.filteredCards[0].name).toBe('山田 太郎');
    });

    it('検索クエリとタグのどちらも一致しない場合は空配列が返される', () => {
      const { result } = renderHook(() => useSearch(mockCards));

      act(() => {
        result.current.setQuery('存在しない');
        result.current.setSelectedTags(['存在しないタグ']);
      });

      expect(result.current.filteredCards).toHaveLength(0);
    });
  });

  describe('検索クリア', () => {
    it('検索クエリをクリアできる', () => {
      const { result } = renderHook(() => useSearch(mockCards));

      act(() => {
        result.current.setQuery('山田');
      });

      expect(result.current.filteredCards).toHaveLength(1);

      act(() => {
        result.current.setQuery('');
      });

      expect(result.current.filteredCards).toHaveLength(3);
    });

    it('タグ選択をクリアできる', () => {
      const { result } = renderHook(() => useSearch(mockCards));

      act(() => {
        result.current.setSelectedTags(['重要']);
      });

      expect(result.current.filteredCards).toHaveLength(1);

      act(() => {
        result.current.setSelectedTags([]);
      });

      expect(result.current.filteredCards).toHaveLength(3);
    });
  });

  describe('検索結果0件', () => {
    it('一致する名刺がない場合は空配列が返される', () => {
      const { result } = renderHook(() => useSearch(mockCards));

      act(() => {
        result.current.setQuery('存在しない名前');
      });

      expect(result.current.filteredCards).toHaveLength(0);
    });
  });
});
