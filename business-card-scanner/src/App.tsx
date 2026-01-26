import { useState, useCallback } from 'react';
import CameraPreview from './components/camera/CameraPreview';
import ScanResult from './components/result/ScanResult';
import { saveToSpreadsheet } from './services/gasService';
import type { BusinessCard } from './types/businessCard';
import './App.css';

function App() {
  const [scannedCards, setScannedCards] = useState<BusinessCard[]>([]);
  const [isScanEnabled, setIsScanEnabled] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'duplicate'>('idle');

  // 表裏スキャンモード
  const [isDoubleMode, setIsDoubleMode] = useState(false);
  const [pendingFrontCard, setPendingFrontCard] = useState<BusinessCard | null>(null);

  /**
   * 2枚の名刺データを統合
   */
  const mergeCards = useCallback((front: BusinessCard, back: BusinessCard): BusinessCard => {
    return {
      ...front,
      // 裏面にしかない情報を追加
      phone: front.phone || back.phone,
      email: front.email || back.email,
      address: front.address || back.address,
      fax: front.fax || back.fax,
      url: front.url || back.url,
      department: front.department || back.department,
      position: front.position || back.position,
      postalCode: front.postalCode || back.postalCode,
      sns: front.sns || back.sns,
      // 裏面のOCRテキストを保存
      rawTextBack: back.rawText,
    };
  }, []);

  /**
   * 名刺をスプレッドシートに保存
   */
  const saveCard = useCallback(async (card: BusinessCard) => {
    try {
      setSaveStatus('saving');
      const result = await saveToSpreadsheet(card);

      // 重複チェック
      if (result.duplicate) {
        setSaveStatus('duplicate');
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      } else {
        setSaveStatus('saved');
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      }
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }
  }, []);

  /**
   * 名刺がスキャンされた時の処理
   */
  const handleCardScanned = useCallback(async (card: BusinessCard) => {
    console.log('Card scanned:', card);

    // 表裏モードで、まだ表面をスキャンしていない場合
    if (isDoubleMode && !pendingFrontCard) {
      console.log('表面スキャン完了。裏面を待機中...');
      setPendingFrontCard(card);
      // スキャン履歴には追加するが、保存はしない
      setScannedCards(prev => [card, ...prev]);
      return;
    }

    // 表裏モードで、表面スキャン済みの場合（裏面スキャン）
    if (isDoubleMode && pendingFrontCard) {
      console.log('裏面スキャン完了。統合中...');
      const mergedCard = mergeCards(pendingFrontCard, card);

      // スキャン履歴を更新（表面を統合後のカードで置き換え）
      setScannedCards(prev => [mergedCard, ...prev.slice(1)]);

      // 統合したカードを保存
      await saveCard(mergedCard);

      // pending状態をクリア
      setPendingFrontCard(null);
      return;
    }

    // 通常モード（表裏モードOFF）
    setScannedCards(prev => [card, ...prev]);
    await saveCard(card);
  }, [isDoubleMode, pendingFrontCard, mergeCards, saveCard]);

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

  /**
   * 表裏モードの切り替え
   */
  const toggleDoubleMode = () => {
    setIsDoubleMode(prev => !prev);
    // モード切替時はpending状態をクリア
    setPendingFrontCard(null);
  };

  /**
   * 裏面スキャンをスキップ
   */
  const skipBackScan = async () => {
    if (pendingFrontCard) {
      console.log('裏面スキャンをスキップ。表面のみで保存します。');
      await saveCard(pendingFrontCard);
      setPendingFrontCard(null);
    }
  };

  return (
    <div className="app">
      {/* ヘッダー */}
      <header className="app-header">
        <h1>📇 名刺スキャナー</h1>
        <div className="header-controls">
          <button
            onClick={toggleDoubleMode}
            className={`toggle-button ${isDoubleMode ? 'double-mode' : ''}`}
          >
            {isDoubleMode ? '🔄 表裏モード' : '📄 通常モード'}
          </button>
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

          {/* 裏面スキャン待機オーバーレイ */}
          {pendingFrontCard && (
            <div className="back-scan-overlay">
              <div className="back-scan-message">
                <div className="icon">🔄</div>
                <h3>裏面をスキャンしてください</h3>
                <p>名刺の裏面をカメラに向けてください</p>
                <button onClick={skipBackScan} className="skip-button">
                  スキップして保存
                </button>
              </div>
            </div>
          )}

          {/* 保存ステータス */}
          {saveStatus !== 'idle' && (
            <div className={`save-status ${saveStatus}`}>
              {saveStatus === 'saving' && '💾 保存中...'}
              {saveStatus === 'saved' && '✓ 保存完了'}
              {saveStatus === 'duplicate' && '✓ 登録済み'}
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
