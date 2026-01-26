// 名刺情報の型定義
export interface BusinessCard {
  id?: string;
  name: string; // 氏名
  nameKana?: string; // 氏名（カナ）
  company: string; // 会社名
  department?: string; // 部署名
  position?: string; // 役職
  phone?: string; // 電話番号
  fax?: string; // FAX
  email?: string; // メールアドレス
  address?: string; // 住所
  postalCode?: string; // 郵便番号
  url?: string; // URL
  sns?: string; // SNS
  scannedAt: string; // スキャン日時
  rawText?: string; // OCR生テキスト（表面）
  rawTextBack?: string; // OCR生テキスト（裏面）
}

// OCR結果の型定義
export interface OcrResult {
  fullText: string; // 完全なテキスト
  lines: string[]; // 行ごとのテキスト
  confidence?: number; // 信頼度
}

// カメラ設定の型定義
export interface CameraConfig {
  facingMode: 'user' | 'environment';
  width: number;
  height: number;
}

// スキャン状態の型定義
export type ScanStatus = 'idle' | 'detecting' | 'processing' | 'success' | 'error';
