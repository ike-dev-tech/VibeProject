# 📇 名刺スキャナー PWA

スマホカメラで名刺を自動スキャンし、Googleスプレッドシートに情報を保存するPWAアプリです。

## 🌟 主要機能

- ✅ カメラプレビュー（背面カメラ優先）
- ✅ 自動名刺検出（撮影ボタン不要、連続スキャン対応）
- ✅ OCRテキスト抽出（Google Cloud Vision API）
- ✅ 名刺情報パース（氏名、会社名、役職、部署、電話、FAX、メール、住所、URL、SNS）
- ✅ スプレッドシートへの自動保存
- ✅ 重複防止機能
- ✅ PWA対応（ホーム画面に追加可能）

## 🛠 技術スタック

- **フロントエンド**: React + TypeScript + Vite
- **OCR**: Google Cloud Vision API
- **データ保存**: Google Apps Script → Googleスプレッドシート
- **開発環境**: ローカルHTTPS（カメラアクセスに必須）

## 📋 セットアップ手順

### 1. Google Cloud Vision APIの設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成
3. 「APIとサービス」→「ライブラリ」→「Cloud Vision API」を有効化
4. 「認証情報」→「認証情報を作成」→「APIキー」
5. APIキーに制限を設定（HTTPリファラー制限推奨）

### 2. Google Apps Scriptの設定

1. 新しいGoogleスプレッドシートを作成
2. 「拡張機能」→「Apps Script」を開く
3. `gas/Code.gs` の内容をコピーして貼り付け
4. 「デプロイ」→「新しいデプロイ」→「ウェブアプリ」を選択
5. 以下の設定を行う：
   - 次のユーザーとして実行: 自分
   - アクセスできるユーザー: 全員
6. デプロイURLをコピー

### 3. 環境変数の設定

`.env.local` ファイルを編集し、以下を設定：

```env
VITE_VISION_API_KEY=your_vision_api_key_here
VITE_GAS_WEB_APP_URL=your_gas_web_app_url_here
```

### 4. 依存関係のインストール

```bash
npm install
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `https://localhost:5173` にアクセスしてください。

**注意**: カメラアクセスにはHTTPS環境が必須です。ブラウザで自己証明書の警告が表示された場合は、「詳細設定」→「続行」を選択してください。

## 🚀 デプロイ

本番環境へのデプロイ方法については、[DEPLOY.md](./DEPLOY.md) を参照してください。

### 推奨デプロイ先

- **Vercel** (推奨): GitHubと連携で自動デプロイ、HTTPS自動対応
- **Netlify**: 同等の機能、ドラッグ&ドロップ対応
- **Cloudflare Pages**: 高速、無料枠が大きい

詳細な手順は [DEPLOY.md](./DEPLOY.md) を確認してください。

## 📱 使い方

1. アプリを開くとカメラが起動します
2. 名刺をスキャン枠内に合わせてください
3. 自動的に名刺を検出し、OCR処理を開始します
4. 読み取った情報が画面に表示され、Googleスプレッドシートに自動保存されます
5. 同じ名刺を続けてスキャンしても、重複登録されません

## 🔧 スプレッドシートのカラム構成

| ID | 氏名 | 氏名(カナ) | 会社名 | 部署名 | 役職 | 電話番号 | FAX | メール | 住所 | 郵便番号 | URL | SNS | スキャン日時 | 生テキスト |
|----|------|-----------|--------|--------|------|----------|-----|--------|------|----------|-----|-----|--------------|-----------|

## 📊 ディレクトリ構造

```
business-card-scanner/
├── public/
│   ├── manifest.json       # PWAマニフェスト
│   ├── sw.js              # Service Worker
│   └── icons/             # アイコン
├── src/
│   ├── components/
│   │   ├── camera/
│   │   │   ├── CameraPreview.tsx    # カメラプレビュー
│   │   │   └── ScanOverlay.tsx      # スキャン枠
│   │   └── result/
│   │       └── ScanResult.tsx       # 読み取り結果表示
│   ├── hooks/
│   │   ├── useCamera.ts             # カメラ管理
│   │   └── useBusinessCardDetector.ts # 自動認識ロジック
│   ├── services/
│   │   ├── visionService.ts         # Vision API連携
│   │   └── gasService.ts            # GAS連携
│   ├── utils/
│   │   └── textParser.ts            # 名刺情報パーサー
│   ├── types/
│   │   └── businessCard.ts          # 型定義
│   ├── App.tsx
│   └── main.tsx
├── gas/
│   └── Code.gs              # GASコード
└── .env.local              # 環境変数
```

## ⚠️ 注意事項

- **APIキー管理**: `.env.local` はGitにコミットしないでください（`.gitignore`に追加済み）
- **Vision API料金**: 月1,000回まで無料、超過に注意
- **HTTPS必須**: カメラアクセスにはHTTPS環境が必要
- **iOS Safari**: ユーザージェスチャー後にカメラ起動が必要な場合があります

## 🐛 トラブルシューティング

### カメラが起動しない

- ブラウザのカメラ権限を確認
- HTTPSで接続されているか確認
- 他のアプリがカメラを使用していないか確認

### OCRが動作しない

- Vision API キーが正しく設定されているか確認
- API制限に達していないか確認
- ブラウザのコンソールでエラーを確認

### スプレッドシートに保存されない

- GAS Web App URLが正しく設定されているか確認
- GASのデプロイ設定で「全員」にアクセス権限が設定されているか確認

## 📄 ライセンス

MIT

## 🤝 貢献

プルリクエスト歓迎！
