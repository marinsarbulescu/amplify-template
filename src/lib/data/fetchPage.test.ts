import { fetchPage } from "./fetchPage";
import { PaginatedQueryFn } from "./types";

describe("fetchPage", () => {
  it("returns full page when enough data in first query", async () => {
    const items = [{ id: "1" }, { id: "2" }, { id: "3" }];
    const queryFn: PaginatedQueryFn<{ id: string }> = jest.fn().mockResolvedValue({
      data: items,
      nextToken: "more-data",
    });

    const result = await fetchPage(queryFn, { pageSize: 3 });

    expect(result.data).toEqual(items);
    expect(result.hasMore).toBe(true);
    expect(result.nextToken).toBe("more-data");
    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(queryFn).toHaveBeenCalledWith({ nextToken: undefined, limit: 3 });
  });

  it("accumulates across multiple queries when filters reduce results", async () => {
    const queryFn: PaginatedQueryFn<{ id: string }> = jest.fn()
      .mockResolvedValueOnce({
        data: [{ id: "1" }],
        nextToken: "token-1",
      })
      .mockResolvedValueOnce({
        data: [{ id: "2" }],
        nextToken: "token-2",
      })
      .mockResolvedValueOnce({
        data: [{ id: "3" }],
        nextToken: "token-3",
      });

    const result = await fetchPage(queryFn, { pageSize: 3 });

    expect(result.data).toEqual([{ id: "1" }, { id: "2" }, { id: "3" }]);
    expect(result.hasMore).toBe(true);
    expect(result.nextToken).toBe("token-3");
    expect(queryFn).toHaveBeenCalledTimes(3);
  });

  it("returns partial page when data runs out before pageSize", async () => {
    const queryFn: PaginatedQueryFn<{ id: string }> = jest.fn().mockResolvedValue({
      data: [{ id: "1" }, { id: "2" }],
      nextToken: null,
    });

    const result = await fetchPage(queryFn, { pageSize: 5 });

    expect(result.data).toEqual([{ id: "1" }, { id: "2" }]);
    expect(result.hasMore).toBe(false);
    expect(result.nextToken).toBeNull();
  });

  it("continues through empty pages with nextToken", async () => {
    const queryFn: PaginatedQueryFn<{ id: string }> = jest.fn()
      .mockResolvedValueOnce({ data: [], nextToken: "token-1" })
      .mockResolvedValueOnce({ data: [{ id: "1" }, { id: "2" }], nextToken: null });

    const result = await fetchPage(queryFn, { pageSize: 2 });

    expect(result.data).toEqual([{ id: "1" }, { id: "2" }]);
    expect(result.hasMore).toBe(false);
    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it("sets hasMore true when more pages exist after filling page", async () => {
    const queryFn: PaginatedQueryFn<{ id: string }> = jest.fn().mockResolvedValue({
      data: [{ id: "1" }, { id: "2" }],
      nextToken: "more",
    });

    const result = await fetchPage(queryFn, { pageSize: 2 });

    expect(result.hasMore).toBe(true);
    expect(result.nextToken).toBe("more");
  });

  it("sets hasMore false when all data exhausted", async () => {
    const queryFn: PaginatedQueryFn<{ id: string }> = jest.fn().mockResolvedValue({
      data: [{ id: "1" }],
      nextToken: null,
    });

    const result = await fetchPage(queryFn, { pageSize: 5 });

    expect(result.hasMore).toBe(false);
    expect(result.nextToken).toBeNull();
  });

  it("passes initial nextToken to first queryFn call", async () => {
    const queryFn: PaginatedQueryFn<{ id: string }> = jest.fn().mockResolvedValue({
      data: [{ id: "1" }, { id: "2" }],
      nextToken: null,
    });

    await fetchPage(queryFn, { pageSize: 2, nextToken: "start-here" });

    expect(queryFn).toHaveBeenCalledWith({
      nextToken: "start-here",
      limit: 2,
    });
  });

  it("propagates queryFn errors", async () => {
    const queryFn: PaginatedQueryFn<{ id: string }> = jest.fn()
      .mockResolvedValueOnce({
        data: [{ id: "1" }],
        nextToken: "token-1",
      })
      .mockRejectedValueOnce(new Error("Auth expired"));

    await expect(
      fetchPage(queryFn, { pageSize: 5 })
    ).rejects.toThrow("Auth expired");
    expect(queryFn).toHaveBeenCalledTimes(2);
  });
});
