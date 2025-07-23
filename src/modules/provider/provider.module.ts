import { Module } from '@nestjs/common';
import { NetzmeService } from './provider.service';

@Module({
  providers: [NetzmeService],
  exports: [NetzmeService],
})
export class NetzmeModule {}
