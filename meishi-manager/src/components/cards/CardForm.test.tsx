import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { CardForm } from './CardForm';
import * as gasService from '../../services/gasService';
import type { BusinessCard } from '../../types';

// gasServiceをモック
vi.mock('../../services/gasService');

describe('CardForm', () => {
  const mockCard: BusinessCard = {
    id: '1',
    name: '山田 太郎',
    nameKana: 'ヤマダ タロウ',
    company: '株式会社テスト',
    department: '営業部',
    position: '部長',
    phone: '03-1234-5678',
    fax: '03-1234-5679',
    email: 'yamada@test.com',
    address: '東京都渋谷区1-2-3',
    postalCode: '150-0001',
    url: 'https://test.com',
    tags: ['取引先', '重要'],
    rawText: '山田太郎\n株式会社テスト',
    scannedAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('フォーム表示', () => {
    it('全ての入力フィールドが表示される', () => {
      render(<CardForm card={mockCard} onSave={mockOnSave} onCancel={mockOnCancel} />);

      expect(screen.getByLabelText('名前 *')).toBeInTheDocument();
      expect(screen.getByLabelText('会社名 *')).toBeInTheDocument();
      expect(screen.getByLabelText('部署')).toBeInTheDocument();
      expect(screen.getByLabelText('役職')).toBeInTheDocument();
      expect(screen.getByLabelText('電話番号')).toBeInTheDocument();
      expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
    });

    it('既存の値が入力フィールドに表示される', () => {
      render(<CardForm card={mockCard} onSave={mockOnSave} onCancel={mockOnCancel} />);

      expect(screen.getByDisplayValue('山田 太郎')).toBeInTheDocument();
      expect(screen.getByDisplayValue('株式会社テスト')).toBeInTheDocument();
      expect(screen.getByDisplayValue('営業部')).toBeInTheDocument();
      expect(screen.getByDisplayValue('部長')).toBeInTheDocument();
    });

    it('保存ボタンとキャンセルボタンが表示される', () => {
      render(<CardForm card={mockCard} onSave={mockOnSave} onCancel={mockOnCancel} />);

      expect(screen.getByRole('button', { name: /保存/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /キャンセル/i })).toBeInTheDocument();
    });
  });

  describe('入力操作', () => {
    it('フィールドの値を変更できる', async () => {
      const user = userEvent.setup();

      render(<CardForm card={mockCard} onSave={mockOnSave} onCancel={mockOnCancel} />);

      const nameInput = screen.getByDisplayValue('山田 太郎');
      await user.clear(nameInput);
      await user.type(nameInput, '佐藤 花子');

      expect(screen.getByDisplayValue('佐藤 花子')).toBeInTheDocument();
    });
  });

  describe('バリデーション', () => {
    it('名前が空の場合は保存できない', async () => {
      const user = userEvent.setup();

      render(<CardForm card={mockCard} onSave={mockOnSave} onCancel={mockOnCancel} />);

      const nameInput = screen.getByDisplayValue('山田 太郎');
      await user.clear(nameInput);

      const saveButton = screen.getByRole('button', { name: /保存/i });
      await user.click(saveButton);

      expect(screen.getByText(/名前は必須です/i)).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('会社名が空の場合は保存できない', async () => {
      const user = userEvent.setup();

      render(<CardForm card={mockCard} onSave={mockOnSave} onCancel={mockOnCancel} />);

      const companyInput = screen.getByDisplayValue('株式会社テスト');
      await user.clear(companyInput);

      const saveButton = screen.getByRole('button', { name: /保存/i });
      await user.click(saveButton);

      expect(screen.getByText(/会社名は必須です/i)).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('メールアドレスの形式が不正な場合はエラーメッセージが表示される', async () => {
      const user = userEvent.setup();

      render(<CardForm card={mockCard} onSave={mockOnSave} onCancel={mockOnCancel} />);

      const emailInput = screen.getByDisplayValue('yamada@test.com');
      await user.clear(emailInput);
      await user.type(emailInput, 'invalid-email');

      const saveButton = screen.getByRole('button', { name: /保存/i });
      await user.click(saveButton);

      expect(screen.getByText(/メールアドレスの形式が正しくありません/i)).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('保存機能', () => {
    it('有効なデータで保存ボタンをクリックすると更新処理が実行される', async () => {
      const user = userEvent.setup();

      vi.spyOn(gasService, 'updateBusinessCard').mockResolvedValue({
        success: true,
        message: '更新しました',
      });

      render(<CardForm card={mockCard} onSave={mockOnSave} onCancel={mockOnCancel} />);

      const nameInput = screen.getByDisplayValue('山田 太郎');
      await user.clear(nameInput);
      await user.type(nameInput, '佐藤 花子');

      const saveButton = screen.getByRole('button', { name: /保存/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(gasService.updateBusinessCard).toHaveBeenCalled();
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('保存に失敗した場合はエラーメッセージが表示される', async () => {
      const user = userEvent.setup();

      vi.spyOn(gasService, 'updateBusinessCard').mockResolvedValue({
        success: false,
        message: '更新に失敗しました',
      });

      render(<CardForm card={mockCard} onSave={mockOnSave} onCancel={mockOnCancel} />);

      const saveButton = screen.getByRole('button', { name: /保存/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/更新に失敗しました/i)).toBeInTheDocument();
      });
    });

    it('保存中は保存ボタンが無効化される', async () => {
      const user = userEvent.setup();

      let resolveUpdate: (value: any) => void;
      const updatePromise = new Promise((resolve) => {
        resolveUpdate = resolve;
      });

      vi.spyOn(gasService, 'updateBusinessCard').mockReturnValue(updatePromise as any);

      render(<CardForm card={mockCard} onSave={mockOnSave} onCancel={mockOnCancel} />);

      const saveButton = screen.getByRole('button', { name: /保存/i });
      await user.click(saveButton);

      // 保存中はボタンが無効化される
      expect(saveButton).toBeDisabled();

      // プロミスを解決
      resolveUpdate!({ success: true, message: '更新しました' });

      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });
    });
  });

  describe('タグ操作', () => {
    it('既存のタグが表示される', () => {
      render(<CardForm card={mockCard} onSave={mockOnSave} onCancel={mockOnCancel} />);

      expect(screen.getByText('取引先')).toBeInTheDocument();
      expect(screen.getByText('重要')).toBeInTheDocument();
    });

    it('タグの削除ボタンが表示される', () => {
      render(<CardForm card={mockCard} onSave={mockOnSave} onCancel={mockOnCancel} />);

      const deleteButtons = screen.getAllByRole('button', { name: /を削除/i });
      expect(deleteButtons.length).toBe(2); // 2つのタグ
    });

    it('タグの削除ボタンをクリックするとタグが削除される', async () => {
      const user = userEvent.setup();

      render(<CardForm card={mockCard} onSave={mockOnSave} onCancel={mockOnCancel} />);

      expect(screen.getByText('取引先')).toBeInTheDocument();
      expect(screen.getByText('重要')).toBeInTheDocument();

      // 「取引先」タグを削除
      const deleteButton = screen.getByRole('button', { name: /取引先を削除/i });
      await user.click(deleteButton);

      // 削除されたタグは表示されない
      expect(screen.queryByText('取引先')).not.toBeInTheDocument();
      // 他のタグは残っている
      expect(screen.getByText('重要')).toBeInTheDocument();
    });

    it('全てのタグを削除できる', async () => {
      const user = userEvent.setup();

      render(<CardForm card={mockCard} onSave={mockOnSave} onCancel={mockOnCancel} />);

      // 「取引先」タグを削除
      const deleteButton1 = screen.getByRole('button', { name: /取引先を削除/i });
      await user.click(deleteButton1);

      // 「重要」タグを削除
      const deleteButton2 = screen.getByRole('button', { name: /重要を削除/i });
      await user.click(deleteButton2);

      // 全てのタグが削除された
      expect(screen.queryByText('取引先')).not.toBeInTheDocument();
      expect(screen.queryByText('重要')).not.toBeInTheDocument();
    });
  });

  describe('キャンセル機能', () => {
    it('キャンセルボタンをクリックするとonCancelが呼ばれる', async () => {
      const user = userEvent.setup();

      render(<CardForm card={mockCard} onSave={mockOnSave} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: /キャンセル/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('キャンセル時は更新処理が実行されない', async () => {
      const user = userEvent.setup();

      render(<CardForm card={mockCard} onSave={mockOnSave} onCancel={mockOnCancel} />);

      const nameInput = screen.getByDisplayValue('山田 太郎');
      await user.clear(nameInput);
      await user.type(nameInput, '佐藤 花子');

      const cancelButton = screen.getByRole('button', { name: /キャンセル/i });
      await user.click(cancelButton);

      expect(gasService.updateBusinessCard).not.toHaveBeenCalled();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('保存中はキャンセルボタンが無効化される', async () => {
      const user = userEvent.setup();

      let resolveUpdate: (value: any) => void;
      const updatePromise = new Promise((resolve) => {
        resolveUpdate = resolve;
      });

      vi.spyOn(gasService, 'updateBusinessCard').mockReturnValue(updatePromise as any);

      render(<CardForm card={mockCard} onSave={mockOnSave} onCancel={mockOnCancel} />);

      const saveButton = screen.getByRole('button', { name: /保存/i });
      await user.click(saveButton);

      // 保存中はキャンセルボタンも無効化される
      const cancelButton = screen.getByRole('button', { name: /キャンセル/i });
      expect(cancelButton).toBeDisabled();

      // プロミスを解決
      resolveUpdate!({ success: true, message: '更新しました' });

      await waitFor(() => {
        expect(cancelButton).not.toBeDisabled();
      });
    });
  });
});
