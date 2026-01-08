# 📊 Obsidian週報AIレビューシステム

Obsidianで管理している週報を毎日AIが自動確認し、評価とネクストアクションを提示するPythonシステムです。

## ✨ 新テンプレート（v2）について

**2026年1月リリース** - より使いやすく、振り返りが深まる新フォーマット

### 主な改善点
| 項目 | 改善内容 |
|------|---------|
| **デイリーログ** | テーブル形式で毎日1行記録（気分スコア付き） |
| **振り返り** | 4つの質問形式で深い振り返りを誘導 |
| **KPT** | Keep/Problem/Tryのシンプルなフレームワーク |
| **前週引き継ぎ** | AIが前週のTry/Problemを自動挿入 |
| **作業時間** | 毎日1分 + 週末5分の簡単入力 |

**後方互換性**: 旧テンプレート（v1）も引き続き動作します

---

## 🎯 機能

### 平日モード（簡易リマインド）
- **新テンプレート（v2）**:
  - フォーカス目標の進捗確認
  - デイリーログ記録状況チェック
  - 平均気分スコアの分析
  - KPTのTry実行状況確認
- **旧テンプレート（v1）**:
  - 目標とToDoの進捗確認
  - 簡潔なリマインドメッセージ
- デスクトップ通知

### 週末モード（詳細評価）
- **新テンプレート（v2）**:
  - フォーカス達成度スコア（0-100点）
  - 1週間の気分傾向分析
  - 4つの質問振り返りの洞察
  - KPTに対するフィードバック
  - 総合評価コメント
  - 来週の目標サジェスト（3項目）
- **旧テンプレート（v1）**:
  - 目標達成度スコア（0-100点）
  - タスク完了率の計算
  - Good/Badパターン分析
  - 年度目標との整合性チェック
  - 総合評価コメント
  - 来週の目標サジェスト（3項目）

---

## 📁 ディレクトリ構造

```
weekly-report-reviewer/
├── config/
│   └── settings.py          # 環境変数・設定管理
├── src/
│   ├── main.py              # メインエントリーポイント
│   ├── vault_reader.py      # Vault読み込み・パース
│   ├── analyzer.py          # OpenAI API連携・評価
│   ├── writer.py            # 週報への書き込み
│   └── notifier.py          # デスクトップ通知
├── templates/               # テンプレートファイル
│   ├── weekly-template-v2.md  # 新テンプレート
│   └── MIGRATION_GUIDE.md   # 移行ガイド
├── launchd/
│   └── com.koike.weekly-review.plist
├── scripts/
│   └── setup_launchd.sh     # 自動実行設定スクリプト
├── logs/                    # ログ出力ディレクトリ
├── .env                     # 環境変数（要作成）
├── .env.example             # 環境変数テンプレート
├── requirements.txt
└── README.md
```

---

## 🚀 セットアップ

### 1. 依存パッケージのインストール

```bash
cd weekly-report-reviewer
pip install -r requirements.txt
```

### 2. 環境変数の設定

`.env.example`をコピーして`.env`を作成し、以下を設定：

```bash
cp .env.example .env
```

`.env`を編集：

```env
VAULT_PATH=/Users/koikesho/Library/Mobile Documents/iCloud~md~obsidian/Documents/obsidian_icloud/週報
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4o
LOG_LEVEL=INFO
```

### 3. 週報テンプレートの設定

#### 新テンプレート（v2）を使用する場合（推奨）

```bash
# テンプレートをVaultにコピー
cp templates/weekly-template-v2.md \
"/Users/koikesho/Library/Mobile Documents/iCloud~md~obsidian/Documents/obsidian_icloud/週報/2026-W03.md"
```

週番号は `date +%Y-W%V` で確認できます。

#### 旧テンプレート（v1）を継続使用する場合

そのまま使用できます。システムが自動で認識します。

#### 移行ガイド

旧テンプレートから新テンプレートへの移行方法は `templates/MIGRATION_GUIDE.md` を参照してください。

### 4. 手動実行でテスト

```bash
python src/main.py
```

### 5. 自動実行の設定（launchd）

```bash
./scripts/setup_launchd.sh
```

毎日21:00に自動実行されるようになります。

---

## 📝 週報フォーマット

### ファイル名
`2026-W02.md` (ISO週番号形式)

### 新テンプレート（v2）のセクション構成

```markdown
# 2026-W02 週報

## 今週のフォーカス（1つだけ）
> メインで取り組むこと

## デイリーログ
| 日 | やったこと・気づき | 調子 |
|----|------------------|------|
| 月 | ... | 4/5 |

## 振り返り（各1文でOK）
1. **一番の成果は？** →
2. **なぜうまくいった？** →
3. **一番の障害は？** →
4. **どう乗り越える？** →

## KPT
- **Keep（続ける）**: ...
- **Problem（課題）**: ...
- **Try（来週試す）**: ...

## 前週からの引き継ぎ
<!-- AIが自動挿入 -->

## AIサマリ
<!-- AI自動生成 ← ここにAI評価が自動追記 -->

---

## 年度目標（2026）
...
```

### 旧テンプレート（v1）のセクション構成

旧フォーマットも引き続きサポートされています：

- ■今週自分が得たい結果
- ■今週のToDo
- ■今週やったこと ＆ 気づき
- ■今週のGood / Bad
- ■上記の要因分析
- ■AIからの総括（振り返り） ← AI評価が自動追記
- ■来週の目標
- ▼2026年度目標（変動あり）

---

## 🔧 便利コマンド

```bash
# 手動実行
launchctl start com.koike.weekly-review

# 自動実行を停止
launchctl unload ~/Library/LaunchAgents/com.koike.weekly-review.plist

# 自動実行を再開
launchctl load ~/Library/LaunchAgents/com.koike.weekly-review.plist

# ログ確認
tail -f logs/weekly_review.log

# 今週の週番号を確認
date +%Y-W%V
```

---

## 🛠 トラブルシューティング

### 週報ファイルが見つからない
- Vaultパスが正しいか確認: `.env`の`VAULT_PATH`
- ファイル名が `YYYY-Wxx.md` 形式になっているか確認
- iCloudの同期状況を確認

### OpenAI APIエラー
- APIキーが正しいか確認: `.env`の`OPENAI_API_KEY`
- APIクレジットが残っているか確認
- ネットワーク接続を確認

### 通知が表示されない
- システム環境設定 > 通知 で「ターミナル」または「Python」の通知が許可されているか確認

### 前週の引き継ぎが表示されない（新テンプレートv2）
- 前週の週報ファイルが存在するか確認
- 前週のKPTセクションが記入されているか確認
- 新テンプレート（v2）を使用しているか確認（旧テンプレートでは引き継ぎ機能は動作しません）

### テンプレートのバージョンを確認したい
- 新テンプレート（v2）: `## AIサマリ` というセクションがある
- 旧テンプレート（v1）: `■AIからの総括（振り返り）` というセクションがある

---

## 📚 ドキュメント

- [新テンプレート（v2）サンプル](templates/weekly-template-v2.md)
- [移行ガイド](templates/MIGRATION_GUIDE.md)

---

## 📄 ライセンス

MIT License
