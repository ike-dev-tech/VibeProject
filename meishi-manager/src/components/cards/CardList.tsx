import { useCards } from '../../hooks/useCards';
import { CardItem } from './CardItem';

/**
 * 名刺一覧コンポーネント
 * useCardsフックを使って名刺一覧を取得・表示する
 */
export function CardList() {
  const { cards, loading, error, refresh } = useCards();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* ヘッダー */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">名刺一覧</h1>
        <button
          onClick={refresh}
          disabled={loading}
          className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          aria-label="更新"
        >
          更新
        </button>
      </div>

      {/* ローディング状態 */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-2 text-lg text-gray-600">読み込み中...</div>
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
          </div>
        </div>
      )}

      {/* エラー状態 */}
      {!loading && error && (
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <p className="mb-4 text-red-600">{error}</p>
          <button
            onClick={refresh}
            className="rounded-lg bg-red-500 px-6 py-2 text-white hover:bg-red-600"
            aria-label="再試行"
          >
            再試行
          </button>
        </div>
      )}

      {/* 空状態 */}
      {!loading && !error && cards.length === 0 && (
        <div className="rounded-lg bg-white p-12 text-center shadow-sm">
          <p className="text-gray-500">名刺がありません</p>
          <p className="mt-2 text-sm text-gray-400">
            カメラボタンから名刺をスキャンしてください
          </p>
        </div>
      )}

      {/* 名刺一覧 */}
      {!loading && !error && cards.length > 0 && (
        <div className="space-y-3">
          {cards.map((card) => (
            <CardItem key={card.id} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}
