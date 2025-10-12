import { PassThrough } from 'stream';
import * as fileType from 'file-type';
import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { Workbook } from 'exceljs';
import { createParserCsvOrXlsx } from './parser-factory';
import { Readable } from 'stream';

const ALLOWED_MIME_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'text/comma-separated-values',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
] as const;

export class CsvOrXlsxMulterEngine {
  private destKey: string;
  private maxFileSize: number;
  private allowedMimeTypes: readonly string[];

  constructor(opts: { destKey: string; maxFileSize: number }) {
    this.destKey = opts.destKey;
    this.maxFileSize = opts.maxFileSize;
    this.allowedMimeTypes = ALLOWED_MIME_TYPES;
  }

  async _handleFile(req: Request, file: any, cb: any) {
    try {
      // Check content-length header
      const contentLength = Number(req.headers['content-length']);
      console.log({ contentLength });
      
      if (
        typeof contentLength === 'number' &&
        contentLength > this.maxFileSize
      ) {
        throw new Error(`Max file size is ${this.maxFileSize} bytes.`);
      }

      // Read stream into buffer chunks
      const chunks: Buffer[] = [];
      let totalSize = 0;

      for await (const chunk of file.stream) {
        totalSize += chunk.length;
        
        // Check size while reading
        if (totalSize > this.maxFileSize) {
          throw new Error(`Max file size is ${this.maxFileSize} bytes.`);
        }
        
        chunks.push(chunk);
      }

      // Concatenate all chunks into single buffer
      const buffer = Buffer.concat(chunks);
      console.log({ bufferSize: buffer.length });

      // Detect file type from buffer
      const detectedType = await fileType.fromBuffer(buffer);
      console.log({ detectedType });
      
      const mime = detectedType?.mime ?? file.mimetype;
      console.log({ mime });

      // Validate MIME type
      if (!this.allowedMimeTypes.includes(mime)) {
        throw new BadRequestException('File must be *.csv or *.xlsx');
      }

      // Create new readable stream from buffer
      const replacementStream = Readable.from(buffer);
      console.log({ replacementStream });

      // Parse the file
      const parser = createParserCsvOrXlsx(mime);
      console.log({ parser });
      
      const data = await parser.read(replacementStream);
      console.log({ data });

      // Return parsed data
      cb(null, {
        [this.destKey]:
          mime === 'text/csv' ? data : (data as Workbook).getWorksheet(),
      });
    } catch (error) {
      cb(error);
    }
  }

  _removeFile(req: Request, file: any, cb: any) {
    cb(null);
  }
}