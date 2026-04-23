import { useState, useEffect, useCallback } from 'react';

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSPMc3emmEGiLboom2i7yNhpISpkb7xgsuUd3CZoKGhFheKuZKQgBixA8KOk2R8DSfvUfbtrwRptkk0/pub?output=csv';

function parseCSV(text: string): Record<string, string>[] {
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === '\n' && !inQuotes) {
      lines.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current);

  if (lines.length < 2) return [];

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
      } else if (ch === ',' && !q) {
        cells.push(cell);
        cell = '';
      } else {
        cell += ch;
      }
    }
    cells.push(cell);
    return cells;
  };

  const headers = parseRow(lines[0]).map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = parseRow(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (values[i] ?? '').trim();
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
