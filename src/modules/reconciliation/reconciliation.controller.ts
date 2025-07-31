import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CsvOrXlsxMulterEngine } from '../multer-engine/csv-or-xlsx-multer-engine';
import { Worksheet } from 'exceljs';
import { ApiBody, ApiConsumes, ApiProperty } from '@nestjs/swagger';

const MAX_FILE_SIZE_IN_MiB = 1000000000; // Only for test

class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}

@Controller('reconciliation')
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @UseInterceptors(
    FileInterceptor('file', {
      storage: new CsvOrXlsxMulterEngine({
        destKey: 'worksheet',
        maxFileSize: MAX_FILE_SIZE_IN_MiB,
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'upload aja',
    type: FileUploadDto,
  })
  @Post('/file-upload/csv')
  create(@UploadedFile() data: { worksheet: Worksheet }) {
    console.log({ data });
    return this.reconciliationService.format(data.worksheet);
  }
}
