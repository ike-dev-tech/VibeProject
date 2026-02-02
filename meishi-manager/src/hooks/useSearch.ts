import { useState, useMemo } from 'react';
import type { BusinessCard } from '../types';

interface UseSearchReturn {
  filteredCards: BusinessCard[];
  query: string;
  selectedTags: string[];
  setQuery: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;
}

/**
 * 名刺検索フック
 * 検索クエリとタグでフィルタリングする
 */
export function useSearch(cards: BusinessCard[]): UseSearchReturn {
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  /**
   * フィルタリングされた名刺リスト
   */
  const filteredCards = useMemo(() => {
    let result = cards;

    // 検索クエリでフィルタリング
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      result = result.filter((card) => {
        // 検索対象フィールド
        const searchableFields = [
          card.name,
          card.nameKana,
          card.company,
          card.department,
          card.position,
          card.phone,
          card.email,
          card.address,
        ];

        return searchableFields.some(
          (field) => field && field.toLowerCase().includes(lowerQuery)
        );
      });
    }

    // タグでフィルタリング
    if (selectedTags.length > 0) {
      result = result.filter((card) =>
        selectedTags.some((tag) => card.tags.includes(tag))
      );
    }

    return result;
  }, [cards, query, selectedTags]);

  return {
    filteredCards,
    query,
    selectedTags,
    setQuery,
    setSelectedTags,
  };
}
