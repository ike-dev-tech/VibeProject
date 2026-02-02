import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { SettingsView } from './SettingsView';

describe('SettingsView', () => {
  beforeEach(() => {
    // localStorageをクリア
    localStorage.clear();
    // 環境変数をモック
    vi.stubEnv('VITE_GOOGLE_CLOUD_VISION_API_KEY', 'test-vision-key');
    vi.stubEnv('VITE_OPENAI_API_KEY', 'test-openai-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('表示', () => {
    it('ページタイトルが表示される', () => {
      render(<SettingsView />);

      expect(screen.getByRole('heading', { level: 1, name: /設定/ })).toBeInTheDocument();
    });

    it('API設定セクションが表示される', () => {
      render(<SettingsView />);

      expect(screen.getByText(/API設定/)).toBeInTheDocument();
    });

    it('スプレッドシート設定セクションが表示される', () => {
      render(<SettingsView />);

      expect(screen.getByText(/スプレッドシート設定/)).toBeInTheDocument();
    });

    it('キャッシュクリアボタンが表示される', () => {
      render(<SettingsView />);

      expect(screen.getByRole('button', { name: /キャッシュをクリア/ })).toBeInTheDocument();
    });
  });

  describe('API設定', () => {
    it('Vision APIキーが設定済みと表示される', () => {
      render(<SettingsView />);

      expect(screen.getByText(/Vision API/)).toBeInTheDocument();
      const settingTexts = screen.getAllByText(/設定済み/);
      expect(settingTexts.length).toBeGreaterThanOrEqual(1);
    });

    it('OpenAI APIキーが設定済みと表示される', () => {
      render(<SettingsView />);

      expect(screen.getByText(/OpenAI API/)).toBeInTheDocument();
      // 設定済みは複数表示されるので、getAllByTextを使用
      const settingTexts = screen.getAllByText(/設定済み/);
      expect(settingTexts.length).toBeGreaterThanOrEqual(2);
    });

    it('APIキーが未設定の場合は未設定と表示される', () => {
      vi.unstubAllEnvs();

      render(<SettingsView />);

      expect(screen.getAllByText(/未設定/).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('スプレッドシート設定', () => {
    it('GAS URLの入力フィールドが表示される', () => {
      render(<SettingsView />);

      expect(screen.getByLabelText(/GAS URL/)).toBeInTheDocument();
    });

    it('localStorageに保存されているURLが表示される', () => {
      const testUrl = 'https://script.google.com/test';
      localStorage.setItem('GAS_URL', testUrl);

      render(<SettingsView />);

      expect(screen.getByDisplayValue(testUrl)).toBeInTheDocument();
    });

    it('URLを変更して保存できる', async () => {
      const user = userEvent.setup();
      const newUrl = 'https://script.google.com/new-url';

      render(<SettingsView />);

      const input = screen.getByLabelText(/GAS URL/);
      await user.clear(input);
      await user.type(input, newUrl);

      const saveButton = screen.getByRole('button', { name: /保存/ });
      await user.click(saveButton);

      await waitFor(() => {
        expect(localStorage.getItem('GAS_URL')).toBe(newUrl);
      });

      // 成功メッセージが表示される
      expect(screen.getByText(/保存しました/)).toBeInTheDocument();
    });

    it('無効なURLの場合はエラーメッセージが表示される', async () => {
      const user = userEvent.setup();
      const invalidUrl = 'invalid-url';

      render(<SettingsView />);

      const input = screen.getByLabelText(/GAS URL/);
      await user.clear(input);
      await user.type(input, invalidUrl);

      const saveButton = screen.getByRole('button', { name: /保存/ });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/正しいURLを入力してください/)).toBeInTheDocument();
      });

      // localStorageには保存されない
      expect(localStorage.getItem('GAS_URL')).not.toBe(invalidUrl);
    });
  });

  describe('キャッシュクリア', () => {
    it('キャッシュクリアボタンをクリックすると確認ダイアログが表示される', async () => {
      const user = userEvent.setup();

      render(<SettingsView />);

      const clearButton = screen.getByRole('button', { name: /キャッシュをクリア/ });
      await user.click(clearButton);

      expect(screen.getByText(/本当にキャッシュをクリアしますか/)).toBeInTheDocument();
    });

    it('確認するとlocalStorageがクリアされる', async () => {
      const user = userEvent.setup();
      localStorage.setItem('test-key', 'test-value');

      render(<SettingsView />);

      const clearButton = screen.getByRole('button', { name: /キャッシュをクリア/ });
      await user.click(clearButton);

      const confirmButton = screen.getByRole('button', { name: /クリアする/ });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(localStorage.getItem('test-key')).toBeNull();
      });

      // 成功メッセージが表示される
      expect(screen.getByText(/キャッシュをクリアしました/)).toBeInTheDocument();
    });

    it('キャンセルするとlocalStorageはクリアされない', async () => {
      const user = userEvent.setup();
      localStorage.setItem('test-key', 'test-value');

      render(<SettingsView />);

      const clearButton = screen.getByRole('button', { name: /キャッシュをクリア/ });
      await user.click(clearButton);

      const cancelButton = screen.getByRole('button', { name: /キャンセル/ });
      await user.click(cancelButton);

      expect(localStorage.getItem('test-key')).toBe('test-value');
    });
  });

  describe('トーストメッセージ', () => {
    it('保存時に成功メッセージが表示される', async () => {
      const user = userEvent.setup();

      render(<SettingsView />);

      const input = screen.getByLabelText(/GAS URL/);
      await user.clear(input);
      await user.type(input, 'https://script.google.com/test');

      const saveButton = screen.getByRole('button', { name: /保存/ });
      await user.click(saveButton);

      // 成功メッセージが表示される
      await waitFor(() => {
        expect(screen.getByText(/保存しました/)).toBeInTheDocument();
      });
    });
  });
});
