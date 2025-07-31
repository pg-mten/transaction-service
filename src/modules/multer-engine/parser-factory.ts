import { Workbook } from 'exceljs';

export function createParserCsvOrXlsx(mime: string) {
  const workbook = new Workbook();
  return [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ].includes(mime)
    ? workbook.xlsx
    : workbook.csv;
}
