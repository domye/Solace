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

  // 加载现有文章数据
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
      setError('标题不能为空');
      return;
    }

    if (!content.trim()) {
      setError('内容不能为空');
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
      setError(err instanceof Error ? err.message : '保存失败');
    }
  };

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="card-base p-6 fade-in-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--klein-blue)] to-[var(--sky-blue)] flex items-center justify-center">
            <Icon icon={isEdit ? 'material-symbols:edit-outline-rounded' : 'material-symbols:add-rounded'} className="text-xl text-white" />
          </div>
          <h1 className="text-90 text-xl font-bold">
            {isEdit ? '编辑文章' : '新建文章'}
          </h1>
        </div>
      </div>

      {/* 表单 */}
      <form onSubmit={handleSubmit} className="card-base p-6 fade-in-up" style={{ animationDelay: '0.1s' }}>
        {error && (
          <div className="bg-red-500/10 text-red-500 rounded-[var(--radius-medium)] p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <InputField
          label="标题"
          value={title}
          onChange={setTitle}
          placeholder="文章标题"
          required
        />

        <TextAreaField
          label="摘要"
          value={summary}
          onChange={setSummary}
          placeholder="文章简要摘要"
          rows={2}
        />

        <TextAreaField
          label="内容"
          value={content}
          onChange={setContent}
          placeholder="在这里撰写文章内容..."
          rows={20}
          required
        />

        {/* 状态 */}
        <div className="mb-6">
          <label className="block text-75 text-sm font-medium mb-2">状态</label>
          <div className="flex gap-2">
            {Object.values(request_CreateArticleRequest.status).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`rounded-[var(--radius-medium)] py-2 px-4 text-sm font-medium transition-all scale-animation ripple ${
                  status === s
                    ? 'bg-gradient-to-r from-[var(--klein-blue)] to-[var(--klein-blue-light)] text-white'
                    : 'btn-regular'
                }`}
              >
                <Icon
                  icon={s === 'published' ? 'material-symbols:public-rounded' : 'material-symbols:edit-note-rounded'}
                  className="mr-1"
                />
                {s === 'published' ? '发布' : '草稿'}
              </button>
            ))}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <LoadingButton
            type="submit"
            loading={createMutation.isPending || updateMutation.isPending}
            className="bg-gradient-to-r from-[var(--klein-blue)] to-[var(--klein-blue-light)] text-white"
          >
            {isEdit ? '更新' : '创建'}
          </LoadingButton>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="btn-plain rounded-[var(--radius-medium)] py-3 px-6 scale-animation ripple"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}