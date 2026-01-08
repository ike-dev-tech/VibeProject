"""
OpenAI APIを使用して週報を分析するモジュール
"""
import json
import logging
from datetime import datetime
from typing import Dict
from openai import OpenAI
from config.settings import settings

logger = logging.getLogger(__name__)


class WeeklyReportAnalyzer:
    """週報を分析するクラス"""

    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_model

    def analyze(self, report_summary: Dict, is_weekend: bool = False) -> Dict:
        """
        週報を分析

        Args:
            report_summary: vault_reader.WeeklyReport.get_summary()の返り値
            is_weekend: 週末モード（詳細評価）かどうか

        Returns:
            分析結果のdict
        """
        if is_weekend:
            return self._analyze_detailed(report_summary)
        else:
            return self._analyze_daily(report_summary)

    def _analyze_daily(self, summary: Dict) -> Dict:
        """平日用の簡易分析（新旧テンプレート対応）"""
        system_prompt = """あなたは個人の週次目標達成をサポートするコーチです。
週報の進捗状況を確認し、簡潔なリマインドメッセージを提供してください。

回答はJSON形式で以下を含めてください：
- message: リマインドメッセージ（150字以内）
- mood_comment: 調子に関するコメント（50字以内、ない場合は空文字）"""

        # 新テンプレート（v2）の場合
        if summary.get('focus'):
            daily_log = summary.get('daily_log', {})
            avg_mood = daily_log.get('avg_mood', 0)
            entries_count = len(daily_log.get('entries', []))

            user_prompt = f"""【今週のフォーカス】
{summary.get('focus', '未記入')}

【デイリーログ記録状況】
記録日数: {entries_count}/7日
平均気分スコア: {avg_mood:.1f}/5

【KPT】
Try（今週試すこと）: {summary.get('kpt', {}).get('try', '未記入')}

簡潔なリマインドをお願いします。"""
        # 旧テンプレート（v1）の場合
        else:
            user_prompt = f"""【今週の目標】
{summary.get('desired_results', '未記入')}

【ToDo進捗】
完了: {summary['todo_completed']}/{summary['todo_total']}

【やったこと】
{summary.get('accomplishments', '未記入')}

簡潔なリマインドをお願いします。"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
            )
            result = json.loads(response.choices[0].message.content)
            return result

        except Exception as e:
            logger.error(f"OpenAI API エラー（平日分析）: {e}")
            return {
                "message": "分析エラーが発生しました",
                "mood_comment": ""
            }

    def _analyze_detailed(self, summary: Dict) -> Dict:
        """週末用の詳細分析（新旧テンプレート対応）"""
        system_prompt = """あなたは個人の週次振り返りをサポートする専門家です。
週報の内容を多角的に分析し、建設的なフィードバックを提供してください。

回答はJSON形式で以下を含めてください：
- focus_achievement_score: フォーカス達成度 (0-100の整数)
- mood_trend: 気分の傾向分析（100字程度）
- reflection_insights: 振り返りの洞察（150字程度）
- kpt_feedback: KPTに対するフィードバック（100字程度）
- overall_summary: 総合評価コメント（200字程度）
- next_week_suggestions: 来週の目標サジェスト（配列、3項目、各50字以内）"""

        # 新テンプレート（v2）の場合
        if summary.get('focus'):
            daily_log = summary.get('daily_log', {})
            kpt = summary.get('kpt', {})

            # デイリーログの要約
            daily_entries = daily_log.get('entries', [])
            daily_summary = "\n".join([f"{day}: {content} ({mood}/5)" for day, content, mood in daily_entries])

            user_prompt = f"""【今週のフォーカス】
{summary.get('focus', '未記入')}

【デイリーログ】
{daily_summary if daily_summary else '未記入'}
平均気分スコア: {daily_log.get('avg_mood', 0):.1f}/5

【振り返り（4つの質問）】
{summary.get('reflection', '未記入')}

【KPT】
Keep: {kpt.get('keep', '未記入')}
Problem: {kpt.get('problem', '未記入')}
Try: {kpt.get('try', '未記入')}

【年度目標】
{summary.get('annual_goals', '未記入')}

上記の週報を分析し、JSON形式で出力してください。"""

        # 旧テンプレート（v1）の場合（後方互換性）
        else:
            user_prompt = f"""【今週の目標】
{summary.get('desired_results', '未記入')}

【ToDo状況】
完了: {summary['todo_completed']}/{summary['todo_total']}
{chr(10).join(summary.get('todo_list', []))}

【やったこと】
{summary.get('accomplishments', '未記入')}

【Good/Bad】
{summary.get('good_bad', '未記入')}

【要因分析】
{summary.get('analysis', '未記入')}

【年度目標】
{summary.get('annual_goals', '未記入')}

上記の週報を分析し、JSON形式で出力してください。"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
            )
            result = json.loads(response.choices[0].message.content)
            return result

        except Exception as e:
            logger.error(f"OpenAI API エラー（週末分析）: {e}")
            return {
                "focus_achievement_score": 0,
                "mood_trend": "分析エラーが発生しました",
                "reflection_insights": "分析エラーが発生しました",
                "kpt_feedback": "分析エラーが発生しました",
                "overall_summary": f"分析エラー: {str(e)}",
                "next_week_suggestions": ["エラーにより生成できませんでした"]
            }

    @staticmethod
    def is_weekend() -> bool:
        """今日が週末（金曜・土曜・日曜）かどうかを判定"""
        weekday = datetime.now().weekday()
        # 金曜(4)、土曜(5)、日曜(6)
        return weekday >= 4
