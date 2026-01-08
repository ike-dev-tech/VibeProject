"""
設定管理モジュール

環境変数から設定を読み込み、アプリケーション全体で使用する
"""
import os
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()


class Settings(BaseModel):
    """アプリケーション設定"""

    # Vault設定
    vault_path: str = os.getenv("VAULT_PATH", "")

    # OpenAI API設定
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o")

    # ログ設定
    log_level: str = os.getenv("LOG_LEVEL", "INFO")


# グローバル設定インスタンス
settings = Settings()
