import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { ApiError } from 'src/shared/exception';

@Injectable()
export class ParseIntegerPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const field = metadata.data ?? 'value';

    if (typeof value !== 'string' || !/^-?\d+$/.test(value.trim())) {
      throw ApiError.invalidPathParameter(field);
    }

    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed)) {
      throw ApiError.invalidPathParameter(field, 'Expected a safe integer value');
    }

    return parsed;
  }
}
