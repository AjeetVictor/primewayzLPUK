/**
 * Small CSV parser for Autopilot keyword imports (no external package).
 * Supports quoted values, escaped quotes, BOM, CRLF/LF.
 */

export const AUTOPILOT_CSV_MAX_BYTES = 512 * 1024; // 512 KiB
export const AUTOPILOT_CSV_MAX_ROWS = 500;
export const AUTOPILOT_CSV_MAX_COLUMNS = 40;
export const AUTOPILOT_CSV_MAX_CELL_LENGTH = 2000;

export type CsvParseError = {
  rowNumber: number;
  message: string;
};

export type CsvParseResult = {
  headers: string[];
  rows: string[][];
  errors: CsvParseError[];
  blankRowCount: number;
};

export function stripUtf8Bom(text: string): string {
  if (text.charCodeAt(0) === 0xfeff) return text.slice(1);
  return text;
}

/** Formula-like cells must be treated as plain text for display safety. */
export function isFormulaLikeCell(value: string): boolean {
  const trimmed = value.trimStart();
  return /^=|^[+\-@]/.test(trimmed);
}

export function sanitiseCellForDisplay(value: string): string {
  if (!isFormulaLikeCell(value)) return value;
  // Prefix apostrophe so spreadsheet tools treat as text if re-exported.
  return `'${value}`;
}

function parseCsvLine(line: string, rowNumber: number): { cells: string[]; error?: string } {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      current += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (char === ',') {
      if (current.length > AUTOPILOT_CSV_MAX_CELL_LENGTH) {
        return {
          cells: [],
          error: `Cell exceeds maximum length of ${AUTOPILOT_CSV_MAX_CELL_LENGTH} characters.`,
        };
      }
      cells.push(current);
      current = '';
      i += 1;
      continue;
    }

    current += char;
    i += 1;
  }

  if (inQuotes) {
    return { cells: [], error: 'Malformed quoted CSV value (unclosed quote).' };
  }

  if (current.length > AUTOPILOT_CSV_MAX_CELL_LENGTH) {
    return {
      cells: [],
      error: `Cell exceeds maximum length of ${AUTOPILOT_CSV_MAX_CELL_LENGTH} characters.`,
    };
  }
  cells.push(current);

  if (cells.length > AUTOPILOT_CSV_MAX_COLUMNS) {
    return {
      cells: [],
      error: `Row exceeds maximum of ${AUTOPILOT_CSV_MAX_COLUMNS} columns.`,
    };
  }

  return { cells };
}

export function parseAutopilotCsv(text: string): CsvParseResult {
  if (text.length > AUTOPILOT_CSV_MAX_BYTES) {
    return {
      headers: [],
      rows: [],
      errors: [
        {
          rowNumber: 0,
          message: `CSV exceeds maximum size of ${AUTOPILOT_CSV_MAX_BYTES} bytes.`,
        },
      ],
      blankRowCount: 0,
    };
  }

  const normalised = stripUtf8Bom(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalised.split('\n');
  const errors: CsvParseError[] = [];
  let blankRowCount = 0;
  const dataLines: { rowNumber: number; cells: string[] }[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const rowNumber = index + 1;
    const line = lines[index];
    if (line.trim() === '') {
      blankRowCount += 1;
      continue;
    }

    const parsed = parseCsvLine(line, rowNumber);
    if (parsed.error) {
      errors.push({ rowNumber, message: parsed.error });
      continue;
    }
    dataLines.push({ rowNumber, cells: parsed.cells });
  }

  if (dataLines.length === 0) {
    return {
      headers: [],
      rows: [],
      errors: errors.length
        ? errors
        : [{ rowNumber: 0, message: 'CSV contains no data rows.' }],
      blankRowCount,
    };
  }

  const headers = dataLines[0].cells.map((cell) => cell.trim());
  if (headers.length === 0 || headers.every((h) => !h)) {
    return {
      headers: [],
      rows: [],
      errors: [{ rowNumber: dataLines[0].rowNumber, message: 'CSV header row is empty.' }],
      blankRowCount,
    };
  }

  if (headers.length > AUTOPILOT_CSV_MAX_COLUMNS) {
    return {
      headers: [],
      rows: [],
      errors: [
        {
          rowNumber: dataLines[0].rowNumber,
          message: `CSV exceeds maximum of ${AUTOPILOT_CSV_MAX_COLUMNS} columns.`,
        },
      ],
      blankRowCount,
    };
  }

  const rows: string[][] = [];
  for (let i = 1; i < dataLines.length; i += 1) {
    if (rows.length >= AUTOPILOT_CSV_MAX_ROWS) {
      errors.push({
        rowNumber: dataLines[i].rowNumber,
        message: `CSV exceeds maximum of ${AUTOPILOT_CSV_MAX_ROWS} data rows.`,
      });
      break;
    }
    const cells = [...dataLines[i].cells];
    while (cells.length < headers.length) cells.push('');
    rows.push(cells.slice(0, headers.length));
  }

  return { headers, rows, errors, blankRowCount };
}

export function csvRowsToObjects(
  headers: string[],
  rows: string[][],
): Array<Record<string, string>> {
  return rows.map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header || `column_${index + 1}`] = row[index] ?? '';
    });
    return obj;
  });
}
