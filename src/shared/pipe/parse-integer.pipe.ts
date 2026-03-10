import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { ApiError } from 'src/shared/exception';

// Used by Nest parameter decorators such as `@Param('transactionId', ParseIntegerPipe)`
// to normalize incoming ids before controller logic runs. It accepts both raw strings
// and already-parsed numbers because some execution paths can hand the pipe a numeric
// value after transformation, while we still want one strict safe-integer validation path.
@Injectable()
export class ParseIntegerPipe implements PipeTransform<string | number, number> {
  transform(value: string | number, metadata: ArgumentMetadata): number {
    const field = metadata.data ?? 'value';

    if (typeof value === 'number') {
      if (!Number.isSafeInteger(value)) {
        throw ApiError.invalidPathParameter(
          field,
          'Expected a safe integer value',
        );
      }
      return value;
    }

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
