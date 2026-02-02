import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useScanFlow } from './useScanFlow';
import * as visionService from '../services/visionService';
import * as openaiService from '../services/openaiService';
import * as gasService from '../services/gasService';
import * as textParser from '../utils/textParser';

// サービスをモック
vi.mock('../services/visionService');
vi.mock('../services/openaiService');
vi.mock('../services/gasService');
vi.mock('../utils/textParser');

describe('useScanFlow', () => {
  let mockImageBlob: Blob;

  beforeEach(() => {
    vi.clearAllMocks();
    mockImageBlob = new Blob(['test'], { type: 'image/jpeg' });
  });

  describe('初期状態', () => {
    it('初期状態が正しく設定されている', () => {
      const { result } = renderHook(() => useScanFlow());

      expect(result.current.status).toBe('idle');
      expect(result.current.progress).toBe(0);
      expect(result.current.error).toBeNull();
      expect(result.current.result).toBeNull();
    });
  });

  describe('scanBusinessCard', () => {
    it('正常系: 撮影からGAS保存まで完了する', async () => {
      // モックの設定
      vi.spyOn(visionService, 'imageToBase64').mockResolvedValue('base64-image');
      vi.spyOn(visionService, 'detectTextFromImage').mockResolvedValue({
        text: '山田太郎\n株式会社テスト\nTEL: 03-1234-5678',
        confidence: 0.95,
      });
      vi.spyOn(textParser, 'validateOcrText').mockReturnValue({
        isValid: true,
        score: 80,
      });
      vi.spyOn(openaiService, 'extractBusinessCardInfo').mockResolvedValue({
        name: '山田 太郎',
        company: '株式会社テスト',
        phone: '03-1234-5678',
      });
      vi.spyOn(gasService, 'createCard').mockResolvedValue({
        id: 'test-id',
        name: '山田 太郎',
        nameKana: '',
        company: '株式会社テスト',
        department: '',
        position: '',
        phone: '03-1234-5678',
        fax: '',
        email: '',
        address: '',
        postalCode: '',
        url: '',
        tags: [],
        rawText: '山田太郎\n株式会社テスト\nTEL: 03-1234-5678',
        scannedAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });

      const { result } = renderHook(() => useScanFlow());

      await act(async () => {
        await result.current.scanBusinessCard(mockImageBlob);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('completed');
        expect(result.current.progress).toBe(100);
        expect(result.current.error).toBeNull();
        expect(result.current.result).not.toBeNull();
      });
    });

    it('OCRでエラーが発生した場合、エラー状態になる', async () => {
      vi.spyOn(visionService, 'imageToBase64').mockResolvedValue('base64-image');
      vi.spyOn(visionService, 'detectTextFromImage').mockRejectedValue(
        new Error('OCR failed')
      );

      const { result } = renderHook(() => useScanFlow());

      await act(async () => {
        try {
          await result.current.scanBusinessCard(mockImageBlob);
        } catch (error) {
          // エラーは無視（ステータスで確認）
        }
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
        expect(result.current.error).toContain('OCR');
      });
    });

    it('OCRテキストが名刺として無効な場合、エラー状態になる', async () => {
      vi.spyOn(visionService, 'imageToBase64').mockResolvedValue('base64-image');
      vi.spyOn(visionService, 'detectTextFromImage').mockResolvedValue({
        text: '無効なテキスト',
        confidence: 0.5,
      });
      vi.spyOn(textParser, 'validateOcrText').mockReturnValue({
        isValid: false,
        score: 5,
        reason: 'スコアが低すぎます',
      });

      const { result } = renderHook(() => useScanFlow());

      await act(async () => {
        try {
          await result.current.scanBusinessCard(mockImageBlob);
        } catch (error) {
          // エラーは無視
        }
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
        expect(result.current.error).toContain('名刺として認識できませんでした');
      });
    });

    it('AI抽出でエラーが発生した場合、エラー状態になる', async () => {
      vi.spyOn(visionService, 'imageToBase64').mockResolvedValue('base64-image');
      vi.spyOn(visionService, 'detectTextFromImage').mockResolvedValue({
        text: '山田太郎',
        confidence: 0.9,
      });
      vi.spyOn(textParser, 'validateOcrText').mockReturnValue({
        isValid: true,
        score: 80,
      });
      vi.spyOn(openaiService, 'extractBusinessCardInfo').mockRejectedValue(
        new Error('AI extraction failed')
      );

      const { result } = renderHook(() => useScanFlow());

      await act(async () => {
        try {
          await result.current.scanBusinessCard(mockImageBlob);
        } catch (error) {
          // エラーは無視
        }
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
        expect(result.current.error).toContain('AI');
      });
    });

    it('GAS保存でエラーが発生した場合、エラー状態になる', async () => {
      vi.spyOn(visionService, 'imageToBase64').mockResolvedValue('base64-image');
      vi.spyOn(visionService, 'detectTextFromImage').mockResolvedValue({
        text: '山田太郎',
        confidence: 0.9,
      });
      vi.spyOn(textParser, 'validateOcrText').mockReturnValue({
        isValid: true,
        score: 80,
      });
      vi.spyOn(openaiService, 'extractBusinessCardInfo').mockResolvedValue({
        name: '山田 太郎',
      });
      vi.spyOn(gasService, 'createCard').mockRejectedValue(
        new Error('GAS save failed')
      );

      const { result } = renderHook(() => useScanFlow());

      await act(async () => {
        try {
          await result.current.scanBusinessCard(mockImageBlob);
        } catch (error) {
          // エラーは無視
        }
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
        expect(result.current.error).toContain('保存');
      });
    });

    it('完了時にプログレスが100になる', async () => {
      vi.spyOn(visionService, 'imageToBase64').mockResolvedValue('base64-image');
      vi.spyOn(visionService, 'detectTextFromImage').mockResolvedValue({
        text: '山田太郎',
        confidence: 0.9,
      });
      vi.spyOn(textParser, 'validateOcrText').mockReturnValue({
        isValid: true,
        score: 80,
      });
      vi.spyOn(openaiService, 'extractBusinessCardInfo').mockResolvedValue({
        name: '山田 太郎',
      });
      vi.spyOn(gasService, 'createCard').mockResolvedValue({
        id: 'test-id',
        name: '山田 太郎',
        nameKana: '',
        company: '',
        department: '',
        position: '',
        phone: '',
        fax: '',
        email: '',
        address: '',
        postalCode: '',
        url: '',
        tags: [],
        rawText: '山田太郎',
        scannedAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });

      const { result } = renderHook(() => useScanFlow());

      await act(async () => {
        await result.current.scanBusinessCard(mockImageBlob);
      });

      await waitFor(() => {
        expect(result.current.progress).toBe(100);
      });
    });
  });

  describe('reset', () => {
    it('ステータスとエラーをリセットできる', async () => {
      vi.spyOn(visionService, 'imageToBase64').mockRejectedValue(new Error('Error'));

      const { result } = renderHook(() => useScanFlow());

      await act(async () => {
        try {
          await result.current.scanBusinessCard(mockImageBlob);
        } catch (error) {
          // エラーは無視
        }
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe('idle');
      expect(result.current.progress).toBe(0);
      expect(result.current.error).toBeNull();
      expect(result.current.result).toBeNull();
    });
  });
});
