import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractBusinessCardInfo } from './openaiService';
import type { ExtractedData } from '../types';

// グローバルfetchをモック
global.fetch = vi.fn();

describe('openaiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 環境変数をモック
    vi.stubEnv('VITE_OPENAI_API_KEY', 'test-api-key');
  });

  describe('extractBusinessCardInfo', () => {
    it('OpenAI APIを呼び出して名刺情報を抽出できる', async () => {
      const mockOcrText = `山田太郎
株式会社テスト
営業部 部長
TEL: 03-1234-5678
Email: yamada@test.co.jp
〒100-0001 東京都千代田区千代田1-1-1`;

      const mockResponse: ExtractedData = {
        name: '山田 太郎',
        company: '株式会社テスト',
        department: '営業部',
        position: '部長',
        phone: '03-1234-5678',
        email: 'yamada@test.co.jp',
        postalCode: '100-0001',
        address: '東京都千代田区千代田1-1-1',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify(mockResponse),
              },
            },
          ],
        }),
      });

      const result = await extractBusinessCardInfo(mockOcrText);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-api-key',
          }),
        })
      );
    });

    it('APIキーが設定されていない場合、エラーをスローする', async () => {
      vi.stubEnv('VITE_OPENAI_API_KEY', '');

      await expect(extractBusinessCardInfo('test')).rejects.toThrow(
        'OpenAI APIキーが設定されていません'
      );
    });

    it('API呼び出しが失敗した場合、エラーをスローする', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      await expect(extractBusinessCardInfo('test')).rejects.toThrow(
        'OpenAI API エラー: 500'
      );
    });

    it('レスポンスのJSONパースに失敗した場合、エラーをスローする', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'invalid json',
              },
            },
          ],
        }),
      });

      await expect(extractBusinessCardInfo('test')).rejects.toThrow(
        'AIレスポンスのパースに失敗しました'
      );
    });

    it('空のOCRテキストでも呼び出せる', async () => {
      const mockResponse: ExtractedData = {};

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify(mockResponse),
              },
            },
          ],
        }),
      });

      const result = await extractBusinessCardInfo('');

      expect(result).toEqual(mockResponse);
    });

    it('gpt-4o-miniモデルを使用してAPIを呼び出す', async () => {
      const mockResponse: ExtractedData = { name: 'テスト' };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify(mockResponse),
              },
            },
          ],
        }),
      });

      await extractBusinessCardInfo('test');

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.model).toBe('gpt-4o-mini');
    });

    it('response_format: json_object を指定してAPIを呼び出す', async () => {
      const mockResponse: ExtractedData = { name: 'テスト' };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify(mockResponse),
              },
            },
          ],
        }),
      });

      await extractBusinessCardInfo('test');

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.response_format).toEqual({ type: 'json_object' });
    });

    it('システムプロンプトに名刺情報抽出の指示を含む', async () => {
      const mockResponse: ExtractedData = { name: 'テスト' };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify(mockResponse),
              },
            },
          ],
        }),
      });

      await extractBusinessCardInfo('test');

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.messages[0].role).toBe('system');
      expect(requestBody.messages[0].content).toContain('名刺');
      expect(requestBody.messages[0].content).toContain('抽出');
    });
  });
});
