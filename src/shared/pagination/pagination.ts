export class PaginationDto {
  constructor(pagination: PaginationDto) {
    Object.assign(this, pagination);
  }
  size: number;
  totalCount: number;
  currentPage: number;
  previousPage: number | null;
  nextPage: number | null;
  totalPage: number;
}

export interface Pageable {
  page: number;
  size: number;
}

export class Page<T> {
  readonly data: T[];
  readonly pagination: PaginationDto;
  constructor({
    pageable,
    total,
    data,
  }: {
    pageable: Pageable;
    total: number;
    data: T[];
  }) {
    this.data = data;
    this.pagination = paginator({ pageable, total });
  }
}

const paginator = ({
  pageable,
  total,
}: {
  pageable: Pageable;
  total: number;
}): PaginationDto => {
  const { page, size } = pageable;
  const totalPage = Math.ceil(total / size);
  return {
    size: size,
    totalCount: total,
    currentPage: page,
    previousPage: page > 1 ? page - 1 : null,
    nextPage: page < totalPage ? page + 1 : null,
    totalPage: totalPage,
  } as PaginationDto;
};

export const paging = (pageable: Pageable): { take: number; skip: number } => {
  const size: number = pageable.size;
  const page: number = pageable.page;
  const skip = page <= 0 ? 0 : size * (page - 1);

  return {
    take: size,
    skip: skip,
  };
};
