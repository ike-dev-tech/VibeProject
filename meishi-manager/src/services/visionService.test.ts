import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectTextFromImage, imageToBase64 } from './visionService';

// グローバルfetchをモック
global.fetch = vi.fn();

describe('visionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_VISION_API_KEY', 'test-vision-api-key');
  });

  // imageToBase64は統合テストでカバーするため、ユニットテストは省略

  describe('detectTextFromImage', () => {
    it('Vision APIを呼び出してテキストを抽出できる', async () => {
      const mockBase64 = 'test-base64-image';
      const mockResponse = {
        responses: [
          {
            textAnnotations: [
              {
                description: '山田太郎\n株式会社テスト\nTEL: 03-1234-5678',
              },
              {
                description: '山田太郎',
                confidence: 0.95,
              },
              {
                description: '株式会社テスト',
                confidence: 0.92,
              },
            ],
          },
        ],
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await detectTextFromImage(mockBase64);

      expect(result.text).toBe('山田太郎\n株式会社テスト\nTEL: 03-1234-5678');
      expect(result.confidence).toBeGreaterThan(0);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('vision.googleapis.com'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('APIキーが設定されていない場合、エラーをスローする', async () => {
      vi.stubEnv('VITE_VISION_API_KEY', '');

      await expect(detectTextFromImage('test')).rejects.toThrow(
        'Vision APIキーが設定されていません'
      );
    });

    it('API呼び出しが失敗した場合、エラーをスローする', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: { message: 'API Error' } }),
      });

      await expect(detectTextFromImage('test')).rejects.toThrow('Vision API エラー');
    });

    it('テキストが検出されなかった場合、空の結果を返す', async () => {
      const mockResponse = {
        responses: [
          {
            textAnnotations: [],
          },
        ],
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await detectTextFromImage('test');

      expect(result.text).toBe('');
      expect(result.confidence).toBe(0);
    });

    it('日本語と英語のlanguageHintsを指定してAPIを呼び出す', async () => {
      const mockResponse = {
        responses: [
          {
            textAnnotations: [
              {
                description: 'テスト',
              },
            ],
          },
        ],
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await detectTextFromImage('test');

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.requests[0].imageContext.languageHints).toEqual(['ja', 'en']);
    });

    it('TEXT_DETECTION機能を使用してAPIを呼び出す', async () => {
      const mockResponse = {
        responses: [
          {
            textAnnotations: [
              {
                description: 'テスト',
              },
            ],
          },
        ],
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await detectTextFromImage('test');

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.requests[0].features[0].type).toBe('TEXT_DETECTION');
    });
  });
});
