import { HttpStatus, Injectable, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { InvalidRequestException } from 'src/exception/invalid-request.exception';
import { ResponseDto, ResponseStatus } from 'src/shared/response.dto';

@Injectable()
export class CustomValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      // forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (validationErrors: ValidationError[]) => {
        console.log('CustomValidationPipe');
        const error: Record<string, string> = {};

        validationErrors.forEach((validationError: ValidationError) => {
          console.log({ validationError });
          const errorMsg = Object.values(validationError.constraints || {})[0]; // Get the first error message
          error[validationError.property] = errorMsg;
        });

        console.log(error);

        // return new InvalidRequestException(error, 'Request Validation failed');
        const responseDto = new ResponseDto<null>({
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          status: ResponseStatus.ERROR,
          message: 'Request Validation Failed',
          error: error,
        });

        throw new InvalidRequestException(responseDto);
      },
    });
  }
}
