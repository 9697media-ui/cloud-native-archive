import { useState, useEffect, useCallback } from 'react';

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSPMc3emmEGiLboom2i7yNhpISpkb7xgsuUd3CZoKGhFheKuZKQgBixA8KOk2R8DSfvUfbtrwRptkk0/pub?output=csv';

function parseCSV(text: string): Record<string, string>[] {
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  // Normalizar quebras de linha preservando o conteúdo
  const chars = Array.from(text);
  
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const next = chars[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++; // pular as próximas aspas
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === '\n' && !inQuotes) {
      lines.push(current);
      current = '';
    } else if (ch === '\r' && !inQuotes) {
      if (next === '\n') i++;
      lines.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current || text.endsWith('\n') || text.endsWith('\r')) lines.push(current);

  if (lines.length < 1) return [];

  // Detectar delimitador com base na primeira linha (ignorando o que está entre aspas)
  const firstLineRaw = lines[0];
  let commaCount = 0;
  let semiCount = 0;
  let tempInQuotes = false;
  
  for (const ch of firstLineRaw) {
    if (ch === '"') tempInQuotes = !tempInQuotes;
    else if (!tempInQuotes) {
      if (ch === ',') commaCount++;
      else if (ch === ';') semiCount++;
    }
  }
  const delimiter = semiCount > commaCount ? ';' : ',';

  const parseRow = (row: string): string[] => {
    const cells: string[] = [];
    let cell = '';
    let q = false;
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '"') {
        if (q && row[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          q = !q;
        }
      } else if (ch === delimiter && !q) {
        cells.push(cell);
        cell = '';
      } else {
        cell += ch;
      }
    }
    cells.push(cell);
    return cells;
  };

  const rawHeaders = parseRow(lines[0]);
  const headers = rawHeaders.map(h => h.trim().replace(/^"|"$/g, ''));
  
  return lines.slice(1).filter(line => line.trim() !== '').map(line => {
    const values = parseRow(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      const key = h || `Coluna_${i}`;
      let val = (values[i] ?? '').trim();
      // Remover aspas extras se o parseRow não removeu tudo
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1).replace(/""/g, '"');
      }
      obj[key] = val;
    });
    return obj;
  });
}

export interface SheetData {
  rows: Record<string, string>[];
  headers: string[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSheetIntegration(): SheetData {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(SHEET_CSV_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const parsed = parseCSV(text);
      if (parsed.length > 0) {
        setHeaders(Object.keys(parsed[0]));
      }
      setRows(parsed);
    } catch (e: any) {
      setError(e.message ?? 'Erro ao buscar planilha');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { rows, headers, loading, error, refetch: fetchData };
}
