/**
 * Smart CSV parser for French bank exports.
 * Handles:
 *  - Semicolon and comma separators
 *  - French date formats (DD/MM/YYYY, DD-MM-YYYY)
 *  - Separate debit/credit columns or combined amount column
 *  - Quoted fields
 *  - UTF-8 BOM
 */

function detectSeparator(firstLine) {
  const commas = (firstLine.match(/,/g) || []).length;
  const semis = (firstLine.match(/;/g) || []).length;
  return semis >= commas ? ';' : ',';
}

function parseDate(raw) {
  if (!raw) return null;
  const s = raw.trim().replace(/"/g, '');
  // DD/MM/YYYY
  const m1 = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m1) return `${m1[3]}-${m1[2]}-${m1[1]}`;
  // DD-MM-YYYY
  const m2 = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m2) return `${m2[3]}-${m2[2]}-${m2[1]}`;
  // YYYY-MM-DD (ISO)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return null;
}

function parseAmount(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  // Remove quotes and whitespace (spaces used as thousands separator in French)
  let s = String(raw).trim().replace(/"/g, '').replace(/\s/g, '');
  if (!s) return null;

  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');

  if (lastDot !== -1 && lastComma !== -1) {
    // Both present — whichever comes last is the decimal separator.
    // "1.234,56" → comma last → comma = decimal
    // "1,234.56" → dot last   → dot   = decimal
    if (lastDot > lastComma) {
      s = s.replace(/,/g, '');           // remove thousands commas, keep dot
    } else {
      s = s.replace(/\./g, '').replace(',', '.'); // remove thousands dots, comma → dot
    }
  } else if (lastComma !== -1) {
    // Only comma present → always decimal separator
    // "-48,15" → "-48.15"   |   "-1 234,56" (spaces already removed) → "-1234.56"
    s = s.replace(',', '.');
  }
  // Only dot (or no separator): keep as-is
  // "-48.15" stays "-48.15"  |  "-4815" stays "-4815"

  // Strip anything that isn't a digit, minus or decimal dot
  s = s.replace(/[^\d.-]/g, '');
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function normalizeKey(h) {
  return h
    .toLowerCase()
    .trim()
    .replace(/"/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function findColumn(headers, candidates) {
  const norm = headers.map(normalizeKey);
  for (const c of candidates) {
    const key = normalizeKey(c);
    const idx = norm.indexOf(key);
    if (idx !== -1) return idx;
  }
  // Partial match fallback
  for (const c of candidates) {
    const key = normalizeKey(c);
    const idx = norm.findIndex(n => n.includes(key) || key.includes(n));
    if (idx !== -1) return idx;
  }
  return -1;
}

function splitLine(line, sep) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === sep && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function generateHash(date, libelle, montant) {
  const str = `${date}|${libelle}|${montant}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function parseCSV(text) {
  // Remove UTF-8 BOM
  text = text.replace(/^\uFEFF/, '');

  const allLines = text.split(/\r?\n/);
  const lines = allLines.filter(l => l.trim());

  if (lines.length < 2) {
    return { rows: [], error: 'Fichier trop court ou vide.' };
  }

  const sep = detectSeparator(lines[0]);
  const headers = splitLine(lines[0], sep);

  // Detect column indices
  const dateIdx = findColumn(headers, [
    'date', 'date operation', 'date comptable', 'date de valeur',
    'dateop', 'dateoper', 'date oper',
  ]);
  const libelleIdx = findColumn(headers, [
    'libelle', 'label', 'description', 'intitule', 'libelle operation',
    'detail', 'motif', 'reference', 'designation',
  ]);
  const montantIdx = findColumn(headers, [
    'montant', 'amount', 'valeur', 'solde', 'transaction',
    'montant operation',
  ]);
  const debitIdx = findColumn(headers, [
    'debit', 'montant debit', 'debit euros', 'sortie',
  ]);
  const creditIdx = findColumn(headers, [
    'credit', 'montant credit', 'credit euros', 'entree',
  ]);

  if (dateIdx === -1 || libelleIdx === -1) {
    return {
      rows: [],
      error: `Colonnes date/libellé introuvables. Colonnes détectées : ${headers.join(', ')}`,
    };
  }

  const hasAmount = montantIdx !== -1;
  const hasDebitCredit = debitIdx !== -1 && creditIdx !== -1;

  if (!hasAmount && !hasDebitCredit) {
    return {
      rows: [],
      error: `Colonne montant introuvable. Colonnes détectées : ${headers.join(', ')}`,
    };
  }

  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitLine(lines[i], sep);
    if (cols.length < 2) continue;

    const date = parseDate(cols[dateIdx]);
    if (!date) continue;

    const libelle = (cols[libelleIdx] || '').replace(/"/g, '').trim();
    if (!libelle) continue;

    let montant;
    if (hasAmount) {
      montant = parseAmount(cols[montantIdx]);
    } else {
      const debit = parseAmount(cols[debitIdx]) || 0;
      const credit = parseAmount(cols[creditIdx]) || 0;
      montant = credit - Math.abs(debit);
    }

    if (montant === null) continue;

    const hash = generateHash(date, libelle, montant);

    rows.push({
      date,
      libelle,
      montant,
      hash,
      type: montant >= 0 ? 'credit' : 'debit',
    });
  }

  if (rows.length === 0) {
    return { rows: [], error: 'Aucune ligne valide trouvée dans le fichier.' };
  }

  return { rows, error: null };
}
