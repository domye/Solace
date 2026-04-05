import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useArticle, useCreateArticle, useUpdateArticle } from '@/hooks';
import { LoadingButton, InputField, TextAreaField } from '@/components';
import { Icon } from '@iconify/react';
import { request_CreateArticleRequest } from '@/api';

export function ArticleEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: existingArticle } = useArticle(Number(id) || 0);
  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [status, setStatus] = useState<request_CreateArticleRequest.status>(request_CreateArticleRequest.status.DRAFT);
  const [error, setError] = useState('');

  // Load existing article data
  useEffect(() => {
    if (existingArticle) {
      setTitle(existingArticle.title);
      setContent(existingArticle.content);
      setSummary(existingArticle.summary || '');
      setStatus(existingArticle.status as request_CreateArticleRequest.status);
    }
  }, [existingArticle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({
          id: Number(id),
          data: {
            title,
            content,
            summary,
            status,
            version: existingArticle?.version || 1,
          },
        });
        navigate('/admin');
      } else {
        await createMutation.mutateAsync({
          title,
          content,
          summary,
          status,
        });
        navigate('/admin');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="card-base p-6 mb-4">
        <h1 className="text-90 text-2xl font-bold">
          {isEdit ? 'Edit Article' : 'New Article'}
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card-base p-6">
        {error && (
          <div className="bg-red-500/10 text-red-500 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <InputField
          label="Title"
          value={title}
          onChange={setTitle}
          placeholder="Article title"
          required
        />

        <TextAreaField
          label="Summary"
          value={summary}
          onChange={setSummary}
          placeholder="Brief summary of the article"
          rows={2}
        />

        <TextAreaField
          label="Content"
          value={content}
          onChange={setContent}
          placeholder="Write your article content here..."
          rows={20}
          required
        />

        {/* Status */}
        <div className="mb-4">
          <label className="block text-75 text-sm font-medium mb-2">Status</label>
          <div className="flex gap-2">
            {Object.values(request_CreateArticleRequest.status).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`btn-plain rounded-lg py-2 px-4 text-sm ${
                  status === s
                    ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-medium'
                    : ''
                }`}
              >
                <Icon
                  icon={s === 'published' ? 'material-symbols:public-rounded' : 'material-symbols:edit-note-rounded'}
                  className="mr-1"
                />
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <LoadingButton
            type="submit"
            loading={createMutation.isPending || updateMutation.isPending}
          >
            {isEdit ? 'Update' : 'Create'}
          </LoadingButton>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="btn-plain rounded-lg py-3 px-6"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}