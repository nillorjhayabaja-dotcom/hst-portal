export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export function toPagination(query: PaginationQuery): PaginationOptions {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function buildMeta(total: number, opts: PaginationOptions) {
  return {
    page: opts.page,
    pageSize: opts.pageSize,
    total,
    totalPages: Math.ceil(total / opts.pageSize),
  };
}