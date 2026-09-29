const CONFIG = {
  spreadsheetId: '1xJePHU-coBR_L-p0PwrjS-PbGgAXfo4lrlHzayZSS_s',
  sheets: {
    sales: 'Lumo_Sales',
    accounts: 'Lumo_Accounts',
    products: 'Lumo_Products',
    config: 'Lumo_Config'
  }
};

function doGet() {
  return json_({ ok: true, service: 'lumo-api', version: '1' });
}

function doPost(event) {
  try {
    const body = JSON.parse(event.postData.contents || '{}');
    switch (body.action) {
      case 'setup':
        return json_(setup_());
      case 'health':
        return json_(health_());
      default:
        return json_({ ok: false, error: 'Action inconnue.' });
    }
  } catch (error) {
    return json_({ ok: false, error: error.message });
  }
}

function setup_() {
  const book = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const definitions = {
    [CONFIG.sheets.sales]: [
      'id', 'createdAt', 'saleDate', 'buyer', 'seller', 'shop', 'productsJson',
      'priceCents', 'verified', 'receiptUrl', 'payRateCents', 'payCents',
      'costCents', 'feeCents', 'status', 'packedAt', 'cancelledAt'
    ],
    [CONFIG.sheets.accounts]: ['name', 'role', 'rateCents', 'active'],
    [CONFIG.sheets.products]: ['name', 'abbr', 'costCents', 'stock', 'active'],
    [CONFIG.sheets.config]: ['key', 'value']
  };

  Object.keys(definitions).forEach(name => {
    const sheet = book.getSheetByName(name) || book.insertSheet(name);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, definitions[name].length).setValues([definitions[name]]);
      sheet.setFrozenRows(1);
    }
  });

  return { ok: true, message: 'Onglets Lumo créés ou conservés.' };
}

function health_() {
  const book = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  return {
    ok: true,
    spreadsheet: book.getName(),
    sheets: Object.keys(CONFIG.sheets).map(key => CONFIG.sheets[key])
  };
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
