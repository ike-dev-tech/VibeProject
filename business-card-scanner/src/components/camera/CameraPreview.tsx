import React, { useEffect } from 'react';
import { useCamera } from '../../hooks/useCamera';
import { useBusinessCardDetector } from '../../hooks/useBusinessCardDetector';
import ScanOverlay from './ScanOverlay';
import type { BusinessCard } from '../../types/businessCard';

interface CameraPreviewProps {
  onCardScanned: (card: BusinessCard) => void;
  enabled: boolean;
}

/**
 * カメラプレビューコンポーネント
 */
const CameraPreview: React.FC<CameraPreviewProps> = ({ onCardScanned, enabled }) => {
  const { videoRef, isReady, error: cameraError, startCamera, stopCamera } = useCamera();
  const { status, currentCard, error: scanError, scanCount } = useBusinessCardDetector({
    videoRef,
    isReady,
    enabled,
  });

  // カメラを起動
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // スキャン完了時の処理
  useEffect(() => {
    if (currentCard && status === 'success') {
      onCardScanned(currentCard);
    }
  }, [currentCard, status, onCardScanned]);

  // エラー表示
  const displayError = cameraError || scanError;

  return (
    <div className="camera-preview-container">
      <div className="camera-wrapper">
        <video
          ref={videoRef}
          className="camera-video"
          autoPlay
          playsInline
          muted
        />

        <ScanOverlay status={status} />

        {/* ステータス表示 */}
        <div className="status-overlay">
          {!isReady && !displayError && (
            <div className="status-message loading">
              カメラを起動中...
            </div>
          )}

          {displayError && (
            <div className="status-message error">
              {displayError}
            </div>
          )}

          {isReady && !enabled && (
            <div className="status-message warning">
              スキャン一時停止中
            </div>
          )}

          {status === 'detecting' && (
            <div className="status-message detecting">
              名刺を検出中...
            </div>
          )}

          {status === 'processing' && (
            <div className="status-message processing">
              読み取り中...
            </div>
          )}

          {status === 'success' && (
            <div className="status-message success">
              ✓ スキャン完了！
            </div>
          )}
        </div>

        {/* スキャンカウンター */}
        {scanCount > 0 && (
          <div className="scan-counter">
            スキャン済み: {scanCount}枚
          </div>
        )}

        {/* 使い方ガイド */}
        {isReady && status === 'idle' && (
          <div className="guide-message">
            名刺を枠内に合わせてください
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraPreview;
