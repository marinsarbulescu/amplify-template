import { fetchAll } from "./fetchAll";
import { PaginatedQueryFn } from "./types";

describe("fetchAll", () => {
  it("returns empty array when query returns no data", async () => {
    const queryFn: PaginatedQueryFn<{ id: string }> = jest.fn().mockResolvedValue({
      data: [],
      nextToken: null,
    });

    const result = await fetchAll(queryFn);

    expect(result).toEqual([]);
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it("returns data from a single page", async () => {
    const items = [{ id: "1" }, { id: "2" }, { id: "3" }];
    const queryFn: PaginatedQueryFn<{ id: string }> = jest.fn().mockResolvedValue({
      data: items,
      nextToken: null,
    });

    const result = await fetchAll(queryFn);

    expect(result).toEqual(items);
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it("combines data across multiple pages", async () => {
    const queryFn: PaginatedQueryFn<{ id: string }> = jest.fn()
      .mockResolvedValueOnce({
        data: [{ id: "1" }, { id: "2" }],
        nextToken: "token-1",
      })
      .mockResolvedValueOnce({
        data: [{ id: "3" }, { id: "4" }],
        nextToken: "token-2",
      })
      .mockResolvedValueOnce({
        data: [{ id: "5" }],
        nextToken: null,
      });

    const result = await fetchAll(queryFn);

    expect(result).toEqual([
      { id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }, { id: "5" },
    ]);
    expect(queryFn).toHaveBeenCalledTimes(3);
    expect(queryFn).toHaveBeenNthCalledWith(2, { nextToken: "token-1" });
    expect(queryFn).toHaveBeenNthCalledWith(3, { nextToken: "token-2" });
  });

  it("handles nextToken being undefined", async () => {
    const queryFn: PaginatedQueryFn<{ id: string }> = jest.fn().mockResolvedValue({
      data: [{ id: "1" }],
      nextToken: undefined,
    });

    const result = await fetchAll(queryFn);

    expect(result).toEqual([{ id: "1" }]);
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it("continues through empty pages with nextToken", async () => {
    const queryFn: PaginatedQueryFn<{ id: string }> = jest.fn()
      .mockResolvedValueOnce({ data: [], nextToken: "token-1" })
      .mockResolvedValueOnce({ data: [{ id: "1" }], nextToken: null });

    const result = await fetchAll(queryFn);
    expect(result).toEqual([{ id: "1" }]);
    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it("throws error when maxPages exceeded", async () => {
    const queryFn: PaginatedQueryFn<{ id: string }> = jest.fn().mockResolvedValue({
      data: [{ id: "1" }],
      nextToken: "always-more",
    });

    await expect(fetchAll(queryFn, { maxPages: 3 })).rejects.toThrow(
      "fetchAll exceeded maximum of 3 pages"
    );
    expect(queryFn).toHaveBeenCalledTimes(3);
  });

  it("uses default maxPages of 100", async () => {
    let callCount = 0;
    const queryFn: PaginatedQueryFn<{ id: string }> = jest.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        data: [{ id: String(callCount) }],
        nextToken: callCount < 101 ? `token-${callCount}` : null,
      });
    });

    await expect(fetchAll(queryFn)).rejects.toThrow(
      "fetchAll exceeded maximum of 100 pages"
    );
    expect(queryFn).toHaveBeenCalledTimes(100);
  });

  it("allows overriding maxPages", async () => {
    let callCount = 0;
    const queryFn: PaginatedQueryFn<{ id: string }> = jest.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        data: [{ id: String(callCount) }],
        nextToken: callCount < 5 ? `token-${callCount}` : null,
      });
    });

    const result = await fetchAll(queryFn, { maxPages: 10 });

    expect(result).toHaveLength(5);
    expect(queryFn).toHaveBeenCalledTimes(5);
  });

  it("propagates queryFn errors", async () => {
    const queryFn: PaginatedQueryFn<{ id: string }> = jest.fn()
      .mockResolvedValueOnce({
        data: [{ id: "1" }],
        nextToken: "token-1",
      })
      .mockRejectedValueOnce(new Error("Network failure"));

    await expect(fetchAll(queryFn)).rejects.toThrow("Network failure");
    expect(queryFn).toHaveBeenCalledTimes(2);
  });
});
