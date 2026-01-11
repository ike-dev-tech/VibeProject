"""
週報AIレビューシステム メインモジュール
"""
import sys
import logging
from pathlib import Path

# プロジェクトルートをパスに追加
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from config.settings import settings
from src.vault_reader import VaultReader
from src.analyzer import WeeklyReportAnalyzer
from src.writer import MarkdownWriter
from src.notifier import DesktopNotifier, LINENotifier


def setup_logging():
    """ロギング設定"""
    log_dir = project_root / "logs"
    log_dir.mkdir(exist_ok=True)

    log_file = log_dir / "weekly_review.log"

    logging.basicConfig(
        level=getattr(logging, settings.log_level),
        format="%(asctime)s - %(levelname)s - %(message)s",
        handlers=[
            logging.FileHandler(log_file, encoding="utf-8"),
            logging.StreamHandler()
        ]
    )


def validate_settings():
    """設定のバリデーション"""
    if not settings.vault_path:
        raise ValueError("環境変数 VAULT_PATH が設定されていません")

    if not settings.openai_api_key:
        raise ValueError("環境変数 OPENAI_API_KEY が設定されていません")

    if not Path(settings.vault_path).exists():
        raise ValueError(f"Vaultパスが存在しません: {settings.vault_path}")


def main():
    """メイン処理"""
    logger = logging.getLogger(__name__)
    logger.info("=== 週報AIレビュー 開始 ===")

    try:
        # 1. 設定バリデーション
        validate_settings()
        logger.info(f"Vaultパス: {settings.vault_path}")

        # 2. 週報を読み込み
        reader = VaultReader(settings.vault_path)
        report = reader.read_weekly_report()

        if report is None:
            logger.warning("今週の週報ファイルが見つかりません")
            DesktopNotifier.notify_error("今週の週報ファイルが見つかりません")
            LINENotifier.notify("⚠️ 週報AIレビュー エラー\n\n今週の週報ファイルが見つかりません")
            return

        logger.info(f"週報を読み込みました: {report.file_path}")
        summary = report.get_summary()

        # 2-2. 前週の週報を読み込んで引き継ぎを更新（新テンプレートv2のみ）
        prev_report = reader.read_previous_week_report()
        if prev_report:
            prev_summary = prev_report.get_summary()
            prev_kpt = prev_summary.get('kpt', {})
            if prev_kpt.get('problem') or prev_kpt.get('try'):
                MarkdownWriter.update_prev_week_section(report.file_path, prev_kpt)
                logger.info("前週からの引き継ぎを更新しました")

        # 3. AI分析
        analyzer = WeeklyReportAnalyzer()
        is_weekend = analyzer.is_weekend()

        logger.info(f"分析モード: {'週末詳細評価' if is_weekend else '平日簡易チェック'}")
        analysis_result = analyzer.analyze(summary, is_weekend)

        # 4. 週報に書き込み
        success = MarkdownWriter.update_ai_summary(
            report.file_path,
            analysis_result,
            is_weekend
        )

        if not success:
            logger.error("週報の書き込みに失敗しました")
            DesktopNotifier.notify_error("週報の書き込みに失敗しました")
            LINENotifier.notify("⚠️ 週報AIレビュー エラー\n\n週報の書き込みに失敗しました")
            return

        # 5. 通知送信
        if is_weekend:
            DesktopNotifier.notify_weekend_review(analysis_result)
            LINENotifier.notify_weekend_review(analysis_result)
        else:
            DesktopNotifier.notify_daily_reminder(analysis_result)
            LINENotifier.notify_daily_reminder(analysis_result)

        logger.info("=== 週報AIレビュー 正常終了 ===")

    except Exception as e:
        logger.error(f"エラーが発生しました: {e}", exc_info=True)
        DesktopNotifier.notify_error(f"エラー: {str(e)}")
        LINENotifier.notify(f"⚠️ 週報AIレビュー エラー\n\nエラー: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    setup_logging()
    main()
