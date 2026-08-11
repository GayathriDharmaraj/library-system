interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  testId: string;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange, testId }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-ink-900/10 text-sm text-ink-700">
      <div className="flex items-center gap-2">
        <span>Rows per page</span>
        <select
          data-testid={`${testId}-page-size`}
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="border border-ink-900/15 rounded-md px-2 py-1 bg-white"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div data-testid={`${testId}-range-label`}>
        {total === 0 ? 'No results' : `Showing ${startItem}–${endItem} of ${total}`}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          data-testid={`${testId}-prev`}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1.5 rounded-md border border-ink-900/15 disabled:opacity-40 hover:bg-ink-900/5"
        >
          Prev
        </button>
        <span data-testid={`${testId}-current`} className="px-2 font-mono">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          data-testid={`${testId}-next`}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1.5 rounded-md border border-ink-900/15 disabled:opacity-40 hover:bg-ink-900/5"
        >
          Next
        </button>
      </div>
    </div>
  );
}
