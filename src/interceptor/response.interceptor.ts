import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { Page } from 'src/shared/pagination/pagination';
import { ResponseDto, ResponseStatus } from 'src/shared/response.dto';

export class ResponseInterceptor<T>
  implements NestInterceptor<T, ResponseDto<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ResponseDto<T>> | Promise<Observable<ResponseDto<T>>> {
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
