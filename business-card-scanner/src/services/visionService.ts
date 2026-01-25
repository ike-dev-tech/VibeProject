import type { OcrResult } from '../types/businessCard';

// Vision API エンドポイント
const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

/**
 * 画像をBase64エンコードする
 */
export const imageToBase64 = async (imageBlob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      // data:image/jpeg;base64, の部分を除去
      const base64 = base64data.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageBlob);
  });
};

/**
 * Canvas要素から画像Blobを取得
 */
export const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas to Blob conversion failed'));
      }
    }, 'image/jpeg', 0.9);
  });
};

/**
 * Vision APIを使用してテキスト検出
 */
export const detectText = async (imageBase64: string): Promise<OcrResult> => {
  const apiKey = import.meta.env.VITE_VISION_API_KEY;

  if (!apiKey) {
    throw new Error('Vision API key is not set. Please set VITE_VISION_API_KEY in .env.local');
  }

  const requestBody = {
    requests: [
      {
        image: {
          content: imageBase64,
        },
        features: [
          {
            type: 'TEXT_DETECTION',
            maxResults: 1,
          },
        ],
        imageContext: {
          languageHints: ['ja', 'en'], // 日本語と英語をヒントとして指定
        },
      },
    ],
  };

  try {
    const response = await fetch(`${VISION_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Vision API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const textAnnotations = data.responses[0]?.textAnnotations;

    if (!textAnnotations || textAnnotations.length === 0) {
      return {
        fullText: '',
        lines: [],
        confidence: 0,
      };
    }

    // 最初の要素が完全なテキスト
    const fullText = textAnnotations[0].description;
    const lines = fullText.split('\n').filter((line: string) => line.trim());

    // 信頼度の平均を計算（存在する場合）
    const confidences = textAnnotations
      .slice(1)
      .map((annotation: any) => annotation.confidence)
      .filter((c: number) => c !== undefined);

    const confidence = confidences.length > 0
      ? confidences.reduce((sum: number, c: number) => sum + c, 0) / confidences.length
      : undefined;

    return {
      fullText,
      lines,
      confidence,
    };
  } catch (error) {
    console.error('Vision API error:', error);
    throw error;
  }
};

/**
 * ビデオフレームからOCRを実行
 */
export const scanVideoFrame = async (video: HTMLVideoElement): Promise<OcrResult> => {
  // Canvasにビデオフレームを描画
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Blobに変換
  const blob = await canvasToBlob(canvas);

  // Base64エンコード
  const base64 = await imageToBase64(blob);

  // OCR実行
  return await detectText(base64);
};
