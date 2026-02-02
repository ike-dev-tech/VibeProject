/**
 * OCRテキストのバリデーションとパース
 */

/**
 * バリデーション結果の型
 */
export interface ValidationResult {
  isValid: boolean;
  score: number;
  reason?: string;
}

/**
 * OCRテキストが名刺として有効かを検証
 * @param ocrText OCRで読み取ったテキスト
 * @returns バリデーション結果
 */
export const validateOcrText = (ocrText: string): ValidationResult => {
  // 最小文字数チェック（10文字以上）
  if (ocrText.length < 10) {
    return { isValid: false, score: 0, reason: 'テキストが短すぎます（10文字未満）' };
  }

  // 名刺らしさスコア計算
  let score = 0;

  // 電話番号パターン: +30%
  const phonePatterns = [
    /0\d{1,4}[-(\s]?\d{1,4}[-)\s]?\d{4}/, // 固定電話
    /0[789]0[-\s]?\d{4}[-\s]?\d{4}/, // 携帯電話
    /TEL|Tel|tel|電話|☎/, // TELラベル
  ];
  if (phonePatterns.some((pattern) => pattern.test(ocrText))) {
    score += 30;
  }

  // メールアドレス: +30%
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(ocrText)) {
    score += 30;
  }

  // 会社キーワード: +20%
  const companyKeywords = [
    '株式会社',
    '有限会社',
    '合同会社',
    '一般社団法人',
    '公益社団法人',
    '一般財団法人',
    '公益財団法人',
    'Co.,Ltd.',
    'Inc.',
    'Corp.',
    'Corporation',
  ];
  if (companyKeywords.some((keyword) => ocrText.includes(keyword))) {
    score += 20;
  }

  // 郵便番号/住所: +10%
  const addressPatterns = [
    /〒?\s?(\d{3}[-−‐]?\d{4})/, // 郵便番号
    /[都道府県]/, // 都道府県
  ];
  if (addressPatterns.some((pattern) => pattern.test(ocrText))) {
    score += 10;
  }

  // 日本人名パターン: +25%
  const lines = ocrText.split('\n').filter((line) => line.trim().length > 0);
  const japaneseNamePattern = /^[\u4e00-\u9faf]{2,4}(\s+[\u4e00-\u9faf]{1,4})?$/;
  if (lines.some((line) => japaneseNamePattern.test(line.trim()))) {
    score += 25;
  }

  // 閾値: 15%以上で名刺と判定
  const isValid = score >= 15;
  return {
    isValid,
    score,
    reason: isValid ? undefined : `名刺らしさスコアが低すぎます（${score}%）`,
  };
};
