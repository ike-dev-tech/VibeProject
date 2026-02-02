import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { CardDetail } from './CardDetail';
import * as gasService from '../../services/gasService';
import type { BusinessCard } from '../../types';

// gasServiceをモック
vi.mock('../../services/gasService');

// CardFormをモック
vi.mock('./CardForm', () => ({
  CardForm: ({ card, onSave, onCancel }: any) => (
    <div data-testid="card-form">
      <div>編集フォーム: {card.name}</div>
      <button onClick={onSave}>保存</button>
      <button onClick={onCancel}>キャンセル</button>
    </div>
  ),
}));

describe('CardDetail', () => {
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

  const mockOnClose = vi.fn();
  const mockOnUpdate = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('詳細表示', () => {
    it('名前が表示される', () => {
      render(
        <CardDetail
          card={mockCard}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('山田 太郎')).toBeInTheDocument();
    });

    it('会社名が表示される', () => {
      render(
        <CardDetail
          card={mockCard}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('株式会社テスト')).toBeInTheDocument();
    });

    it('全ての連絡先情報が表示される', () => {
      render(
        <CardDetail
          card={mockCard}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(/03-1234-5678/)).toBeInTheDocument();
      expect(screen.getByText(/03-1234-5679/)).toBeInTheDocument();
      expect(screen.getByText(/yamada@test.com/)).toBeInTheDocument();
      expect(screen.getByText(/東京都渋谷区1-2-3/)).toBeInTheDocument();
      expect(screen.getByText(/150-0001/)).toBeInTheDocument();
      expect(screen.getByText(/https:\/\/test.com/)).toBeInTheDocument();
    });

    it('タグが表示される', () => {
      render(
        <CardDetail
          card={mockCard}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('取引先')).toBeInTheDocument();
      expect(screen.getByText('重要')).toBeInTheDocument();
    });

    it('空のフィールドは表示されない', () => {
      const cardWithEmptyFields: BusinessCard = {
        ...mockCard,
        fax: '',
        url: '',
        tags: [],
      };

      const { container } = render(
        <CardDetail
          card={cardWithEmptyFields}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      // FAXとURLのラベルが表示されていないことを確認
      expect(container.textContent).not.toContain('FAX');
    });
  });

  describe('操作ボタン', () => {
    it('閉じるボタンが表示される', () => {
      render(
        <CardDetail
          card={mockCard}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByRole('button', { name: /閉じる|戻る/i })).toBeInTheDocument();
    });

    it('編集ボタンが表示される', () => {
      render(
        <CardDetail
          card={mockCard}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByRole('button', { name: /編集/i })).toBeInTheDocument();
    });

    it('削除ボタンが表示される', () => {
      render(
        <CardDetail
          card={mockCard}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByRole('button', { name: /削除/i })).toBeInTheDocument();
    });

    it('閉じるボタンをクリックするとonCloseが呼ばれる', async () => {
      const user = userEvent.setup();

      render(
        <CardDetail
          card={mockCard}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const closeButton = screen.getByRole('button', { name: /閉じる|戻る/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('編集モード', () => {
    it('編集ボタンをクリックすると編集モードに切り替わる', async () => {
      const user = userEvent.setup();

      render(
        <CardDetail
          card={mockCard}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole('button', { name: /編集/i });
      await user.click(editButton);

      // 編集フォームが表示される
      expect(screen.getByTestId('card-form')).toBeInTheDocument();
    });

    it('編集フォームでキャンセルすると詳細表示に戻る', async () => {
      const user = userEvent.setup();

      render(
        <CardDetail
          card={mockCard}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      // 編集モードに切り替え
      const editButton = screen.getByRole('button', { name: /編集/i });
      await user.click(editButton);

      // キャンセル
      const cancelButton = screen.getByRole('button', { name: /キャンセル/i });
      await user.click(cancelButton);

      // 詳細表示に戻る（編集ボタンが再表示される）
      expect(screen.getByRole('button', { name: /編集/i })).toBeInTheDocument();
    });
  });

  describe('削除機能', () => {
    it('削除ボタンをクリックすると確認ダイアログが表示される', async () => {
      const user = userEvent.setup();

      render(
        <CardDetail
          card={mockCard}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /削除/i });
      await user.click(deleteButton);

      // 確認メッセージが表示される
      expect(screen.getByText(/本当に削除しますか/i)).toBeInTheDocument();
    });

    it('削除確認で「はい」をクリックすると削除処理が実行される', async () => {
      const user = userEvent.setup();

      vi.spyOn(gasService, 'deleteBusinessCard').mockResolvedValue({
        success: true,
        message: '削除しました',
      });

      render(
        <CardDetail
          card={mockCard}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      // 削除ボタンをクリック
      const deleteButton = screen.getByRole('button', { name: /削除/i });
      await user.click(deleteButton);

      // 確認ダイアログで「はい」をクリック
      const confirmButton = screen.getByRole('button', { name: /はい|削除する/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(gasService.deleteBusinessCard).toHaveBeenCalledWith(mockCard.id);
        expect(mockOnDelete).toHaveBeenCalledWith(mockCard.id);
      });
    });

    it('削除確認で「キャンセル」をクリックすると削除がキャンセルされる', async () => {
      const user = userEvent.setup();

      render(
        <CardDetail
          card={mockCard}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      // 削除ボタンをクリック
      const deleteButton = screen.getByRole('button', { name: /削除/i });
      await user.click(deleteButton);

      // 確認ダイアログで「キャンセル」をクリック
      const cancelButtons = screen.getAllByRole('button', { name: /キャンセル/i });
      await user.click(cancelButtons[0]);

      // 削除処理が呼ばれていないことを確認
      expect(gasService.deleteBusinessCard).not.toHaveBeenCalled();
      expect(mockOnDelete).not.toHaveBeenCalled();
    });

    it('削除に失敗した場合はエラーメッセージが表示される', async () => {
      const user = userEvent.setup();

      vi.spyOn(gasService, 'deleteBusinessCard').mockResolvedValue({
        success: false,
        message: '削除に失敗しました',
      });

      render(
        <CardDetail
          card={mockCard}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      // 削除ボタンをクリック
      const deleteButton = screen.getByRole('button', { name: /削除/i });
      await user.click(deleteButton);

      // 確認ダイアログで「はい」をクリック
      const confirmButton = screen.getByRole('button', { name: /はい|削除する/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/削除に失敗しました/i)).toBeInTheDocument();
      });
    });
  });
});
