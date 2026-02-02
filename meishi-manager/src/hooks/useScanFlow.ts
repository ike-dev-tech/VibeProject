/**
 * 名刺スキャンフロー全体を管理するカスタムフック
 * 撮影 → OCR → バリデーション → AI抽出 → 保存の一連のフローを提供
 */

import { useState } from 'react';
import { imageToBase64, detectTextFromImage } from '../services/visionService';
import { extractBusinessCardInfo } from '../services/openaiService';
import { createCard } from '../services/gasService';
import { validateOcrText } from '../utils/textParser';
import type { BusinessCard } from '../types';

/**
 * スキャンフローの状態
 */
export type ScanStatus =
  | 'idle'
  | 'scanning'
  | 'validating'
  | 'extracting'
  | 'saving'
  | 'completed'
  | 'error';

/**
 * useScanFlowフックの戻り値
 */
export interface UseScanFlowReturn {
  status: ScanStatus;
  progress: number;
  error: string | null;
  result: BusinessCard | null;
  scanBusinessCard: (imageBlob: Blob) => Promise<void>;
  reset: () => void;
}

/**
 * 名刺スキャンフロー管理フック
 */
export function useScanFlow(): UseScanFlowReturn {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BusinessCard | null>(null);

  /**
   * 名刺をスキャンして保存する
   */
  const scanBusinessCard = async (imageBlob: Blob): Promise<void> => {
    try {
      setStatus('scanning');
      setProgress(0);
      setError(null);
      setResult(null);

      // Step 1: 画像をBase64に変換
      setProgress(10);
      const base64Image = await imageToBase64(imageBlob);

      // Step 2: OCRでテキスト抽出
      setProgress(20);
      const ocrResult = await detectTextFromImage(base64Image);
      setProgress(40);

      // Step 3: OCRテキストのバリデーション
      setStatus('validating');
      const validation = validateOcrText(ocrResult.text);

      if (!validation.isValid) {
        throw new Error(
          `名刺として認識できませんでした: ${validation.reason}`
        );
      }
      setProgress(50);

      // Step 4: AI抽出
      setStatus('extracting');
      const extractedData = await extractBusinessCardInfo(ocrResult.text);
      setProgress(70);

      // Step 5: GASに保存
      setStatus('saving');
      const savedCard = await createCard({
        name: extractedData.name || '',
        nameKana: extractedData.nameKana || '',
        company: extractedData.company || '',
        department: extractedData.department || '',
        position: extractedData.position || '',
        phone: extractedData.phone || '',
        fax: extractedData.fax || '',
        email: extractedData.email || '',
        address: extractedData.address || '',
        postalCode: extractedData.postalCode || '',
        url: extractedData.url || '',
        tags: [],
        rawText: ocrResult.text,
      });
      setProgress(90);

      // 完了
      setResult(savedCard);
      setStatus('completed');
      setProgress(100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';

      // エラーメッセージを分類
      let userFriendlyError = errorMessage;
      if (errorMessage.includes('Vision') || errorMessage.includes('OCR')) {
        userFriendlyError = `OCRエラー: ${errorMessage}`;
      } else if (errorMessage.includes('OpenAI') || errorMessage.includes('AI')) {
        userFriendlyError = `AI抽出エラー: ${errorMessage}`;
      } else if (errorMessage.includes('GAS') || errorMessage.includes('保存')) {
        userFriendlyError = `保存エラー: ${errorMessage}`;
      }

      setError(userFriendlyError);
      setStatus('error');
      throw err;
    }
  };

  /**
   * 状態をリセット
   */
  const reset = () => {
    setStatus('idle');
    setProgress(0);
    setError(null);
    setResult(null);
  };

  return {
    status,
    progress,
    error,
    result,
    scanBusinessCard,
    reset,
  };
}
