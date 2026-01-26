import type { BusinessCard, OcrResult } from '../types/businessCard';
import { extractBusinessCardWithAI, convertToBusinessCard } from '../services/openaiService';

/**
 * OCRテキストが名刺として有効かを検証（Phase 1: 事前フィルタリング）
 * @param ocrText OCRで読み取ったテキスト
 * @param lines OCRで読み取った行配列
 * @returns 名刺らしさスコア（0-100%）
 */
export const validateOcrTextForBusinessCard = (
  ocrText: string,
  lines: string[]
): { isValid: boolean; score: number; reason?: string } => {
  // 最小文字数チェック（20文字以上）
  if (ocrText.length < 20) {
    return { isValid: false, score: 0, reason: 'テキストが短すぎます（20文字未満）' };
  }

  // 最小行数チェック（3行以上）
  const validLines = lines.filter(line => line.trim().length > 0);
  if (validLines.length < 3) {
    return { isValid: false, score: 0, reason: '行数が少なすぎます（3行未満）' };
  }

  // 名刺らしさスコア計算
  let score = 0;

  // 電話番号パターン: +30%
  const phonePatterns = [
    /0\d{1,4}[-(\s]?\d{1,4}[-)\s]?\d{4}/, // 固定電話
    /0[789]0[-\s]?\d{4}[-\s]?\d{4}/,      // 携帯電話
    /TEL|Tel|tel|電話|☎/                   // TELラベル
  ];
  if (phonePatterns.some(pattern => pattern.test(ocrText))) {
    score += 30;
  }

  // メールアドレス: +30%
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(ocrText)) {
    score += 30;
  }

  // 会社キーワード: +20%
  const companyKeywords = [
    '株式会社', '有限会社', '合同会社', '一般社団法人', '公益社団法人',
    '一般財団法人', '公益財団法人', 'Co.,Ltd.', 'Inc.', 'Corp.', 'Corporation'
  ];
  if (companyKeywords.some(keyword => ocrText.includes(keyword))) {
    score += 20;
  }

  // 郵便番号/住所: +10%
  const addressPatterns = [
    /〒?\s?(\d{3}[-−‐]?\d{4})/, // 郵便番号
    /[都道府県]/ // 都道府県
  ];
  if (addressPatterns.some(pattern => pattern.test(ocrText))) {
    score += 10;
  }

  // 日本人名パターン: +10%
  const japaneseNamePattern = /^[\u4e00-\u9faf]{2,4}(\s+[\u4e00-\u9faf]{1,4})?$/;
  if (validLines.some(line => japaneseNamePattern.test(line.trim()))) {
    score += 10;
  }

  // 閾値: 40%以上で名刺と判定
  const isValid = score >= 40;
  return {
    isValid,
    score,
    reason: isValid ? undefined : `名刺らしさスコアが低すぎます（${score}%）`
  };
};

/**
 * AI抽出結果がOCRテキストに基づいているかを検証（Phase 3: 結果検証）
 * @param card AI抽出された名刺データ
 * @param ocrText 元のOCRテキスト
 * @returns 検証結果
 */
export const validateExtractedData = (
  card: BusinessCard,
  ocrText: string
): { isValid: boolean; reason?: string } => {
  // ブラックリストチェック（架空データの典型例）
  const blacklist = [
    'サンプル',
    'sample',
    'SAMPLE',
    'テスト',
    'test',
    'TEST',
    '田中太郎',
    '山田太郎',
    '佐藤花子',
    'example.com',
    'test.com'
  ];

  // 名前がブラックリストに含まれるかチェック
  if (card.name && blacklist.some(item => card.name.includes(item))) {
    return { isValid: false, reason: `架空データが検出されました: ${card.name}` };
  }

  // 会社名がブラックリストに含まれるかチェック
  if (card.company && blacklist.some(item => card.company.includes(item))) {
    return { isValid: false, reason: `架空データが検出されました: ${card.company}` };
  }

  // OCRテキストの正規化（比較用）
  const normalizedOcr = ocrText
    .replace(/\s+/g, '') // 空白を除去
    .toLowerCase();

  // 名前がOCRテキストに含まれるかチェック
  if (card.name) {
    const normalizedName = card.name.replace(/\s+/g, '').toLowerCase();
    // 最低でも姓か名のどちらかがOCRテキストに含まれているべき
    const nameParts = card.name.split(/\s+/);
    const hasNameInOcr = nameParts.some(part => {
      const normalizedPart = part.replace(/\s+/g, '').toLowerCase();
      return normalizedPart.length >= 2 && normalizedOcr.includes(normalizedPart);
    });

    if (!hasNameInOcr && normalizedName.length > 0) {
      return { isValid: false, reason: `名前「${card.name}」がOCRテキストに見つかりません` };
    }
  }

  // 会社名がOCRテキストに含まれるかチェック
  if (card.company) {
    const normalizedCompany = card.company.replace(/\s+/g, '').toLowerCase();
    // 会社名から記号を除いた主要部分を抽出
    const companyCore = normalizedCompany
      .replace(/株式会社|有限会社|合同会社|co.,ltd.|inc.|corp./gi, '')
      .trim();

    if (companyCore.length >= 2 && !normalizedOcr.includes(companyCore)) {
      return { isValid: false, reason: `会社名「${card.company}」がOCRテキストに見つかりません` };
    }
  }

  return { isValid: true };
};

/**
 * メールアドレスを抽出
 */
const extractEmail = (text: string): string | undefined => {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailRegex);
  return match ? match[0] : undefined;
};

/**
 * 電話番号を抽出
 */
const extractPhone = (lines: string[]): string | undefined => {
  // TEL, Tel, tel などのラベルを探す
  for (const line of lines) {
    if (line.match(/^(TEL|Tel|tel|電話|☎)/)) {
      // ラベルの後の番号を抽出
      const phoneMatch = line.match(/[\d-()（）\s]+/);
      if (phoneMatch) {
        return phoneMatch[0].trim();
      }
    }
  }

  // ラベルがない場合、電話番号パターンを探す
  const phoneRegex = /0\d{1,4}[-(\s]?\d{1,4}[-)\s]?\d{4}/;
  for (const line of lines) {
    const match = line.match(phoneRegex);
    if (match) {
      return match[0];
    }
  }

  return undefined;
};

/**
 * FAX番号を抽出
 */
const extractFax = (lines: string[]): string | undefined => {
  for (const line of lines) {
    if (line.match(/^(FAX|Fax|fax)/)) {
      const faxMatch = line.match(/[\d-()（）\s]+/);
      if (faxMatch) {
        return faxMatch[0].trim();
      }
    }
  }
  return undefined;
};

/**
 * 郵便番号を抽出
 */
const extractPostalCode = (text: string): string | undefined => {
  const postalRegex = /〒?\s?(\d{3}[-−‐]?\d{4})/;
  const match = text.match(postalRegex);
  return match ? match[1] : undefined;
};

/**
 * URLを抽出
 */
const extractUrl = (text: string): string | undefined => {
  const urlRegex = /https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(com|co\.jp|jp|net|org)[^\s]*/;
  const match = text.match(urlRegex);
  return match ? match[0] : undefined;
};

/**
 * 会社名を抽出
 */
const extractCompany = (lines: string[]): string | undefined => {
  const companyKeywords = ['株式会社', '有限会社', '合同会社', '一般社団法人', '公益社団法人',
                           '一般財団法人', '公益財団法人', 'Co.,Ltd.', 'Inc.', 'Corp.', 'Corporation'];

  for (const line of lines) {
    for (const keyword of companyKeywords) {
      if (line.includes(keyword)) {
        return line.trim();
      }
    }
  }

  // キーワードがない場合、2行目を会社名と仮定（1行目は名前の可能性が高い）
  return lines.length > 1 ? lines[1].trim() : undefined;
};

/**
 * 住所を抽出
 */
const extractAddress = (lines: string[]): string | undefined => {
  const prefectures = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
  ];

  for (const line of lines) {
    for (const prefecture of prefectures) {
      if (line.includes(prefecture)) {
        return line.trim();
      }
    }
  }

  return undefined;
};

/**
 * 役職を抽出
 */
const extractPosition = (lines: string[]): string | undefined => {
  const positionKeywords = [
    '代表取締役', '取締役', '社長', '副社長', '専務', '常務', '部長', '次長',
    '課長', 'マネージャー', 'リーダー', 'チーフ', 'ディレクター', 'CEO', 'CTO',
    'CFO', 'COO', 'President', 'Director', 'Manager', 'Chief', '主任', '係長'
  ];

  for (const line of lines) {
    for (const keyword of positionKeywords) {
      if (line.includes(keyword)) {
        return line.trim();
      }
    }
  }

  return undefined;
};

/**
 * 部署名を抽出
 */
const extractDepartment = (lines: string[]): string | undefined => {
  const departmentKeywords = ['部', '課', '室', '局', '本部', 'Division', 'Department', 'Section'];

  for (const line of lines) {
    // 役職キーワードを含む行はスキップ
    if (extractPosition([line])) {
      continue;
    }

    for (const keyword of departmentKeywords) {
      if (line.includes(keyword)) {
        return line.trim();
      }
    }
  }

  return undefined;
};

/**
 * 氏名を抽出
 */
const extractName = (lines: string[]): string => {
  if (lines.length === 0) {
    return '';
  }

  // 日本人名パターン（漢字2〜4文字、またはスペース区切りの姓名）
  const japaneseNamePattern = /^[\u4e00-\u9faf]{2,4}(\s+[\u4e00-\u9faf]{1,4})?$/;

  // カタカナのみの長い文字列（会社名/ブランド名の可能性が高い）
  const katakanaOnlyPattern = /^[\u30a0-\u30ff]{5,}$/;

  // 特殊文字や記号のみの文字列（除外すべき）
  const specialCharPattern = /^[^\u4e00-\u9faf\u3040-\u309f\u30a0-\u30ffa-zA-Z\s]+$/;

  // 除外すべき記号や絵文字のリスト
  const excludedSymbols = ['✓', '✗', '✕', '✖', '◯', '○', '●', '◎', '□', '■', '▲', '△', '▼', '▽',
                           '📇', '📱', '☎', '📞', '✉', '📧', '🏢', '🏠', '〒'];

  // 絵文字範囲をチェック（Unicode絵文字ブロック）
  const emojiPattern = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

  // 除外すべき行のパターン
  const shouldSkipLine = (line: string): boolean => {
    const trimmed = line.trim();
    // 空行
    if (trimmed.length === 0) return true;
    // 除外記号が含まれているか
    for (const symbol of excludedSymbols) {
      if (trimmed.includes(symbol)) return true;
    }
    // 絵文字が含まれているか
    if (emojiPattern.test(trimmed)) return true;
    // 特殊文字や記号のみ（✓、✗、📇など）
    if (specialCharPattern.test(trimmed)) return true;
    // 1文字のみの行（記号や単一文字）
    if (trimmed.length === 1) return true;
    // 2文字以下で数字や記号を含む行
    if (trimmed.length <= 2 && /[^\u4e00-\u9faf\u3040-\u309f\u30a0-\u30ffa-zA-Z]/.test(trimmed)) return true;
    // 会社名キーワードを含む
    if (extractCompany([trimmed])) return true;
    // 役職キーワードを含む
    if (extractPosition([trimmed])) return true;
    // カタカナのみの長い文字列
    if (katakanaOnlyPattern.test(trimmed)) return true;
    // メールアドレスや電話番号を含む
    if (trimmed.includes('@') || /^\d{2,}/.test(trimmed)) return true;

    // 認証マークやロゴ関連のキーワード（名前ではない）
    const certificationKeywords = [
      'ANAB', 'bsi', 'BSI', 'ISO', 'ISMS', 'ACCREDITED',
      'MANAGEMENT', 'SYSTEMS', 'CERTIFIED', 'CERTIFICATION'
    ];
    for (const keyword of certificationKeywords) {
      if (trimmed.toUpperCase().includes(keyword)) return true;
    }

    // 英字のみで5文字以下はロゴや略称の可能性が高い
    if (/^[A-Za-z]{1,5}$/.test(trimmed)) return true;

    return false;
  };

  // 最初に日本人名パターンを優先的に探す（全行スキャン）
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (shouldSkipLine(line)) continue;
    // 日本人名パターンにマッチすれば即座に返す
    if (japaneseNamePattern.test(line)) {
      return line;
    }
  }

  // 日本人名が見つからない場合は、最初の適切な行を返す（最大5行まで）
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i].trim();
    if (!shouldSkipLine(line)) {
      return line;
    }
  }

  // それでも見つからなければ空文字を返す
  return '';
};

/**
 * SNSアカウントを抽出
 */
const extractSns = (text: string): string | undefined => {
  const snsPatterns = [
    /@[a-zA-Z0-9_]+/, // Twitter/X
    /facebook\.com\/[a-zA-Z0-9._]+/,
    /linkedin\.com\/[a-zA-Z0-9._/-]+/,
    /instagram\.com\/[a-zA-Z0-9._]+/,
  ];

  for (const pattern of snsPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return undefined;
};

/**
 * OCR結果から名刺情報を抽出
 */
export const parseBusinessCard = (ocrResult: OcrResult): BusinessCard => {
  const { fullText, lines } = ocrResult;

  return {
    name: extractName(lines),
    company: extractCompany(lines) || '',
    department: extractDepartment(lines),
    position: extractPosition(lines),
    phone: extractPhone(lines),
    fax: extractFax(lines),
    email: extractEmail(fullText),
    address: extractAddress(lines),
    postalCode: extractPostalCode(fullText),
    url: extractUrl(fullText),
    sns: extractSns(fullText),
    scannedAt: new Date().toISOString(),
    rawText: fullText,
  };
};

/**
 * 名刺のハッシュ値を生成（重複チェック用）
 */
export const generateCardHash = (card: BusinessCard): string => {
  const key = `${card.name}-${card.company}-${card.email || ''}-${card.phone || ''}`;
  return btoa(encodeURIComponent(key)); // Base64エンコード
};

/**
 * AI（OpenAI GPT-4o-mini）を使用して名刺情報を抽出
 * ルールベースの抽出よりも高精度に、部署名と人名を正確に区別できる
 *
 * @param ocrResult OCR結果
 * @returns Promise<BusinessCard> 抽出された名刺情報
 */
export const parseBusinessCardWithAI = async (
  ocrResult: OcrResult
): Promise<BusinessCard> => {
  const { fullText } = ocrResult;

  try {
    // OpenAI APIで名刺情報を抽出
    const extracted = await extractBusinessCardWithAI(fullText);

    // BusinessCard型に変換
    const card = convertToBusinessCard(extracted, fullText);

    return card;
  } catch (error) {
    console.warn('AI抽出に失敗、ルールベース抽出にフォールバック:', error);
    // エラー時はルールベースの抽出にフォールバック
    return parseBusinessCard(ocrResult);
  }
};
