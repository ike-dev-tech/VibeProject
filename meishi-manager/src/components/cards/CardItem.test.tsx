import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CardItem } from './CardItem';
import type { BusinessCard } from '../../types';

describe('CardItem', () => {
  const mockCard: BusinessCard = {
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
    rawText: '山田太郎\n株式会社テスト',
    scannedAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  describe('基本表示', () => {
    it('名前が表示される', () => {
      render(<CardItem card={mockCard} />);
      expect(screen.getByText('山田 太郎')).toBeInTheDocument();
    });

    it('会社名が表示される', () => {
      render(<CardItem card={mockCard} />);
      expect(screen.getByText('株式会社テスト')).toBeInTheDocument();
    });

    it('部署名が表示される', () => {
      render(<CardItem card={mockCard} />);
      expect(screen.getByText(/営業部/)).toBeInTheDocument();
    });

    it('役職が表示される', () => {
      render(<CardItem card={mockCard} />);
      expect(screen.getByText(/部長/)).toBeInTheDocument();
    });

    it('電話番号が表示される', () => {
      render(<CardItem card={mockCard} />);
      expect(screen.getByText(/03-1234-5678/)).toBeInTheDocument();
    });

    it('メールアドレスが表示される', () => {
      render(<CardItem card={mockCard} />);
      expect(screen.getByText(/yamada@test.com/)).toBeInTheDocument();
    });
  });

  describe('タグ表示', () => {
    it('タグが表示される', () => {
      render(<CardItem card={mockCard} />);
      expect(screen.getByText('取引先')).toBeInTheDocument();
      expect(screen.getByText('重要')).toBeInTheDocument();
    });

    it('タグが無い場合は表示されない', () => {
      const cardWithoutTags: BusinessCard = {
        ...mockCard,
        tags: [],
      };

      render(<CardItem card={cardWithoutTags} />);

      expect(screen.queryByText('取引先')).not.toBeInTheDocument();
    });
  });

  describe('オプションフィールド', () => {
    it('部署名が空の場合は表示されない', () => {
      const cardWithoutDepartment: BusinessCard = {
        ...mockCard,
        department: '',
      };

      render(<CardItem card={cardWithoutDepartment} />);

      // 部署名のラベルも表示されないことを確認
      expect(screen.queryByText(/営業部/)).not.toBeInTheDocument();
    });

    it('役職が空の場合は表示されない', () => {
      const cardWithoutPosition: BusinessCard = {
        ...mockCard,
        position: '',
      };

      render(<CardItem card={cardWithoutPosition} />);

      expect(screen.queryByText(/部長/)).not.toBeInTheDocument();
    });

    it('電話番号が空の場合は表示されない', () => {
      const cardWithoutPhone: BusinessCard = {
        ...mockCard,
        phone: '',
      };

      render(<CardItem card={cardWithoutPhone} />);

      expect(screen.queryByText(/03-1234-5678/)).not.toBeInTheDocument();
    });

    it('メールアドレスが空の場合は表示されない', () => {
      const cardWithoutEmail: BusinessCard = {
        ...mockCard,
        email: '',
      };

      render(<CardItem card={cardWithoutEmail} />);

      expect(screen.queryByText(/yamada@test.com/)).not.toBeInTheDocument();
    });
  });

  describe('スタイリング', () => {
    it('カードとして適切なクラスが適用されている', () => {
      const { container } = render(<CardItem card={mockCard} />);

      // カードのルート要素を取得
      const cardElement = container.firstChild as HTMLElement;

      // 基本的なカードスタイルが適用されているか確認
      expect(cardElement).toHaveClass('rounded-lg');
      expect(cardElement).toHaveClass('bg-white');
    });
  });
});
