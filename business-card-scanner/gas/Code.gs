/**
 * 名刺管理PWA - Google Apps Script
 * スプレッドシートに名刺データを保存
 */

/**
 * POSTリクエストを処理
 */
function doPost(e) {
  try {
    // リクエストボディをパース
    const data = JSON.parse(e.postData.contents);

    // スプレッドシートを取得
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName('名刺データ');

    // シートが存在しない場合は作成
    if (!sheet) {
      sheet = spreadsheet.insertSheet('名刺データ');

      // ヘッダー行を追加
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
        'SNS',
        'スキャン日時',
        '生テキスト'
      ];
      sheet.appendRow(headers);

      // ヘッダー行のスタイル設定
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('#ffffff');
    }

    // 重複チェック（メールアドレスまたは電話番号で判定）
    if (data.email || data.phone) {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const emailCol = 9; // メール列
        const phoneCol = 7; // 電話列

        for (let i = 2; i <= lastRow; i++) {
          const existingEmail = sheet.getRange(i, emailCol).getValue();
          const existingPhone = sheet.getRange(i, phoneCol).getValue();

          // メールまたは電話番号が一致する場合は重複
          if (
            (data.email && existingEmail === data.email) ||
            (data.phone && existingPhone === data.phone)
          ) {
            return ContentService
              .createTextOutput(JSON.stringify({
                success: false,
                message: '既に登録されている名刺です',
                duplicate: true
              }))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
    }

    // IDを生成（タイムスタンプベース）
    const id = Utilities.getUuid();

    // データを追加
    const row = [
      id,
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
      data.sns || '',
      data.scannedAt || new Date().toISOString(),
      data.rawText || ''
    ];

    sheet.appendRow(row);

    // 自動列幅調整
    sheet.autoResizeColumns(1, 15);

    // 成功レスポンス
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: '名刺データを保存しました',
        id: id
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // エラーレスポンス
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'エラーが発生しました: ' + error.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * GETリクエストを処理（テスト用）
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      message: '名刺管理PWA API',
      version: '1.0',
      endpoints: {
        POST: 'データ保存'
      }
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * スプレッドシートのセットアップ（初回実行用）
 */
function setupSpreadsheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName('名刺データ');

  if (!sheet) {
    sheet = spreadsheet.insertSheet('名刺データ');

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
      'SNS',
      'スキャン日時',
      '生テキスト'
    ];

    sheet.appendRow(headers);

    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('#ffffff');

    sheet.autoResizeColumns(1, headers.length);

    Logger.log('スプレッドシートのセットアップが完了しました');
  } else {
    Logger.log('スプレッドシートは既にセットアップ済みです');
  }
}
