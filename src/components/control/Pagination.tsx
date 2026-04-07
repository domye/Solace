import { Icon } from '@iconify/react';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Previous */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className={`btn-card rounded-[var(--radius-medium)] h-10 w-10 scale-animation ripple ${
          page === 1 ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        aria-label="Previous page"
      >
        <Icon icon="material-symbols:chevron-left-rounded" className="text-xl" />
      </button>

      {/* First page */}
      {start > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="btn-card rounded-[var(--radius-medium)] h-10 min-w-[2.5rem] px-3 scale-animation ripple"
          >
            1
          </button>
          {start > 2 && <span className="text-30 px-1">...</span>}
        </>
      )}

      {/* Page numbers */}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`rounded-[var(--radius-medium)] h-10 min-w-[2.5rem] px-3 scale-animation ripple ${
            p === page
              ? 'text-white font-bold bg-gradient-to-r from-[var(--klein-blue)] to-[var(--klein-blue-light)] shadow-lg'
              : 'btn-card'
          }`}
        >
          {p}
        </button>
      ))}

      {/* Last page */}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-30 px-1">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="btn-card rounded-[var(--radius-medium)] h-10 min-w-[2.5rem] px-3 scale-animation ripple"
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className={`btn-card rounded-[var(--radius-medium)] h-10 w-10 scale-animation ripple ${
          page === totalPages ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        aria-label="Next page"
      >
        <Icon icon="material-symbols:chevron-right-rounded" className="text-xl" />
      </button>
    </div>
  );
}