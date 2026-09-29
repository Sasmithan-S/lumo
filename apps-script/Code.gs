const CONFIG = {
  spreadsheetId: '1xJePHU-coBR_L-p0PwrjS-PbGgAXfo4lrlHzayZSS_s',
  sheets: {
    sales: 'Lumo_Sales',
    accounts: 'Lumo_Accounts',
    products: 'Lumo_Products',
    config: 'Lumo_Config'
  }
};

function doGet(event) {
  try {
    const params = event.parameter || {};
    if (params.action === 'list') return json_(list_(params));
    if (params.action === 'health') return json_(health_());
    return json_({ ok: true, service: 'lumo-api', version: '1' });
  } catch (error) {
    return json_({ ok: false, error: error.message });
  }
}

function doPost(event) {
  try {
    const body = JSON.parse(event.postData.contents || '{}');
    switch (body.action) {
      case 'setup': return json_(setup_());
      case 'health': return json_(health_());
      case 'create': return json_(createSale_(body));
      case 'pack': return json_(setStatus_(body, 'packed'));
      case 'cancel': return json_(setStatus_(body, 'cancelled'));
      case 'roles': return json_(setRoles_(body));
      case 'rate': return json_(setRate_(body));
      default: return json_({ ok: false, error: 'Action inconnue.' });
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

function list_(params) {
  const sheet = sheet_(CONFIG.sheets.sales);
  const rows = readRows_(sheet);
  const seller = params.seller || '';
  return { ok: true, sales: rows.filter(row => !seller || row.seller === seller) };
}

function createSale_(body) {
  if (!body.id || !body.seller || !body.buyer || !body.products) {
    throw new Error('Vente incomplète.');
  }
  const sheet = sheet_(CONFIG.sheets.sales);
  const products = typeof body.products === 'string' ? body.products : JSON.stringify(body.products);
  const row = {
    id: body.id,
    createdAt: new Date().toISOString(),
    saleDate: body.date || new Date().toISOString(),
    buyer: body.buyer,
    seller: body.seller,
    shop: body.shop || '',
    productsJson: products,
    priceCents: Number(body.priceCents || 0),
    verified: Boolean(body.verified),
    receiptUrl: body.receiptUrl || '',
    payRateCents: Number(body.payRateCents || 0),
    payCents: Number(body.payCents || 0),
    costCents: Number(body.costCents || 0),
    feeCents: Number(body.feeCents || 0),
    status: 'pending',
    packedAt: '',
    cancelledAt: ''
  };
  appendObject_(sheet, row);
  return { ok: true, sale: row };
}

function setStatus_(body, status) {
  if (!body.id) throw new Error('Identifiant de vente manquant.');
  const sheet = sheet_(CONFIG.sheets.sales);
  const headers = headers_(sheet);
  const idColumn = headers.indexOf('id') + 1;
  const statusColumn = headers.indexOf('status') + 1;
  const timestampColumn = headers.indexOf(status === 'packed' ? 'packedAt' : 'cancelledAt') + 1;
  if (!idColumn || !statusColumn || !timestampColumn) throw new Error('Colonnes de statut absentes. Exécuter setup_.');
  const values = sheet.getDataRange().getValues();
  for (let index = 1; index < values.length; index += 1) {
    if (String(values[index][idColumn - 1]) === String(body.id)) {
      sheet.getRange(index + 1, statusColumn).setValue(status);
      sheet.getRange(index + 1, timestampColumn).setValue(new Date().toISOString());
      return { ok: true, id: body.id, status: status };
    }
  }
  throw new Error('Vente introuvable.');
}

function setRoles_(body) {
  if (!body.name || !Array.isArray(body.roles)) throw new Error('Compte ou rôles manquants.');
  const sheet = sheet_(CONFIG.sheets.accounts);
  const headers = headers_(sheet);
  const rows = sheet.getDataRange().getValues();
  const nameColumn = headers.indexOf('name');
  const roleColumn = headers.indexOf('role');
  for (let index = 1; index < rows.length; index += 1) {
    if (String(rows[index][nameColumn]) === String(body.name)) {
      sheet.getRange(index + 1, roleColumn + 1).setValue(body.roles.join(','));
      return { ok: true, name: body.name, roles: body.roles };
    }
  }
  throw new Error('Compte introuvable.');
}

function setRate_(body) {
  if (!body.name || !Number.isFinite(Number(body.rateCents))) throw new Error('Tarif manquant.');
  const sheet = sheet_(CONFIG.sheets.accounts);
  const headers = headers_(sheet);
  const rows = sheet.getDataRange().getValues();
  const nameColumn = headers.indexOf('name');
  const rateColumn = headers.indexOf('rateCents');
  for (let index = 1; index < rows.length; index += 1) {
    if (String(rows[index][nameColumn]) === String(body.name)) {
      sheet.getRange(index + 1, rateColumn + 1).setValue(Number(body.rateCents));
      return { ok: true, name: body.name, rateCents: Number(body.rateCents) };
    }
  }
  throw new Error('Compte introuvable.');
}

function sheet_(name) {
  const sheet = SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetByName(name);
  if (!sheet) throw new Error('Onglet absent : ' + name + '. Exécuter setup_.');
  return sheet;
}

function headers_(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
}

function readRows_(sheet) {
  const headers = headers_(sheet);
  return sheet.getDataRange().getValues().slice(1).map(values => headers.reduce((row, header, index) => {
    row[header] = values[index];
    return row;
  }, {}));
}

function appendObject_(sheet, object) {
  const headers = headers_(sheet);
  sheet.appendRow(headers.map(header => object[header] === undefined ? '' : object[header]));
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
