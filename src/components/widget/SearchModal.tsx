import { useState, useEffect, useCallback, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useArticles } from '@/hooks';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  summary?: string;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const { data } = useArticles({ page: 1, pageSize: 100 });

  // Client-side search filter
  const searchResults = useMemo(() => {
    if (!query.trim() || !data?.items) return [];
    const lowerQuery = query.toLowerCase();
    return data.items.filter(
      (article: Article) =>
        article.title.toLowerCase().includes(lowerQuery) ||
        article.content.toLowerCase().includes(lowerQuery) ||
        (article.summary && article.summary.toLowerCase().includes(lowerQuery))
    );
  }, [query, data?.items]);

  const handleSelect = useCallback((slug: string) => {
    navigate(`/articles/${slug}`);
    onClose();
    setQuery('');
  }, [navigate, onClose]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative float-panel w-full max-w-2xl mx-4 p-4">
        {/* Search Input */}
        <div className="flex items-center gap-2 mb-4">
          <Icon icon="material-symbols:search-rounded" className="text-2xl text-50" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles..."
            className="input-base flex-1"
            autoFocus
          />
          <button
            onClick={onClose}
            className="btn-plain rounded-lg h-11 w-11"
          >
            <Icon icon="material-symbols:close-rounded" className="text-xl" />
          </button>
        </div>

        {/* Results */}
        {query.trim() && searchResults.length === 0 && (
          <div className="text-center py-8 text-50">No results found</div>
        )}

        {searchResults.length > 0 && (
          <div className="flex flex-col gap-2">
            {searchResults.slice(0, 10).map((article: Article) => (
              <button
                key={article.id}
                onClick={() => handleSelect(article.slug)}
                className="btn-card rounded-lg p-4 text-left hover:bg-[var(--btn-card-bg-hover)]"
              >
                <div className="text-90 font-bold mb-1">{article.title}</div>
                <div className="text-50 text-sm line-clamp-1">
                  {article.summary || article.content.slice(0, 100)}
                </div>
              </button>
            ))}
          </div>
        )}

        {!query.trim() && (
          <div className="text-center py-8 text-50">
            <Icon icon="material-symbols:search-rounded" className="text-3xl mb-2" />
            <p>Type to search</p>
          </div>
        )}
      </div>
    </div>
  );
}