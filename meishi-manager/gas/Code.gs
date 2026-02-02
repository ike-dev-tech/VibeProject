/**
 * 名刺管理PWA - Google Apps Script
 * 名刺データのCRUD操作を提供
 */

const SHEET_NAME = '名刺データ';

/**
 * POSTリクエストを処理（作成・更新・削除）
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action; // 'create', 'update', 'delete'

    switch (action) {
      case 'create':
        return createCard(data);
      case 'update':
        return updateCard(data);
      case 'delete':
        return deleteCard(data.id);
      default:
        throw new Error('Invalid action: ' + action);
    }
  } catch (error) {
    return errorResponse('エラーが発生しました: ' + error.message);
  }
}

/**
 * GETリクエストを処理（全件取得・検索）
 */
function doGet(e) {
  try {
    const action = e.parameter.action;

    switch (action) {
      case 'list':
        return getAllCards();
      case 'get':
        return getCard(e.parameter.id);
      default:
        return apiInfo();
    }
  } catch (error) {
    return errorResponse('エラーが発生しました: ' + error.message);
  }
}

/**
 * 名刺を新規作成
 */
function createCard(data) {
  const sheet = getSheet();

  // 重複チェック（メールアドレスまたは電話番号）
  if (isDuplicate(sheet, data.email, data.phone)) {
    return errorResponse('既に登録されている名刺です', true);
  }

  // データ行を作成
  const row = [
    data.id,
    data.name || '',
    data.nameKana || '',
    data.company || '',
    data.department || '',
    data.position || '',
    data.phone || '',
    data.fax || '',
    data.email || '',
    data.address || '',
    data.postalCode || '',
    data.url || '',
    JSON.stringify(data.tags || []),
    data.rawText || '',
    data.imageUrl || '',
    data.scannedBy || '',
    data.scannedAt || new Date().toISOString(),
    data.updatedAt || new Date().toISOString()
  ];

  sheet.appendRow(row);
  sheet.autoResizeColumns(1, 18);

  return successResponse('名刺データを保存しました', { id: data.id });
}

/**
 * 名刺を更新
 */
function updateCard(data) {
  const sheet = getSheet();
  const rowIndex = findRowById(sheet, data.id);

  if (rowIndex === -1) {
    return errorResponse('名刺が見つかりません');
  }

  // 更新データを反映
  const currentRow = sheet.getRange(rowIndex, 1, 1, 18).getValues()[0];

  const updatedRow = [
    data.id,
    data.name !== undefined ? data.name : currentRow[1],
    data.nameKana !== undefined ? data.nameKana : currentRow[2],
    data.company !== undefined ? data.company : currentRow[3],
    data.department !== undefined ? data.department : currentRow[4],
    data.position !== undefined ? data.position : currentRow[5],
    data.phone !== undefined ? data.phone : currentRow[6],
    data.fax !== undefined ? data.fax : currentRow[7],
    data.email !== undefined ? data.email : currentRow[8],
    data.address !== undefined ? data.address : currentRow[9],
    data.postalCode !== undefined ? data.postalCode : currentRow[10],
    data.url !== undefined ? data.url : currentRow[11],
    data.tags !== undefined ? JSON.stringify(data.tags) : currentRow[12],
    data.rawText !== undefined ? data.rawText : currentRow[13],
    data.imageUrl !== undefined ? data.imageUrl : currentRow[14],
    data.scannedBy !== undefined ? data.scannedBy : currentRow[15],
    currentRow[16], // scannedAtは変更しない
    new Date().toISOString() // updatedAtを更新
  ];

  sheet.getRange(rowIndex, 1, 1, 18).setValues([updatedRow]);

  return successResponse('名刺データを更新しました', { id: data.id });
}

/**
 * 名刺を削除
 */
function deleteCard(id) {
  const sheet = getSheet();
  const rowIndex = findRowById(sheet, id);

  if (rowIndex === -1) {
    return errorResponse('名刺が見つかりません');
  }

  sheet.deleteRow(rowIndex);

  return successResponse('名刺データを削除しました', { id: id });
}

/**
 * 全ての名刺を取得
 */
function getAllCards() {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return successResponse('取得しました', { cards: [] });
  }

  const data = sheet.getRange(2, 1, lastRow - 1, 18).getValues();
  const cards = data.map(row => rowToCard(row));

  return successResponse('取得しました', { cards: cards });
}

/**
 * IDで名刺を取得
 */
function getCard(id) {
  const sheet = getSheet();
  const rowIndex = findRowById(sheet, id);

  if (rowIndex === -1) {
    return errorResponse('名刺が見つかりません');
  }

  const row = sheet.getRange(rowIndex, 1, 1, 18).getValues()[0];
  const card = rowToCard(row);

  return successResponse('取得しました', { card: card });
}

/**
 * シートを取得（存在しない場合は作成）
 */
function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = createSheet(spreadsheet);
  }

  return sheet;
}

/**
 * シートを作成
 */
function createSheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet(SHEET_NAME);

  const headers = [
    'ID',
    '氏名',
    '氏名(カナ)',
    '会社名',
    '部署名',
    '役職',
    '電話番号',
    'FAX',
    'メール',
    '住所',
    '郵便番号',
    'URL',
    'タグ',
    '生テキスト',
    '画像URL',
    'スキャン者',
    'スキャン日時',
    '更新日時'
  ];

  sheet.appendRow(headers);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('#ffffff');
  sheet.setFrozenRows(1);

  return sheet;
}

/**
 * IDで行を検索
 */
function findRowById(sheet, id) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) {
      return i + 2; // ヘッダー行があるため+2
    }
  }

  return -1;
}

/**
 * 重複チェック
 */
function isDuplicate(sheet, email, phone) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;

  if (!email && !phone) return false;

  const data = sheet.getRange(2, 1, lastRow - 1, 9).getValues();

  for (let i = 0; i < data.length; i++) {
    const existingEmail = data[i][8]; // メール列
    const existingPhone = data[i][6]; // 電話列

    if ((email && existingEmail === email) || (phone && existingPhone === phone)) {
      return true;
    }
  }

  return false;
}

/**
 * 行データを名刺オブジェクトに変換
 */
function rowToCard(row) {
  return {
    id: row[0],
    name: row[1],
    nameKana: row[2],
    company: row[3],
    department: row[4],
    position: row[5],
    phone: row[6],
    fax: row[7],
    email: row[8],
    address: row[9],
    postalCode: row[10],
    url: row[11],
    tags: row[12] ? JSON.parse(row[12]) : [],
    rawText: row[13],
    imageUrl: row[14],
    scannedBy: row[15],
    scannedAt: row[16],
    updatedAt: row[17]
  };
}

/**
 * 成功レスポンス
 */
function successResponse(message, data) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      message: message,
      data: data || {}
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * エラーレスポンス
 */
function errorResponse(message, isDuplicate) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: false,
      message: message,
      duplicate: isDuplicate || false
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * API情報
 */
function apiInfo() {
  return ContentService
    .createTextOutput(JSON.stringify({
      message: '名刺管理PWA API',
      version: '2.0',
      endpoints: {
        'POST (action=create)': 'データ作成',
        'POST (action=update)': 'データ更新',
        'POST (action=delete)': 'データ削除',
        'GET (action=list)': '全件取得',
        'GET (action=get&id=xxx)': '単一取得'
      }
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
