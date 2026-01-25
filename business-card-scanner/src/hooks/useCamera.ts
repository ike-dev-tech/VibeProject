import { useState, useEffect, useRef } from 'react';

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  isReady: boolean;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
}

/**
 * カメラ管理カスタムフック
 */
export const useCamera = (): UseCameraReturn => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * カメラを起動
   */
  const startCamera = async () => {
    try {
      setError(null);
      setIsReady(false);

      // カメラ設定（背面カメラを優先）
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' }, // 背面カメラを優先
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      // メディアストリームを取得
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      // ビデオ要素に設定
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;

        // メタデータが読み込まれたら再生を開始
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setIsReady(true);
          }).catch((err) => {
            console.error('Video play error:', err);
            setError('ビデオの再生に失敗しました');
          });
        };
      }
    } catch (err) {
      console.error('Camera access error:', err);

      // エラーメッセージを設定
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('カメラへのアクセスが拒否されました。ブラウザの設定を確認してください。');
        } else if (err.name === 'NotFoundError') {
          setError('カメラが見つかりませんでした。');
        } else if (err.name === 'NotReadableError') {
          setError('カメラが他のアプリケーションで使用中です。');
        } else {
          setError(`カメラエラー: ${err.message}`);
        }
      } else {
        setError('カメラの起動に失敗しました。');
      }
    }
  };

  /**
   * カメラを停止
   */
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsReady(false);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // クリーンアップ
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return {
    videoRef,
    stream,
    isReady,
    error,
    startCamera,
    stopCamera,
  };
};
