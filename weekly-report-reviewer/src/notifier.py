"""
通知モジュール（macOS通知センター）
"""
import subprocess
import logging
from typing import Dict

logger = logging.getLogger(__name__)


class DesktopNotifier:
    """macOS通知センターへの通知クラス"""

    @staticmethod
    def notify(title: str, message: str, subtitle: str = "") -> bool:
        """
        デスクトップ通知を送信

        Args:
            title: 通知タイトル
            message: 通知メッセージ
            subtitle: サブタイトル（オプション）

        Returns:
            成功したらTrue
        """
        try:
            # osascriptでmacOS通知を送信
            script = f'''
                display notification "{message}" with title "{title}" subtitle "{subtitle}"
            '''

            subprocess.run(
                ["osascript", "-e", script],
                check=True,
                capture_output=True,
                text=True
            )

            logger.info(f"通知を送信しました: {title}")
            return True

        except Exception as e:
            logger.error(f"通知の送信エラー: {e}")
            return False

    @staticmethod
    def notify_daily_reminder(analysis_result: Dict) -> bool:
        """平日用の簡易リマインド通知"""
        title = "📝 週報AIチェック"
        message = analysis_result.get("message", "リマインドを確認してください")[:100]
        subtitle = analysis_result.get("todo_status", "")

        return DesktopNotifier.notify(title, message, subtitle)

    @staticmethod
    def notify_weekend_review(analysis_result: Dict) -> bool:
        """週末用の詳細評価通知"""
        title = "📊 週報AI評価完了"
        score = analysis_result.get("goal_achievement_score", 0)
        task_rate = analysis_result.get("task_completion_rate", 0)

        message = f"目標達成度: {score}点 | タスク完了率: {task_rate}%"
        subtitle = "詳細は週報ファイルを確認してください"

        return DesktopNotifier.notify(title, message, subtitle)

    @staticmethod
    def notify_error(error_message: str) -> bool:
        """エラー通知"""
        title = "⚠️ 週報AIレビュー エラー"
        message = error_message[:100]

        return DesktopNotifier.notify(title, message)
