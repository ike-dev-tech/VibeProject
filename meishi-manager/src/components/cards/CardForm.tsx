import { useState } from 'react';
import type { BusinessCard } from '../../types';
import { updateBusinessCard } from '../../services/gasService';

interface CardFormProps {
  card: BusinessCard;
  onSave: (card: BusinessCard) => void;
  onCancel: () => void;
}

interface ValidationErrors {
  name?: string;
  company?: string;
  email?: string;
}

/**
 * 名刺編集フォームコンポーネント
 * 名刺情報を編集し、バリデーションを行う
 */
export function CardForm({ card, onSave, onCancel }: CardFormProps) {
  const [formData, setFormData] = useState<BusinessCard>(card);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  /**
   * フィールド値を更新
   */
  const handleChange = (field: keyof BusinessCard, value: string | string[]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // エラーをクリア
    if (errors[field as keyof ValidationErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  /**
   * タグを追加（将来の実装用）
   * const handleAddTag = (tag: string) => {
   *   if (tag && !formData.tags.includes(tag)) {
   *     setFormData((prev) => ({
   *       ...prev,
   *       tags: [...prev.tags, tag],
   *     }));
   *   }
   * };
   */

  /**
   * タグを削除
   */
  const handleRemoveTag = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  /**
   * バリデーション
   */
  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};

    // 名前は必須
    if (!formData.name.trim()) {
      newErrors.name = '名前は必須です';
    }

    // 会社名は必須
    if (!formData.company.trim()) {
      newErrors.company = '会社名は必須です';
    }

    // メールアドレスの形式チェック
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'メールアドレスの形式が正しくありません';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 保存処理
   */
  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);

      const result = await updateBusinessCard(formData.id, {
        ...formData,
        updatedAt: new Date().toISOString(),
      });

      if (result.success) {
        onSave({
          ...formData,
          updatedAt: new Date().toISOString(),
        });
      } else {
        setSaveError(result.message);
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">名刺を編集</h1>

        {saveError && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-600">
            {saveError}
          </div>
        )}

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="space-y-4">
            {/* 名前 */}
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                名前 <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full rounded-lg border p-2 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* 名前（カナ） */}
            <div>
              <label htmlFor="nameKana" className="mb-1 block text-sm font-medium text-gray-700">
                名前（カナ）
              </label>
              <input
                id="nameKana"
                type="text"
                value={formData.nameKana}
                onChange={(e) => handleChange('nameKana', e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2"
              />
            </div>

            {/* 会社名 */}
            <div>
              <label htmlFor="company" className="mb-1 block text-sm font-medium text-gray-700">
                会社名 <span className="text-red-500">*</span>
              </label>
              <input
                id="company"
                type="text"
                value={formData.company}
                onChange={(e) => handleChange('company', e.target.value)}
                className={`w-full rounded-lg border p-2 ${
                  errors.company ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.company && (
                <p className="mt-1 text-sm text-red-600">{errors.company}</p>
              )}
            </div>

            {/* 部署 */}
            <div>
              <label htmlFor="department" className="mb-1 block text-sm font-medium text-gray-700">
                部署
              </label>
              <input
                id="department"
                type="text"
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2"
              />
            </div>

            {/* 役職 */}
            <div>
              <label htmlFor="position" className="mb-1 block text-sm font-medium text-gray-700">
                役職
              </label>
              <input
                id="position"
                type="text"
                value={formData.position}
                onChange={(e) => handleChange('position', e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2"
              />
            </div>

            {/* 電話番号 */}
            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
                電話番号
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2"
              />
            </div>

            {/* FAX */}
            <div>
              <label htmlFor="fax" className="mb-1 block text-sm font-medium text-gray-700">
                FAX
              </label>
              <input
                id="fax"
                type="tel"
                value={formData.fax}
                onChange={(e) => handleChange('fax', e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2"
              />
            </div>

            {/* メールアドレス */}
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full rounded-lg border p-2 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* 郵便番号 */}
            <div>
              <label htmlFor="postalCode" className="mb-1 block text-sm font-medium text-gray-700">
                郵便番号
              </label>
              <input
                id="postalCode"
                type="text"
                value={formData.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2"
                placeholder="150-0001"
              />
            </div>

            {/* 住所 */}
            <div>
              <label htmlFor="address" className="mb-1 block text-sm font-medium text-gray-700">
                住所
              </label>
              <textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-gray-300 p-2"
              />
            </div>

            {/* URL */}
            <div>
              <label htmlFor="url" className="mb-1 block text-sm font-medium text-gray-700">
                URL
              </label>
              <input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => handleChange('url', e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2"
                placeholder="https://example.com"
              />
            </div>

            {/* タグ */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                タグ
              </label>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(index)}
                      className="ml-2 text-blue-700 hover:text-blue-900"
                      aria-label={`${tag}を削除`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ボタン */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="rounded-lg bg-gray-200 px-6 py-2 text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="キャンセル"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-lg bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="保存"
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
