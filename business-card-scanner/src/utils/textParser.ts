import type { BusinessCard, OcrResult } from '../types/businessCard';

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

  // 除外すべき行のパターン
  const shouldSkipLine = (line: string): boolean => {
    const trimmed = line.trim();
    // 会社名キーワードを含む
    if (extractCompany([trimmed])) return true;
    // 役職キーワードを含む
    if (extractPosition([trimmed])) return true;
    // カタカナのみの長い文字列
    if (katakanaOnlyPattern.test(trimmed)) return true;
    // メールアドレスや電話番号を含む
    if (trimmed.includes('@') || /^\d{2,}/.test(trimmed)) return true;
    return false;
  };

  // 名前らしい行を探す（最大5行まで）
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i].trim();

    if (shouldSkipLine(line)) {
      continue;
    }

    // 日本人名パターンにマッチするか
    if (japaneseNamePattern.test(line)) {
      return line;
    }

    // 上記に該当しない最初の行を名前候補とする
    if (!shouldSkipLine(line)) {
      return line;
    }
  }

  // 見つからなければ最初の行を返す
  return lines[0].trim();
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
