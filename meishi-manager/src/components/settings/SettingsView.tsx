import { useState, useEffect } from 'react';

/**
 * 設定画面コンポーネント
 * API設定の確認、スプレッドシートURL設定、キャッシュクリアを提供
 */
export function SettingsView() {
  const [gasUrl, setGasUrl] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [urlError, setUrlError] = useState('');

  // 環境変数からAPI設定を確認
  const visionApiKey = import.meta.env.VITE_GOOGLE_CLOUD_VISION_API_KEY;
  const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

  /**
   * マウント時にlocalStorageからGAS URLを読み込み
   */
  useEffect(() => {
    const savedUrl = localStorage.getItem('GAS_URL');
    if (savedUrl) {
      setGasUrl(savedUrl);
    }
  }, []);

  /**
   * トーストメッセージを表示（3秒後に自動消去）
   */
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [toast]);

  /**
   * URLのバリデーション
   */
  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  /**
   * GAS URLを保存
   */
  const handleSaveGasUrl = () => {
    setUrlError('');

    if (!gasUrl.trim()) {
      setUrlError('URLを入力してください');
      return;
    }

    if (!validateUrl(gasUrl)) {
      setUrlError('正しいURLを入力してください');
      return;
    }

    localStorage.setItem('GAS_URL', gasUrl);
    setToast({ message: '保存しました', type: 'success' });
  };

  /**
   * キャッシュクリア
   */
  const handleClearCache = () => {
    localStorage.clear();
    setShowClearConfirm(false);
    setToast({ message: 'キャッシュをクリアしました', type: 'success' });
    setGasUrl('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* ヘッダー */}
      <h1 className="mb-6 text-2xl font-bold text-gray-800">⚙️ 設定</h1>

      <div className="space-y-6">
        {/* API設定セクション */}
        <section className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">API設定</h2>

          <div className="space-y-3">
            {/* Vision API */}
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Vision API</span>
              <span
                className={`rounded-full px-3 py-1 text-sm ${
                  visionApiKey
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {visionApiKey ? '設定済み' : '未設定'}
              </span>
            </div>

            {/* OpenAI API */}
            <div className="flex items-center justify-between">
              <span className="text-gray-700">OpenAI API</span>
              <span
                className={`rounded-full px-3 py-1 text-sm ${
                  openaiApiKey
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {openaiApiKey ? '設定済み' : '未設定'}
              </span>
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            ※ API キーは環境変数（.env.local）で設定してください
          </p>
        </section>

        {/* スプレッドシート設定セクション */}
        <section className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">スプレッドシート設定</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="gas-url" className="mb-2 block text-sm font-medium text-gray-700">
                GAS URL
              </label>
              <input
                id="gas-url"
                type="text"
                value={gasUrl}
                onChange={(e) => {
                  setGasUrl(e.target.value);
                  setUrlError('');
                }}
                placeholder="https://script.google.com/..."
                className={`w-full rounded-lg border ${
                  urlError ? 'border-red-500' : 'border-gray-300'
                } px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              />
              {urlError && <p className="mt-1 text-sm text-red-600">{urlError}</p>}
            </div>

            <button
              onClick={handleSaveGasUrl}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              保存
            </button>
          </div>
        </section>

        {/* キャッシュクリアセクション */}
        <section className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">キャッシュ</h2>

          <p className="mb-4 text-sm text-gray-600">
            ローカルストレージに保存されているデータをすべて削除します。
          </p>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-full rounded-lg border border-red-600 bg-white px-4 py-2 text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            キャッシュをクリア
          </button>
        </section>
      </div>

      {/* 確認ダイアログ */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">確認</h3>
            <p className="mb-6 text-gray-600">
              本当にキャッシュをクリアしますか？この操作は取り消せません。
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                キャンセル
              </button>
              <button
                onClick={handleClearCache}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                クリアする
              </button>
            </div>
          </div>
        </div>
      )}

      {/* トーストメッセージ */}
      {toast && (
        <div
          className={`fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transform rounded-lg px-6 py-3 shadow-lg ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
