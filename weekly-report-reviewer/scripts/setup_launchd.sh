#!/bin/bash
# launchd設定のインストールスクリプト

PLIST_NAME="com.koike.weekly-review.plist"
PLIST_SRC="$(dirname "$0")/../launchd/$PLIST_NAME"
PLIST_DST="$HOME/Library/LaunchAgents/$PLIST_NAME"

echo "=== 週報AIレビュー launchd設定 ==="

# 既存のジョブをアンロード
if [ -f "$PLIST_DST" ]; then
    echo "既存の設定をアンロードします..."
    launchctl unload "$PLIST_DST" 2>/dev/null
fi

# plistをコピー
echo "設定ファイルをコピーします..."
cp "$PLIST_SRC" "$PLIST_DST"

# ロード
echo "launchdに登録します..."
launchctl load "$PLIST_DST"

echo ""
echo "✅ 設定が完了しました！"
echo ""
echo "📅 毎日21:00に自動実行されます"
echo ""
echo "【便利コマンド】"
echo "  手動実行: launchctl start com.koike.weekly-review"
echo "  停止: launchctl unload $PLIST_DST"
echo "  再登録: launchctl load $PLIST_DST"
echo "  ログ確認: tail -f ~/Desktop/VibeProject/weekly-report-reviewer/logs/weekly_review.log"
echo ""
