import type { BusinessCard } from '../../types';

interface CardItemProps {
  card: BusinessCard;
}

/**
 * 名刺カードコンポーネント
 * 個別の名刺情報を表示する
 */
export function CardItem({ card }: CardItemProps) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* 名前と会社名 */}
      <div className="mb-3">
        <h2 className="text-lg font-bold text-gray-800">{card.name}</h2>
        {card.company && (
          <p className="text-gray-600">{card.company}</p>
        )}
      </div>

      {/* 部署・役職 */}
      {(card.department || card.position) && (
        <div className="mb-2 text-sm text-gray-600">
          {card.department && <span>{card.department}</span>}
          {card.department && card.position && <span> / </span>}
          {card.position && <span>{card.position}</span>}
        </div>
      )}

      {/* 連絡先情報 */}
      <div className="space-y-1 text-sm">
        {card.phone && (
          <div className="flex items-center text-gray-600">
            <span className="mr-2">📞</span>
            <span>{card.phone}</span>
          </div>
        )}
        {card.email && (
          <div className="flex items-center text-gray-600">
            <span className="mr-2">✉️</span>
            <span>{card.email}</span>
          </div>
        )}
      </div>

      {/* タグ */}
      {card.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {card.tags.map((tag, index) => (
            <span
              key={index}
              className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
