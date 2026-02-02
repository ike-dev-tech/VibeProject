import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { CardList } from './CardList';
import * as useCardsHook from '../../hooks/useCards';
import type { BusinessCard } from '../../types';

// useCardsフックをモック
vi.mock('../../hooks/useCards');

// CardItemコンポーネントをモック
vi.mock('./CardItem', () => ({
  CardItem: ({ card }: { card: BusinessCard }) => (
    <div data-testid="card-item">{card.name}</div>
  ),
}));

describe('CardList', () => {
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
      tags: ['取引先'],
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

  const mockRefresh = vi.fn();
  const mockFetchCards = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
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

      render(<CardList />);

      expect(screen.getByText(/読み込み中/i)).toBeInTheDocument();
    });

    it('ローディング中は名刺カードが表示されない', () => {
      vi.spyOn(useCardsHook, 'useCards').mockReturnValue({
        cards: mockCards,
        loading: true,
        error: null,
        fetchCards: mockFetchCards,
        refresh: mockRefresh,
      });

      render(<CardList />);

      expect(screen.queryByTestId('card-item')).not.toBeInTheDocument();
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

      render(<CardList />);

      expect(screen.getByText(/名刺の取得に失敗しました/i)).toBeInTheDocument();
    });

    it('エラー時は再試行ボタンが表示される', () => {
      vi.spyOn(useCardsHook, 'useCards').mockReturnValue({
        cards: [],
        loading: false,
        error: 'エラーが発生しました',
        fetchCards: mockFetchCards,
        refresh: mockRefresh,
      });

      render(<CardList />);

      expect(screen.getByRole('button', { name: /再試行/i })).toBeInTheDocument();
    });

    it('再試行ボタンをクリックするとrefreshが呼ばれる', async () => {
      const user = userEvent.setup();

      vi.spyOn(useCardsHook, 'useCards').mockReturnValue({
        cards: [],
        loading: false,
        error: 'エラーが発生しました',
        fetchCards: mockFetchCards,
        refresh: mockRefresh,
      });

      render(<CardList />);

      const retryButton = screen.getByRole('button', { name: /再試行/i });
      await user.click(retryButton);

      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('空状態', () => {
    it('名刺が0件の時は空メッセージが表示される', () => {
      vi.spyOn(useCardsHook, 'useCards').mockReturnValue({
        cards: [],
        loading: false,
        error: null,
        fetchCards: mockFetchCards,
        refresh: mockRefresh,
      });

      render(<CardList />);

      expect(screen.getByText(/名刺がありません/i)).toBeInTheDocument();
    });
  });

  describe('名刺表示', () => {
    it('名刺が存在する時はCardItemが表示される', () => {
      vi.spyOn(useCardsHook, 'useCards').mockReturnValue({
        cards: mockCards,
        loading: false,
        error: null,
        fetchCards: mockFetchCards,
        refresh: mockRefresh,
      });

      render(<CardList />);

      const cardItems = screen.getAllByTestId('card-item');
      expect(cardItems).toHaveLength(2);
    });

    it('各名刺の名前が表示される', () => {
      vi.spyOn(useCardsHook, 'useCards').mockReturnValue({
        cards: mockCards,
        loading: false,
        error: null,
        fetchCards: mockFetchCards,
        refresh: mockRefresh,
      });

      render(<CardList />);

      expect(screen.getByText('山田 太郎')).toBeInTheDocument();
      expect(screen.getByText('佐藤 花子')).toBeInTheDocument();
    });
  });

  describe('リフレッシュ機能', () => {
    it('リフレッシュボタンが表示される', () => {
      vi.spyOn(useCardsHook, 'useCards').mockReturnValue({
        cards: mockCards,
        loading: false,
        error: null,
        fetchCards: mockFetchCards,
        refresh: mockRefresh,
      });

      render(<CardList />);

      expect(screen.getByRole('button', { name: /更新/i })).toBeInTheDocument();
    });

    it('リフレッシュボタンをクリックするとrefreshが呼ばれる', async () => {
      const user = userEvent.setup();

      vi.spyOn(useCardsHook, 'useCards').mockReturnValue({
        cards: mockCards,
        loading: false,
        error: null,
        fetchCards: mockFetchCards,
        refresh: mockRefresh,
      });

      render(<CardList />);

      const refreshButton = screen.getByRole('button', { name: /更新/i });
      await user.click(refreshButton);

      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('ローディング中はリフレッシュボタンが無効化される', () => {
      vi.spyOn(useCardsHook, 'useCards').mockReturnValue({
        cards: [],
        loading: true,
        error: null,
        fetchCards: mockFetchCards,
        refresh: mockRefresh,
      });

      render(<CardList />);

      const refreshButton = screen.getByRole('button', { name: /更新/i });
      expect(refreshButton).toBeDisabled();
    });
  });
});
