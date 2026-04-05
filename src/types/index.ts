// Component props types
export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export interface SearchProps {
  onSearch: (query: string) => void;
  initialValue?: string;
}