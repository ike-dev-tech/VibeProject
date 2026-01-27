/**
 * OpenAI API を使用した名刺情報抽出サービス
 * GPT-4o-mini を使用して名刺のOCRテキストから構造化された情報を抽出
 */

import type { BusinessCard } from '../types/businessCard';

/**
 * OpenAI APIから返される名刺抽出結果の型
 */
export interface ExtractedBusinessCard {
  isBusinessCard: boolean; // 名刺かどうかの判定
  name: string;
  nameKana?: string;     // ふりがな（カタカナ）
  company: string;
  department?: string;
  position?: string;
  phone?: string;
  fax?: string;
  email?: string;
  address?: string;
  postalCode?: string;
  url?: string;
  sns?: string;
}

/**
 * OpenAI API を使用して名刺情報を抽出
 * @param ocrText OCRで読み取った生テキスト
 * @returns 抽出された名刺情報
 */
export const extractBusinessCardWithAI = async (
  ocrText: string
): Promise<ExtractedBusinessCard> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI APIキーが設定されていません');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `あなたは名刺情報抽出の専門家です。
以下のルールに従って名刺テキストから情報を抽出してください：

**最重要ルール**:
1. 入力されたテキストが名刺でない場合（手、背景、その他の物体など）は、isBusinessCardをfalseにし、すべてのフィールドをnullで返してください。
2. OCRテキストに実際に存在しない情報は絶対に生成・想像しないでください。
3. 架空のデータ（「株式会社サンプル」「田中太郎」など）は絶対に作成しないでください。

**名刺判定基準**:
- 電話番号、メールアドレス、会社名、個人名などが含まれていれば名刺の可能性が高い
- 意味のないテキストや、情報が極端に少ない場合は名刺ではない

**抽出する項目**:
0. isBusinessCard: 名刺かどうかの判定（true/false）
1. name: 個人の氏名のみ（姓と名の間にスペースを入れる）。**部署名は絶対に含めない**
2. nameKana: ふりがな（カタカナで記載されていれば抽出）
3. company: 株式会社、有限会社などを含む会社の正式名称
4. department: 部署名（〇〇部、〇〇課、〇〇本部など）
5. position: 役職（代表取締役、部長、課長、マネージャーなど）
6. phone: 電話番号（**携帯電話番号を優先**。090/080/070で始まる番号があればそれを使用。なければ固定電話番号を使用）
7. fax: FAX番号（FAX表記の番号）
8. email: メールアドレス
9. address: 住所（都道府県から始まる完全な住所）
10. postalCode: 郵便番号（〒マーク後の番号、ハイフン付き）
11. url: ウェブサイトURL
12. sns: SNSアカウント（@から始まるものや、SNSのURL）

**必須**: JSON形式で出力してください。該当なしの項目はnullとしてください。
名刺でない場合は isBusinessCard: false とし、他のすべてのフィールドをnullにしてください。`
        },
        {
          role: 'user',
          content: `以下の名刺テキストから情報を抽出してください：

${ocrText}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,  // 低めに設定して安定性を重視
      max_tokens: 500,   // 名刺情報は短いので500トークンで十分
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API エラー: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  try {
    const extracted = JSON.parse(content);
    return extracted;
  } catch (error) {
    console.error('JSONパースエラー:', content);
    throw new Error('AIレスポンスのパースに失敗しました');
  }
};

/**
 * AI抽出結果をBusinessCard型に変換
 * @param extracted AI抽出結果
 * @param rawText 元のOCRテキスト
 * @returns BusinessCard オブジェクト
 */
export const convertToBusinessCard = (
  extracted: ExtractedBusinessCard,
  rawText: string
): BusinessCard => {
  return {
    name: extracted.name || '',
    nameKana: extracted.nameKana,
    company: extracted.company || '',
    department: extracted.department,
    position: extracted.position,
    phone: extracted.phone,
    fax: extracted.fax,
    email: extracted.email,
    address: extracted.address,
    postalCode: extracted.postalCode,
    url: extracted.url,
    sns: extracted.sns,
    scannedAt: new Date().toISOString(),
    rawText: rawText,
  };
};
