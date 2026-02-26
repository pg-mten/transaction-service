import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map, Observable } from 'rxjs';
import { Page } from 'src/shared/pagination/pagination';
import { ResponseDto, ResponseStatus } from 'src/shared/response.dto';
import { SKIP_RESPONSE_INTERCEPTOR } from './skip-response.interceptor';

export class ResponseInterceptor<T>
  implements NestInterceptor<T, ResponseDto<T> | null>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ):
    | Observable<ResponseDto<T> | null>
    | Promise<Observable<ResponseDto<T> | null>> {
    const request = context.switchToHttp().getRequest();

    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_RESPONSE_INTERCEPTOR,
      [context.getHandler(), context.getClass()],
    );

    if (skip) return next.handle() as Observable<null>;

    if (request.path === '/metrics') {
      return next.handle() as Observable<ResponseDto<T>>;
    }
    return next.handle().pipe(
      map((response) => {
        if (response instanceof ResponseDto) {
          return response;
        }
        if (response instanceof Page) {
          return new ResponseDto<T>({
            status: ResponseStatus.SUCCESS,
            message: 'Request Successfully',
            data: response.data as T,
            pagination: response.pagination,
          });
        }
        return new ResponseDto<T>({
          status: ResponseStatus.SUCCESS,
          message: 'Request Succesfully',
          data: response,
        });
      }),
    );
  }
}
