"""
Obsidian Vaultから週報を読み込むモジュール
"""
import os
import re
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, List, Tuple


class WeeklyReport:
    """週報データクラス"""

    def __init__(self, file_path: str, content: str):
        self.file_path = file_path
        self.content = content
        self.sections = self._parse_sections(content)
        self.todos = self._parse_todos()

    def _parse_sections(self, content: str) -> Dict[str, str]:
        """セクションごとにパース（新旧テンプレート両対応）"""
        sections = {}

        # 新テンプレート（v2）のセクション定義
        v2_patterns = [
            ("focus", r"## 今週のフォーカス.*?\n>(.*?)(?=\n##|\Z)"),
            ("daily_log", r"## デイリーログ\n(.*?)(?=\n##|\Z)"),
            ("reflection", r"## 振り返り.*?\n(.*?)(?=\n##|\Z)"),
            ("kpt", r"## KPT\n(.*?)(?=\n##|\Z)"),
            ("prev_week", r"## 前週からの引き継ぎ\n(.*?)(?=\n##|\Z)"),
            ("ai_summary", r"## AIサマリ\n(.*?)(?=\n##|---|\Z)"),
            ("annual_goals", r"## 年度目標.*?\n(.*?)(?=\n##|\Z)"),
        ]

        # 旧テンプレート（v1）のセクション定義（後方互換性）
        v1_patterns = [
            ("desired_results", r"■今週自分が得たい結果\n(.*?)(?=\n■|\Z)"),
            ("todos", r"■今週のToDo\n(.*?)(?=\n■|\Z)"),
            ("accomplishments", r"■今週やったこと ＆ 気づき\n(.*?)(?=\n■|\Z)"),
            ("good_bad", r"■今週のGood / Bad\n(.*?)(?=\n■|\Z)"),
            ("analysis", r"■上記の要因分析\n(.*?)(?=\n■|\Z)"),
            ("ai_summary_v1", r"■AIからの総括（振り返り）\n(.*?)(?=\n■|\Z)"),
            ("next_week_goals", r"■来週の目標\n(.*?)(?=\n■|\Z)"),
            ("annual_goals_v1", r"▼2026年度目標（変動あり）\n(.*?)(?=\n▼|\Z)"),
        ]

        # 新テンプレートを優先的にパース
        for key, pattern in v2_patterns:
            match = re.search(pattern, content, re.DOTALL)
            if match:
                sections[key] = match.group(1).strip()

        # 旧テンプレートも試す（後方互換性）
        for key, pattern in v1_patterns:
            match = re.search(pattern, content, re.DOTALL)
            if match:
                sections[key] = match.group(1).strip()

        # 旧テンプレートのai_summaryがあれば新キーに統合
        if "ai_summary_v1" in sections and "ai_summary" not in sections:
            sections["ai_summary"] = sections["ai_summary_v1"]

        # 旧テンプレートのannual_goalsがあれば新キーに統合
        if "annual_goals_v1" in sections and "annual_goals" not in sections:
            sections["annual_goals"] = sections["annual_goals_v1"]

        return sections

    def _parse_todos(self) -> Tuple[int, int, List[str]]:
        """
        ToDoをパースして完了数/総数を返す

        Returns:
            (完了数, 総数, ToDoリスト)
        """
        todo_section = self.sections.get("todos", "")
        lines = todo_section.split("\n")

        todos = []
        completed = 0
        total = 0

        for line in lines:
            # チェックボックス形式を検出
            if re.match(r"^- \[[ x]\]", line):
                total += 1
                todos.append(line)
                if "[x]" in line or "[X]" in line:
                    completed += 1

        return completed, total, todos

    def _parse_daily_log(self) -> Dict:
        """
        デイリーログをパース

        Returns:
            {
                "entries": [(day, content, mood), ...],
                "avg_mood": 平均気分スコア
            }
        """
        daily_log_section = self.sections.get("daily_log", "")
        entries = []
        mood_scores = []

        # テーブル形式をパース
        lines = daily_log_section.split("\n")
        for line in lines:
            # | 月 | やったこと | 3/5 | の形式を検出
            match = re.match(r"\|\s*([月火水木金土日])\s*\|\s*(.*?)\s*\|\s*(\d+)/5\s*\|", line)
            if match:
                day, content, mood = match.groups()
                entries.append((day, content.strip(), int(mood)))
                mood_scores.append(int(mood))

        avg_mood = sum(mood_scores) / len(mood_scores) if mood_scores else 0

        return {
            "entries": entries,
            "avg_mood": avg_mood
        }

    def _parse_kpt(self) -> Dict:
        """
        KPTセクションをパース

        Returns:
            {
                "keep": str,
                "problem": str,
                "try": str
            }
        """
        kpt_section = self.sections.get("kpt", "")

        keep = ""
        problem = ""
        try_item = ""

        # Keep/Problem/Tryを抽出
        keep_match = re.search(r"-\s*\*\*Keep[（(]続ける[)）]\*\*:\s*(.*?)(?=\n-|\Z)", kpt_section, re.DOTALL)
        problem_match = re.search(r"-\s*\*\*Problem[（(]課題[)）]\*\*:\s*(.*?)(?=\n-|\Z)", kpt_section, re.DOTALL)
        try_match = re.search(r"-\s*\*\*Try[（(]来週試す[)）]\*\*:\s*(.*?)(?=\n-|\Z)", kpt_section, re.DOTALL)

        if keep_match:
            keep = keep_match.group(1).strip()
        if problem_match:
            problem = problem_match.group(1).strip()
        if try_match:
            try_item = try_match.group(1).strip()

        return {
            "keep": keep,
            "problem": problem,
            "try": try_item
        }

    def get_summary(self) -> Dict:
        """要約情報を取得（新旧テンプレート対応）"""
        completed, total, todos = self.todos
        daily_log = self._parse_daily_log()
        kpt = self._parse_kpt()

        # 新テンプレート項目
        summary = {
            "file_path": self.file_path,
            "focus": self.sections.get("focus", ""),
            "daily_log": daily_log,
            "reflection": self.sections.get("reflection", ""),
            "kpt": kpt,
            "prev_week": self.sections.get("prev_week", ""),
            "ai_summary": self.sections.get("ai_summary", ""),
            "annual_goals": self.sections.get("annual_goals", ""),
        }

        # 旧テンプレート項目（後方互換性）
        summary.update({
            "desired_results": self.sections.get("desired_results", ""),
            "accomplishments": self.sections.get("accomplishments", ""),
            "good_bad": self.sections.get("good_bad", ""),
            "analysis": self.sections.get("analysis", ""),
            "next_week_goals": self.sections.get("next_week_goals", ""),
            "todo_completed": completed,
            "todo_total": total,
            "todo_list": todos,
        })

        return summary


class VaultReader:
    """Obsidian Vaultから週報を読み込むクラス"""

    def __init__(self, vault_path: str):
        self.vault_path = Path(vault_path)

        if not self.vault_path.exists():
            raise ValueError(f"Vaultパスが存在しません: {vault_path}")

    def get_current_week_file(self) -> Optional[str]:
        """
        今週の週報ファイルパスを取得

        ファイル形式: 2026-W02.md (ISO週番号形式)
        """
        # 今週のISO週番号を取得
        now = datetime.now()
        iso_year, iso_week, _ = now.isocalendar()
        filename = f"{iso_year}-W{iso_week:02d}.md"

        file_path = self.vault_path / filename

        if file_path.exists():
            return str(file_path)
        else:
            return None

    def get_previous_week_file(self) -> Optional[str]:
        """
        前週の週報ファイルパスを取得

        Returns:
            前週のファイルパス、またはNone
        """
        from datetime import timedelta

        # 前週のISO週番号を取得
        last_week = datetime.now() - timedelta(days=7)
        iso_year, iso_week, _ = last_week.isocalendar()
        filename = f"{iso_year}-W{iso_week:02d}.md"

        file_path = self.vault_path / filename

        if file_path.exists():
            return str(file_path)
        else:
            return None

    def read_weekly_report(self, file_path: Optional[str] = None) -> Optional[WeeklyReport]:
        """
        週報を読み込む

        Args:
            file_path: ファイルパス（Noneの場合は今週のファイルを自動取得）

        Returns:
            WeeklyReportオブジェクト、またはNone
        """
        if file_path is None:
            file_path = self.get_current_week_file()

        if file_path is None:
            return None

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            return WeeklyReport(file_path, content)

        except Exception as e:
            print(f"週報の読み込みエラー: {e}")
            return None

    def read_previous_week_report(self) -> Optional[WeeklyReport]:
        """
        前週の週報を読み込む

        Returns:
            前週のWeeklyReportオブジェクト、またはNone
        """
        prev_file = self.get_previous_week_file()
        if prev_file is None:
            return None

        return self.read_weekly_report(prev_file)
