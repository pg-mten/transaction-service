import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CsvOrXlsxMulterEngine } from './multer-engine/multer-engine';
import { Worksheet } from 'exceljs';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { FilterReconciliationDto } from './dto/filter-reconciliation.dto';
import { Pagination } from 'src/shared/pagination/pagination.decorator';
import { Pageable } from 'src/shared/pagination/pagination';
import { ReconFileUploadDto } from './dto/reconciliation-file-upload.dto';
import { FilterReconciliationCalculateDto } from './dto/filter-reconciliation-calculate.dto';
import { PurchaseTransactionDto } from '../purchase/dto/purchase-transaction.dto';
import { ReconciliationCalculateDto } from './dto/reconciliation-calculate.dto';

const MAX_FILE_SIZE_IN_MiB = 1000000000; // Only for test

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
    description: 'upload csv',
    type: ReconFileUploadDto,
  })
  @Post('/file-upload/csv')
  create(
    @UploadedFile() data: { worksheet: Worksheet },
    @Body() body: ReconFileUploadDto,
  ) {
    const { providerName } = body;
    console.log({ data, providerName });
    return this.reconciliationService.processCSV(data.worksheet, providerName);
  }

  @Get()
  @ApiOperation({ summary: 'Find transaction not reconciliation' })
  @ApiOkResponse({ type: PurchaseTransactionDto })
  findAll(
    @Pagination() pageable: Pageable,
    @Query() filter: FilterReconciliationDto,
  ) {
    return this.reconciliationService.findAll(pageable, filter);
  }

  @Get('/calculate')
  @ApiOperation({ summary: 'Find transaction not reconciliation' })
  @ApiOkResponse({ type: ReconciliationCalculateDto })
  calculate(
    @Pagination() pageable: Pageable,
    @Query() filter: FilterReconciliationCalculateDto,
  ) {
    return this.reconciliationService.calculate(filter);
  }
}
