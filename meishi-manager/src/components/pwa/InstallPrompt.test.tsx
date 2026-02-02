import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { InstallPrompt } from './InstallPrompt';

describe('InstallPrompt', () => {
  let deferredPrompt: any;

  beforeEach(() => {
    // beforeinstallpromptイベントの準備
    deferredPrompt = {
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    };

    // localStorageをクリア
    localStorage.clear();
  });

  /**
   * beforeinstallpromptイベントを作成してdispatchするヘルパー
   */
  const dispatchBeforeInstallPrompt = () => {
    const event = new CustomEvent('beforeinstallprompt', {
      cancelable: true,
    });
    // deferredPromptのプロパティを追加
    Object.assign(event, deferredPrompt);
    window.dispatchEvent(event);
  };

  describe('表示条件', () => {
    it('beforeinstallpromptイベントが発火するまで表示されない', () => {
      render(<InstallPrompt />);

      expect(screen.queryByRole('heading', { name: /ホーム画面に追加/ })).not.toBeInTheDocument();
    });

    it('beforeinstallpromptイベント後に表示される', async () => {
      render(<InstallPrompt />);

      // beforeinstallpromptイベントを発火
      dispatchBeforeInstallPrompt();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /ホーム画面に追加/ })).toBeInTheDocument();
      });
    });

    it('一度閉じたら再表示しない（localStorage使用）', async () => {
      const user = userEvent.setup();

      render(<InstallPrompt />);

      // beforeinstallpromptイベントを発火
      dispatchBeforeInstallPrompt();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /ホーム画面に追加/ })).toBeInTheDocument();
      });

      // 閉じるボタンをクリック
      const closeButton = screen.getByRole('button', { name: /後で/i });
      await user.click(closeButton);

      expect(screen.queryByRole('heading', { name: /ホーム画面に追加/ })).not.toBeInTheDocument();
      expect(localStorage.getItem('installPromptDismissed')).toBe('true');
    });

    it('以前に閉じた場合は表示しない', () => {
      localStorage.setItem('installPromptDismissed', 'true');

      render(<InstallPrompt />);

      // beforeinstallpromptイベントを発火
      dispatchBeforeInstallPrompt();

      // 即座に確認（表示されないはず）
      expect(screen.queryByRole('heading', { name: /ホーム画面に追加/ })).not.toBeInTheDocument();
    });
  });

  describe('インストール操作', () => {
    it('インストールボタンをクリックするとプロンプトが表示される', async () => {
      const user = userEvent.setup();

      render(<InstallPrompt />);

      // beforeinstallpromptイベントを発火
      dispatchBeforeInstallPrompt();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /ホーム画面に追加/ })).toBeInTheDocument();
      });

      // インストールボタンをクリック
      const installButton = screen.getByRole('button', { name: /インストール/i });
      await user.click(installButton);

      expect(deferredPrompt.prompt).toHaveBeenCalled();
    });

    it('ユーザーがインストールを受け入れたらプロンプトを非表示にする', async () => {
      const user = userEvent.setup();
      deferredPrompt.userChoice = Promise.resolve({ outcome: 'accepted' });

      render(<InstallPrompt />);

      // beforeinstallpromptイベントを発火
      dispatchBeforeInstallPrompt();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /ホーム画面に追加/ })).toBeInTheDocument();
      });

      // インストールボタンをクリック
      const installButton = screen.getByRole('button', { name: /インストール/i });
      await user.click(installButton);

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /ホーム画面に追加/ })).not.toBeInTheDocument();
      });
    });

    it('ユーザーがインストールを拒否してもプロンプトを非表示にする', async () => {
      const user = userEvent.setup();
      deferredPrompt.userChoice = Promise.resolve({ outcome: 'dismissed' });

      render(<InstallPrompt />);

      // beforeinstallpromptイベントを発火
      dispatchBeforeInstallPrompt();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /ホーム画面に追加/ })).toBeInTheDocument();
      });

      // インストールボタンをクリック
      const installButton = screen.getByRole('button', { name: /インストール/i });
      await user.click(installButton);

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /ホーム画面に追加/ })).not.toBeInTheDocument();
      });
    });
  });

  describe('UI表示', () => {
    it('プロンプトには説明文が表示される', async () => {
      render(<InstallPrompt />);

      // beforeinstallpromptイベントを発火
      dispatchBeforeInstallPrompt();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /ホーム画面に追加/ })).toBeInTheDocument();
      });

      expect(screen.getByText(/オフラインでも使用できます/)).toBeInTheDocument();
    });

    it('インストールボタンと後でボタンが表示される', async () => {
      render(<InstallPrompt />);

      // beforeinstallpromptイベントを発火
      dispatchBeforeInstallPrompt();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /インストール/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /後で/i })).toBeInTheDocument();
      });
    });
  });
});
