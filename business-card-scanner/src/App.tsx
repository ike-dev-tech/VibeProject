import { useState, useCallback } from 'react';
import CameraPreview from './components/camera/CameraPreview';
import ScanResult from './components/result/ScanResult';
import { saveToSpreadsheet } from './services/gasService';
import type { BusinessCard } from './types/businessCard';
import './App.css';

function App() {
  const [scannedCards, setScannedCards] = useState<BusinessCard[]>([]);
  const [isScanEnabled, setIsScanEnabled] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  /**
   * 名刺がスキャンされた時の処理
   */
  const handleCardScanned = useCallback(async (card: BusinessCard) => {
    console.log('Card scanned:', card);

    // スキャン履歴に追加
    setScannedCards(prev => [card, ...prev]);

    // スプレッドシートに保存
    try {
      setSaveStatus('saving');
      await saveToSpreadsheet(card);
      setSaveStatus('saved');

      // 2秒後にステータスをリセット
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');

      // 3秒後にステータスをリセット
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }
  }, []);

  /**
   * スキャン履歴をクリア
   */
  const handleClearHistory = () => {
    if (confirm('スキャン履歴をクリアしますか？')) {
      setScannedCards([]);
    }
  };

  /**
   * スキャンの一時停止/再開
   */
  const toggleScan = () => {
    setIsScanEnabled(prev => !prev);
  };

  return (
    <div className="app">
      {/* ヘッダー */}
      <header className="app-header">
        <h1>📇 名刺スキャナー</h1>
        <div className="header-controls">
          <button
            onClick={toggleScan}
            className={`toggle-button ${isScanEnabled ? 'active' : 'paused'}`}
          >
            {isScanEnabled ? '⏸ 一時停止' : '▶ 再開'}
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="app-main">
        {/* カメラプレビュー */}
        <section className="camera-section">
          <CameraPreview
            onCardScanned={handleCardScanned}
            enabled={isScanEnabled}
          />

          {/* 保存ステータス */}
          {saveStatus !== 'idle' && (
            <div className={`save-status ${saveStatus}`}>
              {saveStatus === 'saving' && '💾 保存中...'}
              {saveStatus === 'saved' && '✓ 保存完了'}
              {saveStatus === 'error' && '✗ 保存失敗'}
            </div>
          )}
        </section>

        {/* スキャン結果 */}
        <section className="results-section">
          <ScanResult
            cards={scannedCards}
            onClear={handleClearHistory}
          />
        </section>
      </main>

      {/* フッター */}
      <footer className="app-footer">
        <p>名刺を枠内に合わせると自動的にスキャンされます</p>
      </footer>
    </div>
  );
}

export default App;
