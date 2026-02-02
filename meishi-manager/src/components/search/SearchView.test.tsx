import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { SearchView } from './SearchView';
import * as useCardsHook from '../../hooks/useCards';
import type { BusinessCard } from '../../types';

// useCardsをモック
vi.mock('../../hooks/useCards');

// CardItemをモック
vi.mock('../cards/CardItem', () => ({
  CardItem: ({ card }: { card: BusinessCard }) => (
    <div data-testid="card-item">{card.name}</div>
  ),
}));

describe('SearchView', () => {
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
  ];

  const mockRefresh = vi.fn();
  const mockFetchCards = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(useCardsHook, 'useCards').mockReturnValue({
      cards: mockCards,
      loading: false,
      error: null,
      fetchCards: mockFetchCards,
      refresh: mockRefresh,
    });
  });

  describe('表示', () => {
    it('検索バーが表示される', () => {
      render(<SearchView />);

      expect(screen.getByPlaceholderText(/検索/i)).toBeInTheDocument();
    });

    it('初期状態では全ての名刺が表示される', () => {
      render(<SearchView />);

      const cardItems = screen.getAllByTestId('card-item');
      expect(cardItems).toHaveLength(2);
    });

    it('ページタイトルが表示される', () => {
      render(<SearchView />);

      expect(screen.getByText(/検索/i)).toBeInTheDocument();
    });
  });

  describe('検索機能', () => {
    it('検索すると結果が絞り込まれる', async () => {
      const user = userEvent.setup();

      render(<SearchView />);

      const searchInput = screen.getByPlaceholderText(/検索/i);
      await user.type(searchInput, '山田');

      await waitFor(() => {
        const cardItems = screen.getAllByTestId('card-item');
        expect(cardItems).toHaveLength(1);
        expect(cardItems[0]).toHaveTextContent('山田 太郎');
      });
    });

    it('検索結果が0件の場合はメッセージが表示される', async () => {
      const user = userEvent.setup();

      render(<SearchView />);

      const searchInput = screen.getByPlaceholderText(/検索/i);
      await user.type(searchInput, '存在しない名前');

      await waitFor(() => {
        expect(screen.getByText(/該当する名刺が見つかりません/i)).toBeInTheDocument();
      });
    });

    it('検索をクリアすると全ての名刺が再表示される', async () => {
      const user = userEvent.setup();

      render(<SearchView />);

      // 検索
      const searchInput = screen.getByPlaceholderText(/検索/i);
      await user.type(searchInput, '山田');

      await waitFor(() => {
        expect(screen.getAllByTestId('card-item')).toHaveLength(1);
      });

      // クリア
      const clearButton = screen.getByRole('button', { name: /クリア|×/i });
      await user.click(clearButton);

      await waitFor(() => {
        expect(screen.getAllByTestId('card-item')).toHaveLength(2);
      });
    });
  });

  describe('ローディング状態', () => {
    it('ローディング中はローディングメッセージが表示される', () => {
      vi.spyOn(useCardsHook, 'useCards').mockReturnValue({
        cards: [],
        loading: true,
        error: null,
        fetchCards: mockFetchCards,
        refresh: mockRefresh,
      });

      render(<SearchView />);

      expect(screen.getByText(/読み込み中/i)).toBeInTheDocument();
    });
  });

  describe('エラー状態', () => {
    it('エラー時はエラーメッセージが表示される', () => {
      vi.spyOn(useCardsHook, 'useCards').mockReturnValue({
        cards: [],
        loading: false,
        error: '名刺の取得に失敗しました',
        fetchCards: mockFetchCards,
        refresh: mockRefresh,
      });

      render(<SearchView />);

      expect(screen.getByText(/名刺の取得に失敗しました/i)).toBeInTheDocument();
    });
  });

  describe('タグフィルター', () => {
    it('タグが表示される', () => {
      render(<SearchView />);

      // 全ての名刺から一意のタグを収集
      expect(screen.getByText('取引先')).toBeInTheDocument();
      expect(screen.getByText('重要')).toBeInTheDocument();
      expect(screen.getByText('パートナー')).toBeInTheDocument();
    });

    it('タグをクリックするとフィルタリングされる', async () => {
      const user = userEvent.setup();

      render(<SearchView />);

      // 「重要」タグをクリック
      const tagButton = screen.getByText('重要');
      await user.click(tagButton);

      await waitFor(() => {
        const cardItems = screen.getAllByTestId('card-item');
        expect(cardItems).toHaveLength(1);
        expect(cardItems[0]).toHaveTextContent('山田 太郎');
      });
    });
  });
});
