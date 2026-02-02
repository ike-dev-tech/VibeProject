interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onClear: () => void;
}

/**
 * 検索バーコンポーネント
 * 名刺を検索するための入力フィールド
 */
export function SearchBar({ query, onQueryChange, onClear }: SearchBarProps) {
  return (
    <div className="relative">
      {/* 検索アイコン */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <span className="text-gray-400">🔍</span>
      </div>

      {/* 検索入力 */}
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="名前、会社名、役職などで検索..."
        className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      {/* クリアボタン */}
      {query && (
        <button
          onClick={onClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          aria-label="クリア"
        >
          ×
        </button>
      )}
    </div>
  );
}
