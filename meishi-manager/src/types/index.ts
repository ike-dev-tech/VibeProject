// 名刺データの型定義
export interface BusinessCard {
  id: string;              // UUID
  name: string;            // 氏名
  nameKana: string;        // 氏名（カナ）
  company: string;         // 会社名
  department: string;      // 部署名
  position: string;        // 役職
  phone: string;           // 電話番号
  fax: string;             // FAX
  email: string;           // メールアドレス
  address: string;         // 住所
  postalCode: string;      // 郵便番号
  url: string;             // URL
  tags: string[];          // タグ
  rawText: string;         // OCR生テキスト
  imageUrl?: string;       // 名刺画像URL（オプション）
  scannedBy?: string;      // スキャン者（オプション）
  scannedAt: string;       // スキャン日時（ISO 8601形式）
  updatedAt: string;       // 更新日時（ISO 8601形式）
}

// 名刺作成用の型（IDや日時は自動生成される）
export type CreateBusinessCard = Omit<BusinessCard, 'id' | 'scannedAt' | 'updatedAt'>;

// 名刺更新用の型（一部フィールドのみ）
export type UpdateBusinessCard = Partial<Omit<BusinessCard, 'id' | 'scannedAt'>>;

// OCR結果の型
export interface OCRResult {
  text: string;            // 抽出されたテキスト
  confidence: number;      // 信頼度（0-1）
}

// AI抽出結果の型
export interface ExtractedData {
  name?: string;
  nameKana?: string;
  company?: string;
  department?: string;
  position?: string;
  phone?: string;
  fax?: string;
  email?: string;
  address?: string;
  postalCode?: string;
  url?: string;
}

// カメラの状態
export type CameraStatus = 'idle' | 'active' | 'capturing' | 'error';

// トースト通知の型
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}
