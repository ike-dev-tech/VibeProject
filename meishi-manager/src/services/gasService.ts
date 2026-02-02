import type { BusinessCard, CreateBusinessCard, UpdateBusinessCard } from '../types';

// Google Apps Script Web App URL（環境変数から取得）
const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_WEB_APP_URL;

/**
 * GASレスポンスの型
 */
interface GASResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  duplicate?: boolean;
}

/**
 * 名刺を作成
 */
export async function createBusinessCard(card: BusinessCard): Promise<{ success: boolean; message: string; id?: string }> {
  try {
    const response = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create',
        ...card
      }),
    });

    const result: GASResponse<{ id: string }> = await response.json();

    return {
      success: result.success,
      message: result.message,
      id: result.data?.id
    };
  } catch (error) {
    console.error('Failed to create business card:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '名刺の保存に失敗しました'
    };
  }
}

/**
 * 名刺を更新
 */
export async function updateBusinessCard(id: string, updates: UpdateBusinessCard): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update',
        id,
        ...updates
      }),
    });

    const result: GASResponse = await response.json();

    return {
      success: result.success,
      message: result.message
    };
  } catch (error) {
    console.error('Failed to update business card:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '名刺の更新に失敗しました'
    };
  }
}

/**
 * 名刺を削除
 */
export async function deleteBusinessCard(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'delete',
        id
      }),
    });

    const result: GASResponse = await response.json();

    return {
      success: result.success,
      message: result.message
    };
  } catch (error) {
    console.error('Failed to delete business card:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '名刺の削除に失敗しました'
    };
  }
}

/**
 * 全ての名刺を取得
 */
export async function getAllBusinessCards(): Promise<{ success: boolean; cards: BusinessCard[] }> {
  try {
    const response = await fetch(`${GAS_WEB_APP_URL}?action=list`);
    const result: GASResponse<{ cards: BusinessCard[] }> = await response.json();

    return {
      success: result.success,
      cards: result.data?.cards || []
    };
  } catch (error) {
    console.error('Failed to get business cards:', error);
    return {
      success: false,
      cards: []
    };
  }
}

/**
 * IDで名刺を取得
 */
export async function getBusinessCard(id: string): Promise<{ success: boolean; card?: BusinessCard }> {
  try {
    const response = await fetch(`${GAS_WEB_APP_URL}?action=get&id=${id}`);
    const result: GASResponse<{ card: BusinessCard }> = await response.json();

    return {
      success: result.success,
      card: result.data?.card
    };
  } catch (error) {
    console.error('Failed to get business card:', error);
    return {
      success: false
    };
  }
}

/**
 * 名刺を作成してBusinessCardオブジェクトを返す（useScanFlow用）
 */
export async function createCard(cardData: CreateBusinessCard): Promise<BusinessCard> {
  const result = await createBusinessCard({
    id: '', // IDは後で生成される
    ...cardData,
    scannedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  if (!result.success || !result.id) {
    throw new Error(result.message || '名刺の保存に失敗しました');
  }

  // 保存された名刺を返す
  return {
    id: result.id,
    ...cardData,
    scannedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
