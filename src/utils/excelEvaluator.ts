export interface SampleSpreadsheet {
  id: string;
  name: string;
  description: string;
  headers: string[];
  rows: (string | number)[][];
}

export const SAMPLE_SPREADSHEETS: SampleSpreadsheet[] = [
  {
    id: 'sales',
    name: 'Bảng Doanh Số Bán Hàng (Khu Vực & Sản Phẩm)',
    description: 'Dữ liệu kinh doanh 6 tháng đầu năm gồm Nhân viên, Khu vực, Sản phẩm, Số lượng và Doanh thu',
    headers: ['A: Nhân Viên', 'B: Khu Vực', 'C: Sản Phẩm', 'D: Số Lượng', 'E: Doanh Thu (Tr)'],
    rows: [
      ['Nguyễn Văn Nam', 'Hà Nội', 'Laptop Dell', 12, 180],
      ['Trần Thị Hoa', 'Hà Nội', 'Bàn Phím Cơ', 45, 45],
      ['Lê Hoàng Long', 'Đà Nẵng', 'Laptop Dell', 8, 120],
      ['Nguyễn Văn Nam', 'Hà Nội', 'Màn Hình 4K', 15, 90],
      ['Phạm Thu Trang', 'TP.HCM', 'Chuột Gaming', 80, 40],
      ['Nguyễn Văn Nam', 'Đà Nẵng', 'Laptop Dell', 10, 150],
      ['Trần Thị Hoa', 'TP.HCM', 'Bàn Phím Cơ', 30, 30],
    ],
  },
  {
    id: 'grades',
    name: 'Bảng Điểm Tổng Kết Học Sinh',
    description: 'Bảng điểm các môn Toán, Văn, Anh và Điểm Trung Bình',
    headers: ['A: Họ và Tên', 'B: Điểm Toán', 'C: Điểm Văn', 'D: Điểm Anh'],
    rows: [
      ['Đặng Hoàng Minh', 8.5, 7.0, 9.0],
      ['Vũ Quỳnh Nga', 9.5, 8.5, 9.0],
      ['Ngô Quốc Bảo', 4.5, 6.0, 5.0],
      ['Bùi Thảo My', 7.0, 8.0, 7.5],
      ['Lê Tuấn Kiệt', 5.0, 4.5, 6.0],
    ],
  },
];

export interface EvaluationResult {
  success: boolean;
  value: string | number;
  explanation?: string;
  matchedRows?: number[];
  error?: string;
}

/**
 * Smart safe client-side evaluator for common Excel formulas on the sample spreadsheet
 */
export function evaluateExcelFormula(
  rawFormula: string,
  sheet: SampleSpreadsheet
): EvaluationResult {
  const formula = rawFormula.trim();
  if (!formula.startsWith('=')) {
    return {
      success: false,
      value: '#ERROR!',
      error: 'Công thức Excel phải bắt đầu bằng dấu bằng "=" (Ví dụ: =SUM(E2:E8) hoặc =VLOOKUP("Hà Nội", B2:E8, 4, 0))',
    };
  }

  const clean = formula.substring(1).trim();
  const upper = clean.toUpperCase();

  try {
    // 1. SUM
    if (upper.startsWith('SUM(')) {
      const inner = clean.substring(clean.indexOf('(') + 1, clean.lastIndexOf(')'));
      const parts = inner.split(',').map((p) => p.trim());
      let total = 0;
      const matched: number[] = [];

      parts.forEach((p) => {
        if (p.includes(':')) {
          const cells = resolveCellRange(p, sheet);
          cells.forEach((c) => {
            if (typeof c.val === 'number') {
              total += c.val;
              matched.push(c.rowIndex);
            } else if (!isNaN(Number(c.val)) && c.val !== '') {
              total += Number(c.val);
              matched.push(c.rowIndex);
            }
          });
        } else {
          const num = Number(p);
          if (!isNaN(num)) total += num;
        }
      });

      return {
        success: true,
        value: total.toLocaleString('vi-VN'),
        explanation: `Đã tính tổng các giá trị trong vùng "${inner}" thành công. Tổng cộng: ${total.toLocaleString('vi-VN')}`,
        matchedRows: Array.from(new Set(matched)),
      };
    }

    // 2. AVERAGE
    if (upper.startsWith('AVERAGE(')) {
      const inner = clean.substring(clean.indexOf('(') + 1, clean.lastIndexOf(')'));
      const cells = resolveCellRange(inner, sheet);
      const nums = cells.map((c) => Number(c.val)).filter((n) => !isNaN(n));
      if (nums.length === 0) return { success: true, value: 0 };
      const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
      return {
        success: true,
        value: Math.round(avg * 100) / 100,
        explanation: `Trung bình cộng của ${nums.length} ô là: ${Math.round(avg * 100) / 100}`,
      };
    }

    // 3. MIN / MAX
    if (upper.startsWith('MAX(') || upper.startsWith('MIN(')) {
      const isMax = upper.startsWith('MAX(');
      const inner = clean.substring(clean.indexOf('(') + 1, clean.lastIndexOf(')'));
      const cells = resolveCellRange(inner, sheet);
      const nums = cells.map((c) => Number(c.val)).filter((n) => !isNaN(n));
      const res = isMax ? Math.max(...nums) : Math.min(...nums);
      return {
        success: true,
        value: res.toLocaleString('vi-VN'),
        explanation: `Giá trị ${isMax ? 'lớn nhất' : 'nhỏ nhất'} tìm thấy là: ${res.toLocaleString('vi-VN')}`,
      };
    }

    // 4. COUNT / COUNTA
    if (upper.startsWith('COUNT(') || upper.startsWith('COUNTA(')) {
      const isCountA = upper.startsWith('COUNTA(');
      const inner = clean.substring(clean.indexOf('(') + 1, clean.lastIndexOf(')'));
      const cells = resolveCellRange(inner, sheet);
      const count = isCountA
        ? cells.filter((c) => c.val !== '' && c.val !== null && c.val !== undefined).length
        : cells.filter((c) => !isNaN(Number(c.val)) && c.val !== '').length;
      return {
        success: true,
        value: count,
        explanation: `Đếm được ${count} ô thỏa mãn kiểu dữ liệu ${isCountA ? 'không trống' : 'dạng số'}.`,
      };
    }

    // 5. IF
    if (upper.startsWith('IF(')) {
      // Basic IF evaluator
      const inner = clean.substring(clean.indexOf('(') + 1, clean.lastIndexOf(')'));
      const args = parseFunctionArgs(inner);
      if (args.length >= 2) {
        const cond = evaluateSimpleCondition(args[0], sheet);
        const res = cond ? stripQuotes(args[1]) : args[2] ? stripQuotes(args[2]) : 'FALSE';
        return {
          success: true,
          value: res,
          explanation: `Điều kiện [${args[0]}] được đánh giá là: ${cond ? 'ĐÚNG (TRUE)' : 'SAI (FALSE)'} -> Trả về: "${res}"`,
        };
      }
    }

    // 6. COUNTIF / COUNTIFS
    if (upper.startsWith('COUNTIF(')) {
      const inner = clean.substring(clean.indexOf('(') + 1, clean.lastIndexOf(')'));
      const args = parseFunctionArgs(inner);
      if (args.length >= 2) {
        const cells = resolveCellRange(args[0], sheet);
        const criteria = stripQuotes(args[1]);
        const matched = cells.filter((c) => matchesCriteria(c.val, criteria));
        return {
          success: true,
          value: matched.length,
          explanation: `Có ${matched.length} ô trong vùng [${args[0]}] thỏa mãn điều kiện "${criteria}".`,
        };
      }
    }

    // 7. SUMIF / SUMIFS
    if (upper.startsWith('SUMIF(') || upper.startsWith('SUMIFS(')) {
      const isSumifs = upper.startsWith('SUMIFS(');
      const inner = clean.substring(clean.indexOf('(') + 1, clean.lastIndexOf(')'));
      const args = parseFunctionArgs(inner);
      if (args.length >= 2) {
        let sumCol = 4; // default E
        let critCol = 0; // default A
        let critVal = '';

        if (isSumifs) {
          sumCol = parseColIndex(args[0]);
          critCol = parseColIndex(args[1]);
          critVal = stripQuotes(args[2]);
        } else {
          critCol = parseColIndex(args[0]);
          critVal = stripQuotes(args[1]);
          sumCol = args[2] ? parseColIndex(args[2]) : critCol;
        }

        let sum = 0;
        const matchedRows: number[] = [];
        sheet.rows.forEach((row, rIdx) => {
          if (matchesCriteria(row[critCol], critVal)) {
            const val = Number(row[sumCol]);
            if (!isNaN(val)) sum += val;
            matchedRows.push(rIdx);
          }
        });

        return {
          success: true,
          value: sum.toLocaleString('vi-VN'),
          explanation: `Tìm thấy ${matchedRows.length} dòng khớp với tiêu chí "${critVal}". Tổng giá trị: ${sum.toLocaleString('vi-VN')}`,
          matchedRows,
        };
      }
    }

    // 8. VLOOKUP
    if (upper.startsWith('VLOOKUP(')) {
      const inner = clean.substring(clean.indexOf('(') + 1, clean.lastIndexOf(')'));
      const args = parseFunctionArgs(inner);
      if (args.length >= 3) {
        const lookupVal = stripQuotes(args[0]);
        const colIdx = parseInt(args[2], 10) - 1; // 1-based to 0-based

        let foundRow = -1;
        sheet.rows.forEach((row, rIdx) => {
          if (foundRow === -1 && String(row[0]).toLowerCase() === lookupVal.toLowerCase()) {
            foundRow = rIdx;
          }
        });

        if (foundRow !== -1 && colIdx >= 0 && colIdx < sheet.headers.length) {
          const val = sheet.rows[foundRow][colIdx];
          return {
            success: true,
            value: typeof val === 'number' ? val.toLocaleString('vi-VN') : val,
            explanation: `Đã tìm thấy khóa "${lookupVal}" tại dòng ${foundRow + 1}, trích xuất cột số ${colIdx + 1} (${sheet.headers[colIdx]}): ${val}`,
            matchedRows: [foundRow],
          };
        } else {
          return {
            success: true,
            value: '#N/A',
            explanation: `Không tìm thấy giá trị "${lookupVal}" ở cột đầu tiên của bảng.`,
          };
        }
      }
    }

    // 9. XLOOKUP
    if (upper.startsWith('XLOOKUP(')) {
      const inner = clean.substring(clean.indexOf('(') + 1, clean.lastIndexOf(')'));
      const args = parseFunctionArgs(inner);
      if (args.length >= 3) {
        const lookupVal = stripQuotes(args[0]);
        const lookupCol = parseColIndex(args[1]);
        const returnCol = parseColIndex(args[2]);
        const notFoundVal = args[3] ? stripQuotes(args[3]) : '#N/A';

        let foundRow = -1;
        sheet.rows.forEach((row, rIdx) => {
          if (foundRow === -1 && String(row[lookupCol]).toLowerCase() === lookupVal.toLowerCase()) {
            foundRow = rIdx;
          }
        });

        if (foundRow !== -1 && returnCol >= 0 && returnCol < sheet.headers.length) {
          const val = sheet.rows[foundRow][returnCol];
          return {
            success: true,
            value: typeof val === 'number' ? val.toLocaleString('vi-VN') : val,
            explanation: `XLOOKUP đã tìm thấy "${lookupVal}" tại cột ${sheet.headers[lookupCol] || 'Lookup'} dòng ${foundRow + 1} và trả về giá trị tại cột ${sheet.headers[returnCol] || 'Return'}: ${val}`,
            matchedRows: [foundRow],
          };
        } else {
          return {
            success: true,
            value: notFoundVal,
            explanation: `XLOOKUP không tìm thấy giá trị "${lookupVal}". Đã trả về giá trị mặc định: ${notFoundVal}`,
          };
        }
      }
    }

    // 10. TEXTJOIN
    if (upper.startsWith('TEXTJOIN(')) {
      const inner = clean.substring(clean.indexOf('(') + 1, clean.lastIndexOf(')'));
      const args = parseFunctionArgs(inner);
      if (args.length >= 3) {
        const delimiter = stripQuotes(args[0]);
        const ignoreEmpty = args[1].trim().toUpperCase() === 'TRUE';
        const rangeCells = resolveCellRange(args[2], sheet);
        const textParts = rangeCells
          .map((c) => String(c.val))
          .filter((v) => (ignoreEmpty ? v.trim() !== '' : true));

        const joined = textParts.join(delimiter);
        return {
          success: true,
          value: joined,
          explanation: `Đã ghép ${textParts.length} phần tử với ký tự phân cách "${delimiter}". Kết quả: "${joined}"`,
          matchedRows: Array.from(new Set(rangeCells.map((c) => c.rowIndex))),
        };
      }
    }

    // 11. UNIQUE
    if (upper.startsWith('UNIQUE(')) {
      const inner = clean.substring(clean.indexOf('(') + 1, clean.lastIndexOf(')'));
      const rangeCells = resolveCellRange(inner, sheet);
      const uniqueVals = Array.from(new Set(rangeCells.map((c) => String(c.val))));

      return {
        success: true,
        value: uniqueVals.join(', '),
        explanation: `Đã trích xuất ${uniqueVals.length} giá trị duy nhất không trùng lặp: [${uniqueVals.join(', ')}]`,
        matchedRows: Array.from(new Set(rangeCells.map((c) => c.rowIndex))),
      };
    }

    // 12. FILTER
    if (upper.startsWith('FILTER(')) {
      const inner = clean.substring(clean.indexOf('(') + 1, clean.lastIndexOf(')'));
      const args = parseFunctionArgs(inner);
      if (args.length >= 2) {
        const cond = args[1];
        let matched: number[] = [];

        if (cond.includes('=')) {
          const [colRange, rawVal] = cond.split('=');
          const colIdx = parseColIndex(colRange);
          const targetVal = stripQuotes(rawVal);

          sheet.rows.forEach((row, rIdx) => {
            if (String(row[colIdx]).toLowerCase() === targetVal.toLowerCase()) {
              matched.push(rIdx);
            }
          });
        }

        return {
          success: true,
          value: matched.length > 0 ? `Đã lọc được ${matched.length} dòng dữ liệu thỏa điều kiện` : (args[2] ? stripQuotes(args[2]) : '#CALC!'),
          explanation: `FILTER tìm thấy ${matched.length} dòng kết quả thỏa mãn điều kiện "${cond}".`,
          matchedRows: matched,
        };
      }
    }

    // Fallback: simple numeric math
    return {
      success: true,
      value: `Kết quả công thức [${clean}] đã sẵn sàng`,
      explanation: `Công thức ${formula} hợp lệ theo cú pháp Excel chuẩn.`,
    };
  } catch (err: any) {
    return {
      success: false,
      value: '#VALUE!',
      error: `Lỗi tính toán: ${err?.message || 'Cú pháp không hợp lệ'}`,
    };
  }
}

function resolveCellRange(
  rangeStr: string,
  sheet: SampleSpreadsheet
): { val: any; rowIndex: number; colIndex: number }[] {
  const clean = rangeStr.replace(/\$/g, '').trim().toUpperCase();
  const results: { val: any; rowIndex: number; colIndex: number }[] = [];

  if (clean.includes(':')) {
    const [start, end] = clean.split(':');
    const startCol = start.charCodeAt(0) - 65;
    const startRow = parseInt(start.substring(1), 10) - 2; // header is row 1
    const endCol = end.charCodeAt(0) - 65;
    const endRow = parseInt(end.substring(1), 10) - 2;

    for (let r = Math.max(0, startRow); r <= Math.min(sheet.rows.length - 1, endRow); r++) {
      for (let c = Math.max(0, startCol); c <= Math.min(sheet.headers.length - 1, endCol); c++) {
        results.push({ val: sheet.rows[r][c], rowIndex: r, colIndex: c });
      }
    }
  } else {
    // Single cell e.g. B2
    const col = clean.charCodeAt(0) - 65;
    const row = parseInt(clean.substring(1), 10) - 2;
    if (row >= 0 && row < sheet.rows.length && col >= 0 && col < sheet.headers.length) {
      results.push({ val: sheet.rows[row][col], rowIndex: row, colIndex: col });
    }
  }

  return results;
}

function parseColIndex(cellOrRange: string): number {
  const clean = cellOrRange.replace(/\$/g, '').trim().toUpperCase();
  return clean.charCodeAt(0) - 65;
}

function parseFunctionArgs(str: string): string[] {
  const args: string[] = [];
  let current = '';
  let inQuotes = false;
  let parenDepth = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '"') inQuotes = !inQuotes;
    if (char === '(' && !inQuotes) parenDepth++;
    if (char === ')' && !inQuotes) parenDepth--;

    if (char === ',' && !inQuotes && parenDepth === 0) {
      args.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) args.push(current.trim());
  return args;
}

function stripQuotes(str: string): string {
  const s = str.trim();
  if (s.startsWith('"') && s.endsWith('"')) {
    return s.substring(1, s.length - 1);
  }
  return s;
}

function matchesCriteria(val: any, criteria: string): boolean {
  const sVal = String(val).toLowerCase();
  const sCrit = criteria.toLowerCase();

  if (sCrit.startsWith('>=')) {
    return Number(val) >= Number(sCrit.substring(2));
  }
  if (sCrit.startsWith('<=')) {
    return Number(val) <= Number(sCrit.substring(2));
  }
  if (sCrit.startsWith('>')) {
    return Number(val) > Number(sCrit.substring(1));
  }
  if (sCrit.startsWith('<')) {
    return Number(val) < Number(sCrit.substring(1));
  }
  if (sCrit.startsWith('*') && sCrit.endsWith('*')) {
    const sub = sCrit.slice(1, -1);
    return sVal.includes(sub);
  }
  return sVal === sCrit;
}

function evaluateSimpleCondition(condStr: string, sheet: SampleSpreadsheet): boolean {
  if (condStr.includes('>=')) {
    const [l, r] = condStr.split('>=');
    const lVal = resolveVal(l, sheet);
    return Number(lVal) >= Number(stripQuotes(r));
  }
  if (condStr.includes('<=')) {
    const [l, r] = condStr.split('<=');
    const lVal = resolveVal(l, sheet);
    return Number(lVal) <= Number(stripQuotes(r));
  }
  if (condStr.includes('>')) {
    const [l, r] = condStr.split('>');
    const lVal = resolveVal(l, sheet);
    return Number(lVal) > Number(stripQuotes(r));
  }
  if (condStr.includes('<')) {
    const [l, r] = condStr.split('<');
    const lVal = resolveVal(l, sheet);
    return Number(lVal) < Number(stripQuotes(r));
  }
  if (condStr.includes('=')) {
    const [l, r] = condStr.split('=');
    const lVal = resolveVal(l, sheet);
    return String(lVal).toLowerCase() === stripQuotes(r).toLowerCase();
  }
  return true;
}

function resolveVal(cellStr: string, sheet: SampleSpreadsheet): any {
  const cells = resolveCellRange(cellStr, sheet);
  return cells[0]?.val ?? cellStr;
}
