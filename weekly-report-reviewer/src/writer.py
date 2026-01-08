"""
週報ファイルへの書き込みモジュール
"""
import re
import shutil
import logging
from pathlib import Path
from typing import Dict
from datetime import datetime

logger = logging.getLogger(__name__)


class MarkdownWriter:
    """Markdown週報ファイルへの書き込みクラス"""

    @staticmethod
    def update_ai_summary(file_path: str, analysis_result: Dict, is_weekend: bool = False) -> bool:
        """
        AIサマリセクションを更新（新旧テンプレート対応）

        Args:
            file_path: 週報ファイルのパス
            analysis_result: analyzer.pyからの分析結果
            is_weekend: 週末モード（詳細評価）かどうか

        Returns:
            成功したらTrue
        """
        try:
            # バックアップを作成
            MarkdownWriter._create_backup(file_path)

            # ファイルを読み込み
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            # 新しいセクション内容を生成
            new_summary = MarkdownWriter._format_summary(analysis_result, is_weekend, content)

            # テンプレートバージョンを判定
            is_v2 = "## AIサマリ" in content
            section_header = "## AIサマリ" if is_v2 else "■AIからの総括（振り返り）"

            # セクションを置換
            updated_content = MarkdownWriter._replace_section(
                content,
                section_header,
                new_summary
            )

            # ファイルに書き込み
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(updated_content)

            logger.info(f"週報を更新しました: {file_path}")
            return True

        except Exception as e:
            logger.error(f"週報の書き込みエラー: {e}")
            return False

    @staticmethod
    def _format_summary(result: Dict, is_weekend: bool, content: str) -> str:
        """分析結果をMarkdown形式にフォーマット（新旧テンプレート対応）"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        is_v2 = "## AIサマリ" in content

        if is_weekend:
            suggestions = result.get("next_week_suggestions", [])
            suggestions_text = "\n".join([f"  - {s}" for s in suggestions])

            # 新テンプレート（v2）用
            if is_v2:
                return f"""**[{timestamp} AI週次評価]**

📊 **フォーカス達成度**: {result.get('focus_achievement_score', 0)}/100点

**気分の傾向**
{result.get('mood_trend', '分析なし')}

**振り返りの洞察**
{result.get('reflection_insights', '分析なし')}

**KPTフィードバック**
{result.get('kpt_feedback', '分析なし')}

**総合評価**
{result.get('overall_summary', '評価なし')}

**来週へのサジェスト**
{suggestions_text}"""
            # 旧テンプレート（v1）用
            else:
                return f"""**[{timestamp} AI評価]**

📊 **目標達成度**: {result.get('goal_achievement_score', 0)}/100点
✅ **タスク完了率**: {result.get('task_completion_rate', 0)}%

**Good/Badパターン分析**
{result.get('good_bad_analysis', '分析なし')}

**年度目標との整合性**
{result.get('annual_goal_alignment', '分析なし')}

**総合評価**
{result.get('overall_summary', '評価なし')}

**来週へのサジェスト**
{suggestions_text}"""
        else:
            # 平日の簡易リマインド
            mood_comment = result.get('mood_comment', '')
            mood_line = f"\n😊 {mood_comment}" if mood_comment else ""

            return f"""**[{timestamp} AI簡易チェック]**

{result.get('message', 'リマインドなし')}{mood_line}"""

    @staticmethod
    def _replace_section(content: str, section_header: str, new_content: str) -> str:
        """
        セクションの内容を置換

        Args:
            content: 元のMarkdown全体
            section_header: セクションヘッダー（例: "■AIからの総括（振り返り）"）
            new_content: 新しいセクション内容

        Returns:
            更新されたMarkdown
        """
        # セクションヘッダーから次の■またはファイル末尾までを置換
        pattern = rf"({re.escape(section_header)})\n(.*?)(?=\n■|\n---|\Z)"

        def replacer(match):
            return f"{match.group(1)}\n{new_content}\n"

        updated = re.sub(pattern, replacer, content, flags=re.DOTALL)

        # もし置換されなかった場合（セクションが存在しない）、セクションを追加
        if updated == content:
            logger.warning(f"セクション '{section_header}' が見つかりませんでした。末尾に追加します。")
            updated = content + f"\n\n{section_header}\n{new_content}\n"

        return updated

    @staticmethod
    def update_prev_week_section(file_path: str, prev_week_kpt: Dict) -> bool:
        """
        前週からの引き継ぎセクションを更新（新テンプレートv2のみ）

        Args:
            file_path: 今週の週報ファイルのパス
            prev_week_kpt: 前週のKPT情報 {"keep": str, "problem": str, "try": str}

        Returns:
            成功したらTrue
        """
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            # 新テンプレート（v2）の場合のみ更新
            if "## 前週からの引き継ぎ" not in content:
                logger.info("旧テンプレートのため、前週引き継ぎをスキップします")
                return True

            # 引き継ぎ内容を生成
            prev_content = f"""**前週のProblem（課題）**
{prev_week_kpt.get('problem', 'なし')}

**前週のTry（試したこと）**
{prev_week_kpt.get('try', 'なし')}

→ 今週はどうだった？上記を振り返りに活かそう"""

            # セクションを更新
            updated_content = MarkdownWriter._replace_section(
                content,
                "## 前週からの引き継ぎ",
                prev_content
            )

            with open(file_path, "w", encoding="utf-8") as f:
                f.write(updated_content)

            logger.info("前週からの引き継ぎを更新しました")
            return True

        except Exception as e:
            logger.error(f"前週引き継ぎの更新エラー: {e}")
            return False

    @staticmethod
    def _create_backup(file_path: str) -> None:
        """バックアップファイルを作成"""
        backup_path = f"{file_path}.backup"
        try:
            shutil.copy2(file_path, backup_path)
            logger.info(f"バックアップを作成しました: {backup_path}")
        except Exception as e:
            logger.warning(f"バックアップの作成に失敗: {e}")
