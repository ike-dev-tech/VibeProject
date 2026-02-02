import { useState, useEffect } from 'react';
import { getAllBusinessCards } from '../services/gasService';
import type { BusinessCard } from '../types';

interface UseCardsReturn {
  cards: BusinessCard[];
  loading: boolean;
  error: string | null;
  fetchCards: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * 名刺データ管理フック
 * GASから名刺一覧を取得し、状態を管理する
 */
export function useCards(): UseCardsReturn {
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 名刺一覧を取得
   */
  const fetchCards = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getAllBusinessCards();

      if (result.success) {
        setCards(result.cards);
      } else {
        setError('名刺の取得に失敗しました');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '名刺の取得に失敗しました';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * データを再取得（リフレッシュ）
   */
  const refresh = async () => {
    setError(null);
    await fetchCards();
  };

  /**
   * マウント時に自動的にデータを取得
   */
  useEffect(() => {
    fetchCards();
  }, []);

  return {
    cards,
    loading,
    error,
    fetchCards,
    refresh,
  };
}
