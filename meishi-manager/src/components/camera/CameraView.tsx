import { useEffect, useRef } from 'react';
import { useCamera } from '../../hooks/useCamera';
import { ScanOverlay } from './ScanOverlay';
import { CaptureButton } from './CaptureButton';

/**
 * カメラビューコンポーネント
 * カメラのプレビュー表示と撮影機能を提供
 */
export function CameraView() {
  const { stream, status, error, startCamera, stopCamera, capture } = useCamera();
  const videoRef = useRef<HTMLVideoElement>(null);

  // マウント時にカメラを起動、アンマウント時に停止
  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // ストリームが変更されたらvideo要素に設定
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.error('Video play error:', err);
      });
    }
  }, [stream]);

  // カメラ起動中
  if (status === 'capturing') {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-black"
        data-testid="camera-preview"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">カメラを起動中...</p>
        </div>
      </div>
    );
  }

  // エラー発生時
  if (status === 'error') {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-black"
        data-testid="camera-preview"
      >
        <div className="text-center px-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-2xl font-bold mb-2">カメラエラー</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => startCamera()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  // カメラプレビュー表示
  return (
    <div
      className="relative w-full h-screen bg-black overflow-hidden"
      data-testid="camera-preview"
    >
      {/* Video要素 */}
      <video
        ref={videoRef}
        data-testid="camera-video"
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* スキャンガイド枠 */}
      {stream && <ScanOverlay />}

      {/* 撮影ボタン */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <CaptureButton
          onCapture={capture}
          disabled={!stream || status !== 'active'}
        />
      </div>
    </div>
  );
}
