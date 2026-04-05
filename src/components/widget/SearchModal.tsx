import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '@/hooks/useApi';
import { useDebouncedCallback } from 'use-debounce';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const navigate = useNavigate();

  // Debounce search query
  const debouncedSetQuery = useDebouncedCallback((value: string) => {
    setDebouncedQuery(value);
  }, 300);

  const { data: searchResults, isLoading } = useSearch(debouncedQuery);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    debouncedSetQuery(value);
  }, [debouncedSetQuery]);

  const handleSelect = useCallback((slug: string) => {
    navigate(`/articles/${slug}`);
    onClose();
    setQuery('');
    setDebouncedQuery('');
  }, [navigate, onClose]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle search modal
      }
    };
    document.addEventListener('keydown', handleShortcut);
    return () => document.removeEventListener('keydown', handleShortcut);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 fade-in-up">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--klein-blue)]/20 dark:bg-[var(--klein-blue)]/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative float-panel w-full max-w-2xl mx-4 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-2 p-4 border-b border-[var(--border-light)]">
          <Icon icon="material-symbols:search-rounded" className="text-2xl text-[var(--primary)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search articles..."
            className="input-base flex-1 border-none shadow-none focus:ring-0"
            autoFocus
          />
          {isLoading && (
            <div className="w-5 h-5 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
          )}
          <button
            onClick={onClose}
            className="btn-plain rounded-[var(--radius-medium)] h-10 w-10 scale-animation ripple"
          >
            <Icon icon="material-symbols:close-rounded" className="text-xl" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim() && !isLoading && searchResults?.items?.length === 0 && (
            <div className="p-8 text-center text-50">
              <Icon icon="material-symbols:search-off-rounded" className="text-4xl mb-2" />
              <p>No results found for "{query}"</p>
            </div>
          )}

          {searchResults?.items && searchResults.items.length > 0 && (
            <div className="p-2">
              {searchResults.items.map((article) => (
                <button
                  key={article.id}
                  onClick={() => handleSelect(article.slug)}
                  className="w-full text-left p-3 rounded-[var(--radius-medium)] hover:bg-[var(--btn-plain-bg-hover)] transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <div className="text-90 font-bold group-hover:text-[var(--primary)] transition-colors flex-1">
                      {article.title}
                    </div>
                    <Icon
                      icon="material-symbols:chevron-right-rounded"
                      className="text-lg text-30 group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all"
                    />
                  </div>
                  {article.summary && (
                    <div className="text-50 text-sm line-clamp-1 mt-1">
                      {article.summary}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {!query.trim() && (
            <div className="p-8 text-center text-50">
              <Icon icon="material-symbols:search-rounded" className="text-4xl mb-2 text-[var(--primary)]" />
              <p>Type to search articles</p>
              <p className="text-xs mt-1">Search by title or content</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}