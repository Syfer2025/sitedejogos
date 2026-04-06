export function getSingleQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function normalizePositiveInt(
  value: number | string | undefined,
  fallback: number,
) {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}

export function resolvePagination(input: {
  page?: string | string[];
  pageSize?: string | string[];
  defaultPage?: number;
  defaultPageSize?: number;
  maxPageSize?: number;
}) {
  const page = normalizePositiveInt(
    getSingleQueryValue(input.page),
    input.defaultPage ?? 1,
  );
  const requestedPageSize = normalizePositiveInt(
    getSingleQueryValue(input.pageSize),
    input.defaultPageSize ?? 12,
  );
  const pageSize = Math.min(
    Math.max(requestedPageSize, 1),
    input.maxPageSize ?? 48,
  );

  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
  };
}

export function buildPaginationMeta(
  totalItems: number,
  requestedPage: number,
  pageSize: number,
) {
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  const currentPage = Math.min(Math.max(requestedPage, 1), totalPages);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  return {
    totalItems,
    currentPage,
    pageSize,
    totalPages,
    startItem,
    endItem,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
  };
}

export function buildPageHref(
  pathname: string,
  page: number,
  params: Record<string, string | undefined>,
) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  if (page > 1) {
    searchParams.set("page", String(page));
  }

  const query = searchParams.toString();

  return query ? `${pathname}?${query}` : pathname;
}