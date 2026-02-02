import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { OfflineIndicator } from './OfflineIndicator';

describe('OfflineIndicator', () => {
  // オンライン/オフラインイベントをモック
  const setOnline = () => {
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: true,
    });
    window.dispatchEvent(new Event('online'));
  };

  const setOffline = () => {
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: false,
    });
    window.dispatchEvent(new Event('offline'));
  };

  beforeEach(() => {
    // デフォルトはオンライン
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('表示条件', () => {
    it('オンライン時は表示されない', () => {
      render(<OfflineIndicator />);

      expect(screen.queryByText(/オフライン/)).not.toBeInTheDocument();
    });

    it('オフライン時にメッセージが表示される', async () => {
      render(<OfflineIndicator />);

      // オフラインにする
      setOffline();

      await waitFor(() => {
        expect(screen.getByText(/オフラインモード/)).toBeInTheDocument();
      });
    });

    it('オフラインからオンラインに戻ると非表示になる', async () => {
      render(<OfflineIndicator />);

      // オフラインにする
      setOffline();

      await waitFor(() => {
        expect(screen.getByText(/オフラインモード/)).toBeInTheDocument();
      });

      // オンラインに戻す
      setOnline();

      await waitFor(() => {
        expect(screen.queryByText(/オフラインモード/)).not.toBeInTheDocument();
      });
    });
  });

  describe('UI表示', () => {
    it('オフライン時に適切なメッセージとアイコンが表示される', async () => {
      render(<OfflineIndicator />);

      // オフラインにする
      setOffline();

      await waitFor(() => {
        expect(screen.getByText(/オフラインモード/)).toBeInTheDocument();
        expect(screen.getByText(/インターネット接続がありません/)).toBeInTheDocument();
      });
    });

    it('オフライン時にトーストスタイルで表示される', async () => {
      render(<OfflineIndicator />);

      // オフラインにする
      setOffline();

      await waitFor(() => {
        const container = screen.getByTestId('offline-indicator');
        expect(container).toHaveClass('fixed');
        expect(container).toHaveClass('bottom-4');
      });
    });
  });

  describe('初期状態', () => {
    it('初期状態がオフラインの場合、即座にメッセージが表示される', () => {
      // 初期状態をオフラインに設定
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });

      render(<OfflineIndicator />);

      expect(screen.getByText(/オフラインモード/)).toBeInTheDocument();
    });

    it('初期状態がオンラインの場合、メッセージは表示されない', () => {
      // 初期状態をオンラインに設定（デフォルト）
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: true,
      });

      render(<OfflineIndicator />);

      expect(screen.queryByText(/オフラインモード/)).not.toBeInTheDocument();
    });
  });
});
