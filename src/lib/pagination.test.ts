import {
  buildPageHref,
  buildPaginationMeta,
  resolvePagination,
} from "@/lib/pagination";

describe("pagination", () => {
  it("normaliza página e page size inválidos", () => {
    const resolved = resolvePagination({
      page: "0",
      pageSize: "999",
      defaultPageSize: 12,
      maxPageSize: 24,
    });

    expect(resolved.page).toBe(1);
    expect(resolved.pageSize).toBe(24);
    expect(resolved.offset).toBe(0);
  });

  it("calcula metadados de paginação corretamente", () => {
    const meta = buildPaginationMeta(53, 3, 12);

    expect(meta.currentPage).toBe(3);
    expect(meta.totalPages).toBe(5);
    expect(meta.startItem).toBe(25);
    expect(meta.endItem).toBe(36);
    expect(meta.hasPreviousPage).toBe(true);
    expect(meta.hasNextPage).toBe(true);
  });

  it("monta href preservando filtros", () => {
    expect(
      buildPageHref("/games", 2, { category: "Racing", q: "drift" }),
    ).toBe("/games?category=Racing&q=drift&page=2");
  });
});