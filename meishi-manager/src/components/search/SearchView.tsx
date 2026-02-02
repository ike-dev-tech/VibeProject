import { useMemo, useState } from 'react';
import { useCards } from '../../hooks/useCards';
import { useSearch } from '../../hooks/useSearch';
import { SearchBar } from './SearchBar';
import { CardItem } from '../cards/CardItem';

/**
 * 検索画面コンポーネント
 * 検索バーとタグフィルターで名刺を検索・表示する
 */
export function SearchView() {
  const { cards, loading, error } = useCards();
  const { filteredCards, query, setQuery, setSelectedTags } = useSearch(cards);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  /**
   * 全ての一意なタグを取得
   */
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    cards.forEach((card) => {
      card.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [cards]);

  /**
   * 検索クエリをクリア
   */
  const handleClear = () => {
    setQuery('');
  };

  /**
   * タグをトグル
   */
  const handleTagClick = (tag: string) => {
    if (activeTag === tag) {
      // 既に選択されている場合は解除
      setActiveTag(null);
      setSelectedTags([]);
    } else {
      // 新しいタグを選択
      setActiveTag(tag);
      setSelectedTags([tag]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* ヘッダー */}
      <h1 className="mb-4 text-2xl font-bold text-gray-800">検索</h1>

      {/* 検索バー */}
      <div className="mb-4">
        <SearchBar query={query} onQueryChange={setQuery} onClear={handleClear} />
      </div>

      {/* タグフィルター */}
      {allTags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`rounded-full px-3 py-1 text-sm transition-colors ${
                  activeTag === tag
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-blue-700 hover:bg-blue-50'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ローディング状態 */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-2 text-lg text-gray-600">読み込み中...</div>
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
        </div>
      )}

      {/* エラー状態 */}
      {!loading && error && (
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 検索結果 */}
      {!loading && !error && (
        <>
          {/* 検索結果件数 */}
          <div className="mb-3 text-sm text-gray-600">
            {filteredCards.length}件の名刺
          </div>

          {/* 名刺一覧 */}
          {filteredCards.length > 0 ? (
            <div className="space-y-3">
              {filteredCards.map((card) => (
                <CardItem key={card.id} card={card} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-white p-12 text-center shadow-sm">
              <p className="text-gray-500">該当する名刺が見つかりませんでした</p>
              {query && (
                <button
                  onClick={handleClear}
                  className="mt-4 text-blue-600 hover:text-blue-700"
                >
                  検索をクリア
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
