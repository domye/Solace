/**
 * 搜索弹窗组件
 *
 * 提供文章搜索功能
 */

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useSearch, useEscapeKey } from '@/hooks';
import { useDebouncedCallback } from 'use-debounce';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const navigate = useNavigate();

  // 防抖搜索
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

  // Escape 键关闭
  useEscapeKey(onClose, isOpen);

  // 打开时禁止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 fade-in-up">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-[var(--klein-blue)]/20 dark:bg-[var(--klein-blue)]/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗主体 */}
      <div className="relative float-panel w-full max-w-2xl mx-4 overflow-hidden">
        {/* 搜索输入框 */}
        <div className="flex items-center gap-2 p-4 border-b border-[var(--border-light)]">
          <Icon icon="material-symbols:search-rounded" className="text-2xl text-[var(--primary)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="搜索文章..."
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

        {/* 搜索结果 */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim() && !isLoading && searchResults?.data?.length === 0 && (
            <div className="p-8 text-center text-50">
              <Icon icon="material-symbols:search-off-rounded" className="text-4xl mb-2" />
              <p>未找到 "{query}" 的相关文章</p>
            </div>
          )}

          {searchResults?.data && searchResults.data.length > 0 && (
            <div className="p-2">
              {searchResults.data.map((article) => (
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
              <p>输入关键词搜索文章</p>
              <p className="text-xs mt-1">支持标题和内容搜索</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}