import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  const mockOnQueryChange = vi.fn();
  const mockOnClear = vi.fn();

  describe('表示', () => {
    it('検索入力フィールドが表示される', () => {
      render(<SearchBar query="" onQueryChange={mockOnQueryChange} onClear={mockOnClear} />);

      expect(screen.getByPlaceholderText(/検索/i)).toBeInTheDocument();
    });

    it('初期値が設定される', () => {
      render(
        <SearchBar
          query="山田"
          onQueryChange={mockOnQueryChange}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByDisplayValue('山田')).toBeInTheDocument();
    });
  });

  describe('入力', () => {
    it('入力するとonQueryChangeが呼ばれる', async () => {
      const user = userEvent.setup();

      render(<SearchBar query="" onQueryChange={mockOnQueryChange} onClear={mockOnClear} />);

      const input = screen.getByPlaceholderText(/検索/i);
      await user.type(input, 'テスト');

      expect(mockOnQueryChange).toHaveBeenCalled();
    });

    it('入力内容が反映される', async () => {
      const user = userEvent.setup();
      let query = '';

      const { rerender } = render(
        <SearchBar
          query={query}
          onQueryChange={(q) => {
            query = q;
          }}
          onClear={mockOnClear}
        />
      );

      const input = screen.getByPlaceholderText(/検索/i);
      await user.type(input, 'a');

      rerender(
        <SearchBar
          query={query}
          onQueryChange={(q) => {
            query = q;
          }}
          onClear={mockOnClear}
        />
      );

      expect(query).toBe('a');
    });
  });

  describe('クリア機能', () => {
    it('クリアボタンが表示される', () => {
      render(
        <SearchBar
          query="山田"
          onQueryChange={mockOnQueryChange}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByRole('button', { name: /クリア|削除|×/i })).toBeInTheDocument();
    });

    it('検索クエリが空の場合はクリアボタンが表示されない', () => {
      render(<SearchBar query="" onQueryChange={mockOnQueryChange} onClear={mockOnClear} />);

      expect(screen.queryByRole('button', { name: /クリア|削除|×/i })).not.toBeInTheDocument();
    });

    it('クリアボタンをクリックするとonClearが呼ばれる', async () => {
      const user = userEvent.setup();

      render(
        <SearchBar
          query="山田"
          onQueryChange={mockOnQueryChange}
          onClear={mockOnClear}
        />
      );

      const clearButton = screen.getByRole('button', { name: /クリア|削除|×/i });
      await user.click(clearButton);

      expect(mockOnClear).toHaveBeenCalledTimes(1);
    });
  });

  describe('アイコン', () => {
    it('検索アイコンが表示される', () => {
      render(<SearchBar query="" onQueryChange={mockOnQueryChange} onClear={mockOnClear} />);

      // 検索アイコン（🔍）が表示されていることを確認
      expect(screen.getByText('🔍')).toBeInTheDocument();
    });
  });
});
