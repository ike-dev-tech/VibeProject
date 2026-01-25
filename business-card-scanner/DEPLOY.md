# デプロイ手順

## 🚀 Vercelへのデプロイ方法

### 前提条件
- GitHubアカウント
- Vercelアカウント（GitHubで無料登録可能）
- Google Cloud Vision APIキー
- Google Apps Script Web App URL

---

## Step 1: GitHubへのプッシュ

現在のコードをGitHubにプッシュします：

```bash
git add .
git commit -m "feat: デプロイ準備完了"
git push origin main
```

---

## Step 2: Vercelアカウントの作成

1. https://vercel.com にアクセス
2. 「Sign Up」をクリック
3. 「Continue with GitHub」を選択してGitHubアカウントで登録

---

## Step 3: プロジェクトのインポート

1. Vercelダッシュボードで「Add New...」→「Project」をクリック
2. GitHubリポジトリ一覧から `VibeProject` を選択
3. 「Import」をクリック

### 設定内容
以下の設定を確認・入力します：

- **Project Name**: `business-card-scanner`（任意）
- **Framework Preset**: `Vite` （自動検出される）
- **Root Directory**: `business-card-scanner`（重要！）
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

---

## Step 4: 環境変数の設定

「Environment Variables」セクションで以下を追加：

### 必須の環境変数

| Key | Value | 説明 |
|-----|-------|------|
| `VITE_VISION_API_KEY` | `AIzaSy...` | Google Cloud Vision API Key |
| `VITE_GAS_WEB_APP_URL` | `https://script.google.com/macros/s/...` | Google Apps Script URL |

**重要**: 環境変数名は必ず `VITE_` プレフィックスを付けてください！

### 環境変数の追加方法
1. 「Environment Variables」セクションまでスクロール
2. 「Key」に変数名を入力（例: `VITE_VISION_API_KEY`）
3. 「Value」に実際の値を入力
4. 「Add」をクリック
5. すべての環境変数を追加

---

## Step 5: デプロイ

1. 設定を確認
2. 「Deploy」ボタンをクリック
3. ビルドが開始され、数分で完了

---

## デプロイ後の確認

### ✅ チェックリスト

1. **アクセス確認**: `https://your-project.vercel.app` にアクセス
2. **HTTPS確認**: URLが `https://` で始まることを確認
3. **カメラ起動**: カメラアイコンをクリックしてカメラが起動することを確認
4. **名刺スキャン**: 実際に名刺をスキャンしてOCR結果が表示されることを確認
5. **データ保存**: Googleスプレッドシートにデータが保存されることを確認

---

## 🔄 継続的デプロイ（CI/CD）

Vercelは自動的にCI/CDを設定します：

- **mainブランチへのプッシュ**: 本番環境に自動デプロイ
- **プルリクエスト**: プレビューURLが自動生成される

### 更新方法
```bash
git add .
git commit -m "feat: 新機能追加"
git push origin main
```

プッシュすると自動的に再デプロイされます！

---

## 🔧 トラブルシューティング

### ビルドエラーが発生する場合

1. **ローカルでビルドテスト**:
   ```bash
   npm run build
   npm run preview
   ```

2. **依存関係の確認**:
   ```bash
   npm install
   ```

3. **ログの確認**: Vercelダッシュボードで「Deployments」→該当のデプロイ→「Build Logs」を確認

### カメラが起動しない場合

- HTTPSでアクセスしているか確認（VercelはデフォルトでHTTPS）
- ブラウザのカメラ許可設定を確認

### 環境変数が反映されない場合

1. 環境変数名が `VITE_` プレフィックスで始まっているか確認
2. Vercelダッシュボードで「Settings」→「Environment Variables」を確認
3. 環境変数を変更した場合は、再デプロイが必要：
   - 「Deployments」→最新のデプロイ→「...」→「Redeploy」

---

## 📊 カスタムドメインの設定（オプション）

独自ドメインを使用する場合：

1. Vercelダッシュボードで「Settings」→「Domains」
2. 「Add Domain」をクリック
3. ドメイン名を入力（例: `card-scanner.your-company.com`）
4. DNSレコードの設定手順に従う
5. SSL証明書が自動的に発行される

---

## 🔐 セキュリティ

### 環境変数の管理
- `.env.local` ファイルは **絶対にGitHubにプッシュしない**
- `.gitignore` に `*.local` が含まれていることを確認済み
- Vercelダッシュボードで環境変数を安全に管理

### APIキーの保護
- フロントエンドで使用するAPIキーには適切な制限を設定：
  - Google Cloud Console → 「認証情報」
  - APIキーの制限で「HTTPリファラー」を設定
  - 許可するURL: `https://*.vercel.app/*`, `https://your-domain.com/*`

---

## 📞 サポート

- Vercelドキュメント: https://vercel.com/docs
- Viteドキュメント: https://vitejs.dev/guide/

---

## 🎉 完了！

これでbusiness-card-scannerが本番環境にデプロイされました！
