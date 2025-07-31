import { UnprocessableEntityException } from '@nestjs/common';
import { ResponseDto } from 'src/shared/response.dto';

export class InvalidRequestException extends UnprocessableEntityException {
  private readonly responseDto: ResponseDto<null>;

  constructor(responseDto: ResponseDto<null>) {
    super(responseDto);
    this.responseDto = responseDto;
  }

  getResponseDto(): ResponseDto<null> {
    return this.responseDto;
  }
}

// export class InvalidRequestException extends UnprocessableEntityException {
//   private readonly error: { [key: string]: string };

//   constructor(
//     error: { [key: string]: string },
//     message = 'Request Validation failed',
//   ) {
//     super({ message, error }); // Pass structured error response to NestJS
//     this.error = error;
//   }

//   getErrorMessage(): string {
//     return this.message;
//   }

//   getError(): { [key: string]: string } {
//     return this.error;
//   }
// }

// export class InvalidRequestException extends HttpException {
//   private readonly fieldErrors: { [key: string]: string };

//   constructor(errors: { [key: string]: string }, message = 'Request Validation failed bbb') {
//     super(errors, HttpStatus.UNPROCESSABLE_ENTITY);
//     this.fieldErrors = errors;
//   }

//   getErrorMessage(): string {
//     return this.message;
//   }

//   getFieldErrors(): { [key: string]: string } {
//     return this.fieldErrors;
//   }
// }
