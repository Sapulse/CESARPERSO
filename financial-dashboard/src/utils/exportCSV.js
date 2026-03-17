export function downloadCSV(rows, filename) {
  if (!rows.length) return;
  const header = Object.keys(rows[0]);
  const csv = [
    header.join(';'),
    ...rows.map(row =>
      header.map(k => {
        const v = row[k] == null ? '' : String(row[k]);
        return v.includes(';') || v.includes('"') || v.includes('\n')
          ? `"${v.replace(/"/g, '""')}"` : v;
      }).join(';')
    )
  ].join('\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
