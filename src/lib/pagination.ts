export type Pagination = {
	total: number;
	page: number;
	limit: number;
	totalPages: number;
};

export function paginationFromResponse(
	response: Response,
	page: number,
	limit: number,
	fallbackCount = 0
): Pagination {
	const headerValue = response.headers.get('total-items');
	const parsedTotal = headerValue === null ? Number.NaN : Number(headerValue);
	const total = Number.isFinite(parsedTotal) ? parsedTotal : fallbackCount;

	return {
		total,
		page,
		limit,
		totalPages: total === 0 ? 0 : Math.ceil(total / limit)
	};
}
