import Decimal from 'decimal.js';
import { DateTime } from 'luxon';
import { CsvColumn, CsvHelper } from './csv.helper';

describe('CsvHelper', () => {
  it('sanitizes spreadsheet formula prefixes in string values', () => {
    const rows = [
      { value: '=2+2' },
      { value: '+SUM(A1:A2)' },
      { value: '-1+2' },
      { value: '@cmd' },
      { value: '  =A1' },
    ];
    const columns: CsvColumn<{ value: string }>[] = [
      { header: 'value', value: (row) => row.value },
    ];

    const result = CsvHelper.build(rows, columns);

    expect(result).toBe(
      "value\n'=2+2\n'+SUM(A1:A2)\n'-1+2\n'@cmd\n'  =A1",
    );
  });

  it('keeps safe string values unchanged', () => {
    const rows = [{ value: 'normal-text' }, { value: 'hello@domain.com' }];
    const columns: CsvColumn<{ value: string }>[] = [
      { header: 'value', value: (row) => row.value },
    ];

    const result = CsvHelper.build(rows, columns);

    expect(result).toBe('value\nnormal-text\nhello@domain.com');
  });

  it('escapes comma, quotes, and line breaks', () => {
    const rows = [{ value: 'Hello, "world"\nline-2' }];
    const columns: CsvColumn<{ value: string }>[] = [
      { header: 'value', value: (row) => row.value },
    ];

    const result = CsvHelper.build(rows, columns);

    expect(result).toBe('value\n"Hello, ""world""\nline-2"');
  });

  it('serializes decimals, dates, and objects', () => {
    const rows = [
      {
        nominal: new Decimal('10.50'),
        createdAt: new Date('2025-01-02T03:04:05.000Z'),
        paidAt: DateTime.fromISO('2025-01-03T04:05:06.000Z', {
          zone: 'utc',
        }),
        metadata: {
          note: 'ok',
          nestedDate: new Date('2025-01-01T00:00:00.000Z'),
          nestedDecimal: new Decimal('12.34'),
        },
      },
    ];
    const columns: CsvColumn<(typeof rows)[number]>[] = [
      { header: 'nominal', value: (row) => row.nominal },
      { header: 'createdAt', value: (row) => row.createdAt },
      { header: 'paidAt', value: (row) => row.paidAt },
      { header: 'metadata', value: (row) => row.metadata },
    ];

    const result = CsvHelper.build(rows, columns);

    expect(result).toContain('nominal,createdAt,paidAt,metadata');
    expect(result).toContain('10.5');
    expect(result).toContain('2025-01-02T03:04:05.000Z');
    expect(result).toContain('2025-01-03T04:05:06.000Z');
    expect(result).toContain(
      '"{""note"":""ok"",""nestedDate"":""2025-01-01T00:00:00.000Z"",""nestedDecimal"":""12.34""}"',
    );
  });
});
