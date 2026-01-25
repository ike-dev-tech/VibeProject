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
    await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(card),
      mode: 'no-cors', // GASはCORSをサポートしていないため
    });

    // no-corsモードでは、レスポンスの内容を読み取れない
    // そのため、成功したと仮定する
    // 実際のエラーハンドリングはGAS側でログに記録される

    return {
      success: true,
      message: 'スプレッドシートに保存しました',
    };
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
    await fetch(gasUrl, {
      method: 'GET',
      mode: 'no-cors',
    });

    // no-corsモードでは常にopaque responseが返る
    // ネットワークエラーがなければ接続成功と判断
    return true;
  } catch (error) {
    console.error('GAS connection test failed:', error);
    return false;
  }
};
