import { useState, useEffect } from 'react';
import type { CameraStatus } from '../types';

interface UseCameraReturn {
  stream: MediaStream | null;
  status: CameraStatus;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  capture: () => Promise<Blob>;
}

/**
 * カメラ機能を提供するカスタムフック
 */
export function useCamera(): UseCameraReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  /**
   * カメラを起動する
   */
  const startCamera = async () => {
    // 既に起動している場合は何もしない
    if (stream) {
      return;
    }

    try {
      setStatus('capturing');
      setError(null);

      // カメラストリームを取得
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // 背面カメラを優先
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      setStatus('active');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'カメラの起動に失敗しました';
      setError(errorMessage);
      setStatus('error');
    }
  };

  /**
   * カメラを停止する
   */
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setStatus('idle');
    }
  };

  /**
   * 写真を撮影する
   */
  const capture = async (): Promise<Blob> => {
    if (!stream) {
      throw new Error('カメラが起動していません');
    }

    // video要素を作成（非表示）
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();

    // ビデオが読み込まれるまで待つ
    await new Promise((resolve) => {
      video.onloadedmetadata = resolve;
    });

    // canvas に描画
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas コンテキストの取得に失敗しました');
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Blob に変換
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('画像の生成に失敗しました'));
        }
      }, 'image/jpeg', 0.95);
    });
  };

  // クリーンアップ: アンマウント時にカメラを停止
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return {
    stream,
    status,
    error,
    startCamera,
    stopCamera,
    capture,
  };
}
