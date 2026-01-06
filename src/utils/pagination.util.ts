import { PaginationResult } from '../common/interfaces/pagination.interface';

export function paginate<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginationResult<T> {
  const lastPage = Math.ceil(total / limit);
  return {
    data,
    meta: {
      total,
      page,
      lastPage,
    },
  };
}
