import { useState } from 'react';
import type { BusinessCard } from '../../types';
import { CardForm } from './CardForm';
import { deleteBusinessCard } from '../../services/gasService';

interface CardDetailProps {
  card: BusinessCard;
  onClose: () => void;
  onUpdate: (card: BusinessCard) => void;
  onDelete: (id: string) => void;
}

/**
 * 名刺詳細コンポーネント
 * 名刺の詳細情報を表示し、編集・削除機能を提供する
 */
export function CardDetail({ card, onClose, onUpdate, onDelete }: CardDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /**
   * 編集モードに切り替え
   */
  const handleEdit = () => {
    setIsEditing(true);
  };

  /**
   * 編集をキャンセル
   */
  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  /**
   * 編集を保存
   */
  const handleSave = (updatedCard: BusinessCard) => {
    setIsEditing(false);
    onUpdate(updatedCard);
  };

  /**
   * 削除確認ダイアログを表示
   */
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
    setDeleteError(null);
  };

  /**
   * 削除確認をキャンセル
   */
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteError(null);
  };

  /**
   * 削除を実行
   */
  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      setDeleteError(null);

      const result = await deleteBusinessCard(card.id);

      if (result.success) {
        onDelete(card.id);
      } else {
        setDeleteError(result.message);
      }
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : '削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  // 編集モード表示
  if (isEditing) {
    return (
      <CardForm
        card={card}
        onSave={handleSave}
        onCancel={handleCancelEdit}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* ヘッダー */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onClose}
          className="text-blue-600 hover:text-blue-700"
          aria-label="戻る"
        >
          ← 戻る
        </button>
        <div className="space-x-2">
          <button
            onClick={handleEdit}
            className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            aria-label="編集"
          >
            編集
          </button>
          <button
            onClick={handleDeleteClick}
            className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
            aria-label="削除"
          >
            削除
          </button>
        </div>
      </div>

      {/* 詳細情報 */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        {/* 名前・会社 */}
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-bold text-gray-800">{card.name}</h1>
          {card.nameKana && (
            <p className="mb-2 text-sm text-gray-500">{card.nameKana}</p>
          )}
          {card.company && (
            <p className="text-lg text-gray-700">{card.company}</p>
          )}
        </div>

        {/* 部署・役職 */}
        {(card.department || card.position) && (
          <div className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-gray-600">部署・役職</h2>
            <p className="text-gray-700">
              {card.department && <span>{card.department}</span>}
              {card.department && card.position && <span> / </span>}
              {card.position && <span>{card.position}</span>}
            </p>
          </div>
        )}

        {/* 連絡先 */}
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-gray-600">連絡先</h2>
          <div className="space-y-2">
            {card.phone && (
              <div className="flex items-center text-gray-700">
                <span className="mr-2">📞</span>
                <span>{card.phone}</span>
              </div>
            )}
            {card.fax && (
              <div className="flex items-center text-gray-700">
                <span className="mr-2">📠</span>
                <span>FAX: {card.fax}</span>
              </div>
            )}
            {card.email && (
              <div className="flex items-center text-gray-700">
                <span className="mr-2">✉️</span>
                <span>{card.email}</span>
              </div>
            )}
            {card.url && (
              <div className="flex items-center text-gray-700">
                <span className="mr-2">🌐</span>
                <a
                  href={card.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {card.url}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* 住所 */}
        {(card.postalCode || card.address) && (
          <div className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-gray-600">住所</h2>
            <div className="text-gray-700">
              {card.postalCode && <p>〒{card.postalCode}</p>}
              {card.address && <p>{card.address}</p>}
            </div>
          </div>
        )}

        {/* タグ */}
        {card.tags.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-gray-600">タグ</h2>
            <div className="flex flex-wrap gap-2">
              {card.tags.map((tag, index) => (
                <span
                  key={index}
                  className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* スキャン日時 */}
        <div className="border-t pt-4 text-sm text-gray-500">
          <p>スキャン日時: {new Date(card.scannedAt).toLocaleString('ja-JP')}</p>
          <p>更新日時: {new Date(card.updatedAt).toLocaleString('ja-JP')}</p>
        </div>
      </div>

      {/* 削除確認ダイアログ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold text-gray-800">削除の確認</h2>
            <p className="mb-6 text-gray-600">
              本当に削除しますか？この操作は取り消せません。
            </p>

            {deleteError && (
              <div className="mb-4 rounded bg-red-50 p-3 text-red-600">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="キャンセル"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="削除する"
              >
                {isDeleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
