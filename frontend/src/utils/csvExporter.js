/**
 * Utility to export an array of data objects or arrays to a CSV file and trigger browser download.
 * @param {string} filename - Desired output filename (e.g. 'users_report.csv')
 * @param {Array<string>} headers - Header column names (e.g. ['Name', 'Email', 'Role'])
 * @param {Array<Array<any>>} rows - Data rows matching headers
 */
export const downloadCSV = (filename, headers, rows) => {
  if (!rows || !rows.length) {
    alert('No data available to export.');
    return;
  }

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(escapeCSV).join(',');
  const rowLines = rows.map(row => row.map(escapeCSV).join(','));
  const csvContent = [headerLine, ...rowLines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
