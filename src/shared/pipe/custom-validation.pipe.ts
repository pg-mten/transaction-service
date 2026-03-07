import { Injectable, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { ApiError } from 'src/shared/exception';

function flattenValidationErrors(
  validationErrors: ValidationError[],
  parentPath = '',
): Record<string, string> {
  const fields: Record<string, string> = {};

  validationErrors.forEach((validationError) => {
    const path = parentPath
      ? `${parentPath}.${validationError.property}`
      : validationError.property;
    const firstConstraint = Object.values(validationError.constraints ?? {})[0];

    if (firstConstraint) {
      fields[path] = firstConstraint;
    }

    if (validationError.children && validationError.children.length > 0) {
      Object.assign(
        fields,
        flattenValidationErrors(validationError.children, path),
      );
    }
  });

  return fields;
}

@Injectable()
export class CustomValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      // forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (validationErrors: ValidationError[]) => {
        throw ApiError.validationFailed(
          flattenValidationErrors(validationErrors),
        );
      },
    });
  }
}
