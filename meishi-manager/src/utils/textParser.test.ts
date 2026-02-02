import { describe, it, expect } from 'vitest';
import { validateOcrText } from './textParser';

describe('textParser', () => {
  describe('validateOcrText', () => {
    it('電話番号を含むテキストは名刺として有効', () => {
      const text = 'TEL: 03-1234-5678';
      const result = validateOcrText(text);

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });

    it('メールアドレスを含むテキストは名刺として有効', () => {
      const text = 'Email: test@example.com';
      const result = validateOcrText(text);

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });

    it('会社名キーワードを含むテキストは名刺として有効', () => {
      const text = '株式会社テストコーポレーション';
      const result = validateOcrText(text);

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });

    it('郵便番号を含むテキストは名刺として有効', () => {
      const text = '株式会社テスト 〒100-0001';
      const result = validateOcrText(text);

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });

    it('複数の要素を含むテキストはスコアが高い', () => {
      const text = `山田太郎
株式会社テスト
TEL: 03-1234-5678
Email: yamada@test.co.jp
〒100-0001 東京都千代田区`;

      const result = validateOcrText(text);

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(50);
    });

    it('10文字未満のテキストは無効', () => {
      const text = '短い';
      const result = validateOcrText(text);

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('短すぎます');
    });

    it('空のテキストは無効', () => {
      const text = '';
      const result = validateOcrText(text);

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('短すぎます');
    });

    it('名刺の要素を含まないテキストはスコアが低い', () => {
      const text = 'これは名刺ではない普通のテキストです。';
      const result = validateOcrText(text);

      expect(result.score).toBeLessThan(15);
    });

    it('閾値（15%）未満のテキストは無効', () => {
      const text = 'これは名刺ではない普通のテキストです';
      const result = validateOcrText(text);

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('スコアが低すぎます');
    });

    it('携帯電話番号パターンを検出する', () => {
      const text = '090-1234-5678';
      const result = validateOcrText(text);

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });

    it('都道府県を含むテキストにスコアを加算', () => {
      const text = `山田太郎
東京都千代田区千代田1-1-1`;
      const result = validateOcrText(text);

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });
  });
});
