import { useState, useEffect, useCallback, useRef } from 'react';
import { scanVideoFrame } from '../services/visionService';
import {
  generateCardHash,
  validateOcrTextForBusinessCard,
  validateExtractedData
} from '../utils/textParser';
import { extractBusinessCardWithAI } from '../services/openaiService';
import type { BusinessCard, ScanStatus } from '../types/businessCard';

interface UseBusinessCardDetectorProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isReady: boolean;
  enabled: boolean;
}

interface UseBusinessCardDetectorReturn {
  status: ScanStatus;
  currentCard: BusinessCard | null;
  error: string | null;
  scanCount: number;
}

// フレーム安定性検出の設定
const STABILITY_THRESHOLD = 0.02; // 2%以下の変化で安定と判定
const REQUIRED_STABLE_FRAMES = 5; // 5フレーム連続で安定が必要
const SAMPLING_INTERVAL = 200; // 200msごとにサンプリング
const COOLDOWN_PERIOD = 3000; // 3秒間のクールダウン

/**
 * 2つのフレームの差分を計算
 */
const calculateFrameDifference = (
  frame1: ImageData,
  frame2: ImageData
): number => {
  if (frame1.data.length !== frame2.data.length) {
    return 1.0;
  }

  let diff = 0;
  const length = frame1.data.length;

  for (let i = 0; i < length; i += 4) {
    // RGB値の差分を計算（Alpha値は無視）
    const r = Math.abs(frame1.data[i] - frame2.data[i]);
    const g = Math.abs(frame1.data[i + 1] - frame2.data[i + 1]);
    const b = Math.abs(frame1.data[i + 2] - frame2.data[i + 2]);
    diff += r + g + b;
  }

  // 正規化（0-1の範囲）
  return diff / (length * 255 * 0.75); // RGB 3チャンネル分
};

/**
 * 名刺自動検出カスタムフック
 */
export const useBusinessCardDetector = ({
  videoRef,
  isReady,
  enabled,
}: UseBusinessCardDetectorProps): UseBusinessCardDetectorReturn => {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [currentCard, setCurrentCard] = useState<BusinessCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);

  // 検出制御用のRef
  const stableFrameCountRef = useRef(0);
  const lastFrameRef = useRef<ImageData | null>(null);
  const lastScanHashRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const intervalIdRef = useRef<number | null>(null);

  /**
   * ビデオフレームをキャプチャ
   */
  const captureFrame = useCallback((): ImageData | null => {
    const video = videoRef.current;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return null;
    }

    ctx.drawImage(video, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }, [videoRef]);

  /**
   * OCRスキャンを実行（多層防御アプローチ）
   */
  const performScan = useCallback(async () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    try {
      setStatus('processing');
      setError(null);

      // Step 1: OCR実行
      const ocrResult = await scanVideoFrame(video);
      console.log('OCR結果:', ocrResult);

      // Step 2: OCRテキスト事前検証（Phase 1）
      const ocrValidation = validateOcrTextForBusinessCard(
        ocrResult.fullText,
        ocrResult.lines
      );

      if (!ocrValidation.isValid) {
        console.log('OCR事前検証で却下:', ocrValidation.reason);
        setStatus('idle');
        return;
      }

      console.log(`OCR検証通過（スコア: ${ocrValidation.score}%）`);

      // Step 3: AI抽出
      const extracted = await extractBusinessCardWithAI(ocrResult.fullText);
      console.log('AI抽出結果:', extracted);

      // Step 4: AI名刺判定チェック（Phase 2）
      if (!extracted.isBusinessCard) {
        console.log('AIが名刺でないと判定しました');
        setStatus('idle');
        return;
      }

      // Step 5: BusinessCard型に変換（rawTextを含む）
      const card: BusinessCard = {
        name: extracted.name || '',
        nameKana: extracted.nameKana,
        company: extracted.company || '',
        department: extracted.department,
        position: extracted.position,
        phone: extracted.phone,
        fax: extracted.fax,
        email: extracted.email,
        address: extracted.address,
        postalCode: extracted.postalCode,
        url: extracted.url,
        sns: extracted.sns,
        scannedAt: new Date().toISOString(),
        rawText: ocrResult.fullText,
      };

      // Step 6: 抽出データ検証（Phase 3）
      const dataValidation = validateExtractedData(card, ocrResult.fullText);
      if (!dataValidation.isValid) {
        console.log('抽出データ検証で却下:', dataValidation.reason);
        setStatus('idle');
        return;
      }

      // Step 7: 既存の名前・会社名チェック
      if (!card.name || !card.company) {
        console.log('Invalid card data: missing name or company');
        setStatus('idle');
        return;
      }

      // Step 8: 重複チェック
      const cardHash = generateCardHash(card);
      const now = Date.now();

      if (
        lastScanHashRef.current === cardHash &&
        now - lastScanTimeRef.current < COOLDOWN_PERIOD
      ) {
        console.log('Duplicate card detected, skipping');
        setStatus('idle');
        return;
      }

      // 成功
      console.log('✓ すべての検証を通過しました');
      lastScanHashRef.current = cardHash;
      lastScanTimeRef.current = now;
      setCurrentCard(card);
      setStatus('success');
      setScanCount(prev => prev + 1);

      // 一定時間後にステータスをリセット
      setTimeout(() => {
        setStatus('idle');
      }, 2000);

    } catch (err) {
      console.error('Scan error:', err);
      setError(err instanceof Error ? err.message : 'スキャンに失敗しました');
      setStatus('error');

      // エラー後、自動的にidleに戻す
      setTimeout(() => {
        setStatus('idle');
        setError(null);
      }, 3000);
    }
  }, [videoRef]);

  /**
   * フレームの安定性をチェック
   */
  const checkFrameStability = useCallback(() => {
    if (!isReady || !enabled || status === 'processing') {
      return;
    }

    const currentFrame = captureFrame();
    if (!currentFrame) {
      return;
    }

    // 前回のフレームと比較
    if (lastFrameRef.current) {
      const difference = calculateFrameDifference(lastFrameRef.current, currentFrame);

      if (difference < STABILITY_THRESHOLD) {
        // フレームが安定している
        stableFrameCountRef.current++;

        if (stableFrameCountRef.current >= REQUIRED_STABLE_FRAMES) {
          // 十分な数の安定フレームを検出
          console.log('Stable frames detected, starting scan...');
          setStatus('detecting');
          stableFrameCountRef.current = 0; // カウントをリセット
          performScan();
        }
      } else {
        // フレームが不安定
        stableFrameCountRef.current = 0;
      }
    }

    // 現在のフレームを保存
    lastFrameRef.current = currentFrame;
  }, [isReady, enabled, status, captureFrame, performScan]);

  // 定期的なフレーム検出
  useEffect(() => {
    if (isReady && enabled) {
      // サンプリング開始
      intervalIdRef.current = window.setInterval(
        checkFrameStability,
        SAMPLING_INTERVAL
      );
    } else {
      // サンプリング停止
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      stableFrameCountRef.current = 0;
      lastFrameRef.current = null;
    }

    return () => {
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, [isReady, enabled, checkFrameStability]);

  return {
    status,
    currentCard,
    error,
    scanCount,
  };
};
