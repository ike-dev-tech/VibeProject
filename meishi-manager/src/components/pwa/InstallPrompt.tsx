import { useState, useEffect } from 'react';

/**
 * PWAインストールプロンプトコンポーネント
 * ホーム画面への追加を促すUI
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  /**
   * beforeinstallpromptイベントをリッスン
   * PWAがインストール可能になったときに発火
   */
  useEffect(() => {
    // 以前に閉じられていたら表示しない
    const dismissed = localStorage.getItem('installPromptDismissed');
    if (dismissed === 'true') {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // デフォルトのミニインフォバーを防止
      e.preventDefault();
      // イベントを保存（後で使用）
      setDeferredPrompt(e);
      // プロンプトを表示
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  /**
   * インストールボタンクリック時
   */
  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    // インストールプロンプトを表示
    deferredPrompt.prompt();

    // ユーザーの選択を待つ
    const { outcome } = await deferredPrompt.userChoice;

    // プロンプトを使用したのでクリア
    setDeferredPrompt(null);
    setShowPrompt(false);

    // 結果に関わらず、プロンプトを非表示
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
  };

  /**
   * 後でボタンクリック時
   */
  const handleDismiss = () => {
    // localStorageに記録
    localStorage.setItem('installPromptDismissed', 'true');
    setShowPrompt(false);
  };

  // プロンプトを表示しない場合は何も表示しない
  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 px-4">
      <div className="mx-auto max-w-md rounded-lg bg-white p-4 shadow-lg">
        <div className="mb-3">
          <h3 className="mb-1 text-lg font-semibold text-gray-800">
            📱 ホーム画面に追加
          </h3>
          <p className="text-sm text-gray-600">
            このアプリをホーム画面に追加して、オフラインでも使用できます。
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDismiss}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            後で
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            インストール
          </button>
        </div>
      </div>
    </div>
  );
}
