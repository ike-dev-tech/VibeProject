import type { BusinessCard } from '../types/businessCard';

interface GasResponse {
  success: boolean;
  message: string;
  id?: string;
  duplicate?: boolean;
}

/**
 * Google Apps ScriptにPOSTリクエストを送信
 */
export const saveToSpreadsheet = async (card: BusinessCard): Promise<GasResponse> => {
  const gasUrl = import.meta.env.VITE_GAS_WEB_APP_URL;

  if (!gasUrl) {
    throw new Error('GAS Web App URL is not set. Please set VITE_GAS_WEB_APP_URL in .env.local');
  }

  try {
    // Content-Typeをtext/plainに設定してCORS制約を回避
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(card),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: GasResponse = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'スプレッドシートへの保存に失敗しました');
    }

    return result;
  } catch (error) {
    console.error('GAS save error:', error);
    throw new Error(
      error instanceof Error
        ? `保存エラー: ${error.message}`
        : 'スプレッドシートへの保存に失敗しました'
    );
  }
};

/**
 * GAS接続をテスト
 */
export const testGasConnection = async (): Promise<boolean> => {
  const gasUrl = import.meta.env.VITE_GAS_WEB_APP_URL;

  if (!gasUrl) {
    console.error('GAS URL not configured');
    return false;
  }

  try {
    const response = await fetch(gasUrl, {
      method: 'GET',
    });

    // レスポンスステータスが200番台なら接続成功
    return response.ok;
  } catch (error) {
    console.error('GAS connection test failed:', error);
    return false;
  }
};
