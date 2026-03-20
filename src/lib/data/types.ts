export type PaginatedQueryFn<T> = (options: {
  nextToken?: string | null;
  limit?: number;
}) => Promise<{
  data: T[];
  nextToken?: string | null;
}>;

export interface PageResult<T> {
  data: T[];
  nextToken: string | null;
  hasMore: boolean;
}
