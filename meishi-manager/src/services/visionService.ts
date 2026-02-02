/**
 * Google Cloud Vision API を使用したOCRサービス
 */

import type { OCRResult } from '../types';

// Vision API エンドポイント
const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

/**
 * 画像BlobをBase64文字列に変換
 * @param imageBlob 画像Blob
 * @returns Base64エンコードされた画像データ（data:image/...;base64, を除く）
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
 * Vision APIを使用して画像からテキストを抽出
 * @param imageBase64 Base64エンコードされた画像データ
 * @returns OCR結果
 */
export const detectTextFromImage = async (
  imageBase64: string
): Promise<OCRResult> => {
  const apiKey = import.meta.env.VITE_VISION_API_KEY;

  if (!apiKey) {
    throw new Error('Vision APIキーが設定されていません');
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
      throw new Error(
        `Vision API エラー: ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    const textAnnotations = data.responses[0]?.textAnnotations;

    if (!textAnnotations || textAnnotations.length === 0) {
      return {
        text: '',
        confidence: 0,
      };
    }

    // 最初の要素が完全なテキスト
    const fullText = textAnnotations[0].description;

    // 信頼度の平均を計算（存在する場合）
    const confidences = textAnnotations
      .slice(1)
      .map((annotation: any) => annotation.confidence)
      .filter((c: number) => c !== undefined);

    const confidence =
      confidences.length > 0
        ? confidences.reduce((sum: number, c: number) => sum + c, 0) /
          confidences.length
        : 0;

    return {
      text: fullText,
      confidence,
    };
  } catch (error) {
    console.error('Vision API error:', error);
    throw error;
  }
};
