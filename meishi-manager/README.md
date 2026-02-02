# 📇 名刺管理アプリ (meishi-manager)

Sansanに似たチーム向け名刺管理PWAアプリです。スマートフォンのカメラで名刺をスキャンし、チームで名刺データを共有・検索できます。

## 🌟 主要機能

### MVP機能（Phase 1-3）
- ✅ スマホカメラで名刺スキャン
- ✅ OCRによるテキスト抽出（Google Cloud Vision API）
- ✅ AI情報抽出（OpenAI GPT-4o-mini）
- ✅ 名刺一覧表示
- ✅ 検索・フィルタリング機能
- ✅ タグ付け機能
- ✅ PWA対応（ホーム画面に追加可能）
- ✅ Googleスプレッドシートに自動保存

### 将来実装予定
- ⏳ 重複検出・マージ機能
- ⏳ エクスポート機能（CSV, vCard）
- ⏳ プッシュ通知
- ⏳ 画像の保存・表示
- ⏳ 裏面スキャン対応

## 🛠 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | React 18 + TypeScript + Vite |
| スタイリング | Tailwind CSS |
| 状態管理 | Zustand |
| ルーティング | React Router v6 |
| OCR | Google Cloud Vision API |
| AI情報抽出 | OpenAI API (GPT-4o-mini) |
| データ保存 | Googleスプレッドシート + GAS |
| PWA | Vite PWA Plugin |
| デプロイ | Vercel |

## 📋 セットアップ手順

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd meishi-manager
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. Google Cloud Vision APIの設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成
3. 「APIとサービス」→「ライブラリ」→「Cloud Vision API」を有効化
4. 「認証情報」→「認証情報を作成」→「APIキー」
5. APIキーに制限を設定（HTTPリファラー制限推奨）

### 4. OpenAI APIの設定

1. [OpenAI Platform](https://platform.openai.com/api-keys) にアクセス
2. アカウントを作成またはログイン
3. 「API keys」→「Create new secret key」
4. APIキーをコピー
5. 使用量制限の設定を推奨

### 5. Google Apps Scriptの設定

1. 新しいGoogleスプレッドシートを作成
2. 「拡張機能」→「Apps Script」を開く
3. `gas/Code.gs` の内容をコピーして貼り付け
4. 「デプロイ」→「新しいデプロイ」→「ウェブアプリ」を選択
5. 以下の設定を行う：
   - 次のユーザーとして実行: 自分
   - アクセスできるユーザー: 全員
6. デプロイURLをコピー

### 6. 環境変数の設定

`.env.local` ファイルを作成し、以下を設定：

```env
# Google Cloud Vision API Key
VITE_VISION_API_KEY=your_vision_api_key_here

# Google Apps Script Web App URL
VITE_GAS_WEB_APP_URL=your_gas_web_app_url_here

# OpenAI API Key
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

### 7. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `https://localhost:5173` にアクセスしてください。

**注意**: カメラアクセスにはHTTPS環境が必須です。ブラウザで自己証明書の警告が表示された場合は、「詳細設定」→「続行」を選択してください。

## 📱 使い方

1. **カメラ画面**: アプリを開くとカメラが起動します
2. **名刺をスキャン**: 名刺をカメラで撮影
3. **自動処理**: OCR→AI抽出→スプレッドシート保存
4. **名刺一覧**: 保存した名刺を一覧表示
5. **検索**: 名前、会社名、役職などで検索
6. **タグ付け**: タグで分類・フィルタリング

## 📱 PWA機能

このアプリは Progressive Web App (PWA) として動作し、以下の機能を提供します：

### ホーム画面に追加

**iOS (Safari)**:
1. 共有ボタン（↑アイコン）をタップ
2. 「ホーム画面に追加」を選択
3. アプリ名を確認して「追加」

**Android (Chrome)**:
1. メニュー（⋮）をタップ
2. 「ホーム画面に追加」を選択
3. アプリ名を確認して「追加」

### オフライン対応

- Service Workerによるキャッシュ機能
- オフライン時でも保存済みデータの閲覧可能
- ネットワーク復帰時に自動同期

### 機能一覧

- ✅ アプリライクなスタンドアロン表示
- ✅ ホーム画面アイコン（192x192、512x512）
- ✅ Service Workerによるキャッシュ戦略
- ✅ Network First戦略（Google APIs、OpenAI API、GAS API）
- ✅ オフラインインジケーター
- ✅ インストールプロンプト

## 🧪 テスト

### ユニットテスト

```bash
# テスト実行
npm test

# ウォッチモード
npm run test:watch

# UIでテスト結果を表示
npm run test:ui

# カバレッジ付きテスト
npm run test:coverage
```

**テスト統計**:
- 全207テスト実装済み
- コンポーネントテスト、フックテスト、サービステスト、ユーティリティテストをカバー
- PWA機能（InstallPrompt、OfflineIndicator）のテストも含む

### E2Eテスト（Playwright）

```bash
# Playwrightのインストール
npx playwright install

# E2Eテスト実行
npx playwright test

# UIモードで実行
npx playwright test --ui
```

テスト対象：
- 各画面の表示とナビゲーション
- カメラ機能
- 名刺の登録・編集・削除
- 検索・フィルタリング
- PWA機能（Service Worker、Manifest、キャッシュ）

## 📊 データ構造

| フィールド | 説明 |
|-----------|------|
| id | UUID（自動生成） |
| name | 氏名 |
| nameKana | 氏名（カナ） |
| company | 会社名 |
| department | 部署名 |
| position | 役職 |
| phone | 電話番号 |
| fax | FAX |
| email | メールアドレス |
| address | 住所 |
| postalCode | 郵便番号 |
| url | URL |
| tags | タグ（配列） |
| rawText | OCR生テキスト |
| imageUrl | 名刺画像URL（オプション） |
| scannedBy | スキャン者（オプション） |
| scannedAt | スキャン日時 |
| updatedAt | 更新日時 |

## 🚀 デプロイ

### Vercelへのデプロイ

#### 方法1: Vercel CLI（推奨）

```bash
# Vercel CLIのインストール
npm install -g vercel

# プロジェクトディレクトリでデプロイ
vercel

# 本番環境へデプロイ
vercel --prod
```

初回デプロイ時に以下の環境変数を設定します：

```bash
vercel env add VITE_VISION_API_KEY
vercel env add VITE_OPENAI_API_KEY
vercel env add VITE_GAS_WEB_APP_URL
```

#### 方法2: GitHub連携

1. [Vercel](https://vercel.com/)にログイン
2. 「Add New Project」をクリック
3. GitHubリポジトリを選択
4. 環境変数を設定：
   - `VITE_VISION_API_KEY`: Google Vision APIキー
   - `VITE_OPENAI_API_KEY`: OpenAI APIキー
   - `VITE_GAS_WEB_APP_URL`: Google Apps Script URL
5. 「Deploy」をクリック

**注意**:
- 環境変数は Production、Preview、Development の各環境で設定可能
- デプロイ後、HTTPS環境でカメラアクセスが正常に動作することを確認
- PWA機能（ホーム画面に追加、オフライン対応）も動作確認推奨

### ビルドコマンド

```bash
# 本番ビルド
npm run build

# プレビュー
npm run preview
```

## ⚠️ 注意事項

- **APIキー管理**: `.env.local` はGitにコミットしないでください
- **Vision API料金**: 月1,000回まで無料、超過に注意
- **OpenAI API料金**: GPT-4o-miniで約0.1-0.2円/枚
- **HTTPS必須**: カメラアクセスにはHTTPS環境が必要
- **チーム共有**: 同じスプレッドシートを共有することでチーム利用可能

## 🔧 開発状況

### Phase 1: プロジェクト基盤 ✅
- ✅ Step 1: プロジェクトセットアップ
- ✅ Step 2: 基本レイアウト
- ✅ Step 3: GAS連携基盤

### Phase 2: スキャン機能 ✅
- ✅ Step 4: カメラ機能
- ✅ Step 5: OCR・AI抽出
- ✅ Step 6: スキャンフロー統合

### Phase 3: 名刺管理機能 ✅
- ✅ Step 7: 名刺一覧
- ✅ Step 8: 名刺詳細・編集
- ✅ Step 9: 検索・タグ機能

### Phase 4: 仕上げ ✅
- ✅ Step 10: UI/UX改善
- ✅ Step 11: PWA最適化
- ✅ Step 12: デプロイ・テスト

**全207個のテストがパス済み！**

## 📄 ライセンス

MIT

## 🤝 貢献

プルリクエスト歓迎！
