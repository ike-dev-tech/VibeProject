"""
通知モジュール（macOS通知センター & LINE Messaging API）
"""
import subprocess
import logging
from typing import Dict
from linebot.v3.messaging import (
    Configuration,
    ApiClient,
    MessagingApi,
    PushMessageRequest,
    TextMessage
)
from config.settings import settings

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


class LINENotifier:
    """LINE Messaging API通知クラス"""

    @staticmethod
    def notify(message: str) -> bool:
        """
        LINE通知を送信

        Args:
            message: 通知メッセージ

        Returns:
            成功したらTrue
        """
        # トークンまたはユーザーIDが設定されていない場合はスキップ
        if not settings.line_channel_access_token or not settings.line_user_id:
            logger.info("LINE設定が不完全なため、LINE通知をスキップします")
            return True

        try:
            # LINE Messaging API設定
            configuration = Configuration(access_token=settings.line_channel_access_token)

            with ApiClient(configuration) as api_client:
                line_bot_api = MessagingApi(api_client)

                # プッシュメッセージを送信
                line_bot_api.push_message(
                    PushMessageRequest(
                        to=settings.line_user_id,
                        messages=[TextMessage(text=message)]
                    )
                )

            logger.info("LINE通知を送信しました")
            return True

        except Exception as e:
            logger.error(f"LINE通知の送信エラー: {e}")
            return False

    @staticmethod
    def notify_daily_reminder(analysis_result: Dict) -> bool:
        """平日用の簡易リマインド通知"""
        message = f"""📝 週報AIチェック

今週のフォーカス進捗を確認しました。

{analysis_result.get('message', 'リマインドを確認してください')}

週報を更新してください！"""

        mood_comment = analysis_result.get('mood_comment', '')
        if mood_comment:
            message += f"\n\n😊 {mood_comment}"

        return LINENotifier.notify(message)

    @staticmethod
    def notify_weekend_review(analysis_result: Dict) -> bool:
        """週末用の詳細評価通知"""
        # 新テンプレート（v2）の場合
        if 'focus_achievement_score' in analysis_result:
            score = analysis_result.get('focus_achievement_score', 0)
            mood_trend = analysis_result.get('mood_trend', '')
            overall = analysis_result.get('overall_summary', '')
            suggestions = analysis_result.get('next_week_suggestions', [])

            message = f"""📊 週報AI評価完了

🎯 フォーカス達成度: {score}/100点

【総合評価】
{overall}

【来週へのサジェスト】"""

            for i, suggestion in enumerate(suggestions[:3], 1):
                message += f"\n{i}. {suggestion}"

            message += "\n\n詳細は週報ファイルをチェック！"

        # 旧テンプレート（v1）の場合
        else:
            score = analysis_result.get('goal_achievement_score', 0)
            task_rate = analysis_result.get('task_completion_rate', 0)
            overall = analysis_result.get('overall_summary', '')
            suggestions = analysis_result.get('next_week_suggestions', [])

            message = f"""📊 週報AI評価完了

🎯 目標達成度: {score}/100点
✅ タスク完了率: {task_rate}%

【総合評価】
{overall}

【来週へのサジェスト】"""

            for i, suggestion in enumerate(suggestions[:3], 1):
                message += f"\n{i}. {suggestion}"

            message += "\n\n詳細は週報ファイルをチェック！"

        return LINENotifier.notify(message)
