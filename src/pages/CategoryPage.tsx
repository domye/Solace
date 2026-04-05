import { useParams } from 'react-router-dom';
import { useCategoryBySlug, useArticles } from '@/hooks/useApi';
import { PostCard } from '@/components/common/PostCard';
import { Pagination } from '@/components/control/Pagination';
import { useState } from 'react';
import { toPostCardArticle } from '@/utils/article';

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: category } = useCategoryBySlug(slug || '');
  const { data: articlesData, isLoading } = useArticles({
    page,
    pageSize,
    category: slug,
  });

  if (!slug) {
    return <div className="card-base p-8 text-center text-50">Category not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Category Header */}
      {category && (
        <div className="card-base p-6">
          <h1 className="text-2xl font-bold text-90 mb-2">{category.name}</h1>
          {category.description && (
            <p className="text-50">{category.description}</p>
          )}
          {category.article_count !== undefined && (
            <p className="text-30 text-sm mt-2">{category.article_count} articles</p>
          )}
        </div>
      )}

      {/* Articles List */}
      {isLoading ? (
        <div className="card-base p-8 text-center text-50">Loading...</div>
      ) : articlesData?.items && articlesData.items.length > 0 ? (
        <>
          <div className="space-y-0">
            {articlesData.items.map((article) => (
              <PostCard
                key={article.id}
                article={toPostCardArticle(article)}
              />
            ))}
          </div>

          {/* Pagination */}
          {articlesData.total > pageSize && (
            <Pagination
              page={page}
              pageSize={pageSize}
              total={articlesData.total}
              onPageChange={setPage}
            />
          )}
        </>
      ) : (
        <div className="card-base p-8 text-center text-50">
          No articles in this category
        </div>
      )}
    </div>
  );
}