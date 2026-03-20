import { PaginatedQueryFn, PageResult } from "./types";

export async function fetchPage<T>(
  queryFn: PaginatedQueryFn<T>,
  options: { pageSize: number; nextToken?: string | null }
): Promise<PageResult<T>> {
  const results: T[] = [];
  let currentToken = options.nextToken ?? undefined;

  while (results.length < options.pageSize) {
    const response = await queryFn({
      nextToken: currentToken,
      limit: options.pageSize - results.length,
    });
    results.push(...response.data);
    currentToken = response.nextToken ?? undefined;

    if (!currentToken) break;
  }

  return {
    data: results,
    nextToken: currentToken ?? null,
    hasMore: currentToken != null,
  };
}
