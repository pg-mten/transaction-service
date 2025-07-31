import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Pageable } from './pagination';
import { Request } from 'express';

export const Pagination = createParamDecorator(
  (
    pageable: Pageable = { page: 1, size: 15 },
    context: ExecutionContext,
  ): Pageable => {
    const request: Request = context.switchToHttp().getRequest();

    const pageParam = request.query.page as string;
    const sizeParam = request.query.size as string;

    console.log({ pageParam, sizeParam });

    let { page, size } = pageable;

    const pageNumber = parseInt(pageParam?.toString(), 10);
    const sizeNumber = parseInt(sizeParam?.toString(), 10);

    if (!isNaN(pageNumber)) page = pageNumber < 1 ? page : pageNumber;

    if (!isNaN(sizeNumber)) size = sizeNumber < 1 ? size : sizeNumber;

    return {
      page,
      size,
    } as Pageable;
  },
);
