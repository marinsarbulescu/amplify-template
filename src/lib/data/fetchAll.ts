import { PaginatedQueryFn } from "./types";

const DEFAULT_MAX_PAGES = 100;

export async function fetchAll<T>(
  queryFn: PaginatedQueryFn<T>,
  options?: { maxPages?: number }
): Promise<T[]> {
  const maxPages = options?.maxPages ?? DEFAULT_MAX_PAGES;
  const results: T[] = [];
  let nextToken: string | null = null;
  let pageCount = 0;

  do {
    const response = await queryFn({ nextToken });
    results.push(...response.data);
    nextToken = response.nextToken ?? null;
    pageCount++;

    if (pageCount >= maxPages && nextToken) {
      throw new Error(`fetchAll exceeded maximum of ${maxPages} pages`);
    }
  } while (nextToken);

  return results;
}
