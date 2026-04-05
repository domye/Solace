import { useState } from 'react';
import { useCurrentUser, useUpdateUser } from '@/hooks';
import { LoadingButton, InputField, TextAreaField } from '@/components';
import { Icon } from '@iconify/react';

export function AdminProfilePage() {
  const { data: user } = useCurrentUser();
  const updateMutation = useUpdateUser();

  const [nickname, setNickname] = useState(user?.nickname || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await updateMutation.mutateAsync({
        nickname,
        avatar_url: avatarUrl,
        bio,
      });
      setSuccess('个人资料更新成功');
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
    }
  };

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="card-base p-6 fade-in-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--klein-blue)] to-[var(--sky-blue)] flex items-center justify-center">
            <Icon icon="material-symbols:person-outline-rounded" className="text-xl text-white" />
          </div>
          <h1 className="text-90 text-xl font-bold">个人设置</h1>
        </div>
      </div>

      {/* 表单 */}
      <form onSubmit={handleSubmit} className="card-base p-6 fade-in-up" style={{ animationDelay: '0.1s' }}>
        {error && (
          <div className="bg-red-500/10 text-red-500 rounded-[var(--radius-medium)] p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 text-green-600 rounded-[var(--radius-medium)] p-3 mb-4 text-sm">
            {success}
          </div>
        )}

        {/* 头像预览 */}
        <div className="mb-6 text-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="头像"
              className="w-24 h-24 rounded-full mx-auto object-cover ring-4 ring-[var(--primary)]/20 mb-2 breathing"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--klein-blue)] to-[var(--sky-blue)] mx-auto mb-2 flex items-center justify-center breathing">
              <Icon icon="material-symbols:person-outline-rounded" className="text-4xl text-white" />
            </div>
          )}
        </div>

        <InputField
          label="昵称"
          value={nickname}
          onChange={setNickname}
          placeholder="显示名称"
        />

        <InputField
          label="头像链接"
          value={avatarUrl}
          onChange={setAvatarUrl}
          placeholder="https://example.com/avatar.png"
          type="url"
        />

        <TextAreaField
          label="个人简介"
          value={bio}
          onChange={setBio}
          placeholder="介绍一下你自己"
          rows={3}
        />

        {/* 只读信息 */}
        <div className="border-t border-[var(--border-light)] pt-4 mt-4">
          <div className="text-50 text-sm space-y-1">
            <div className="flex items-center gap-2">
              <Icon icon="material-symbols:badge-outline-rounded" className="text-base" />
              用户名：<span className="text-75">{user?.username}</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon="material-symbols:mail-outline-rounded" className="text-base" />
              邮箱：<span className="text-75">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon="material-symbols:shield-outline-rounded" className="text-base" />
              角色：<span className="text-75">{user?.role}</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <LoadingButton
            type="submit"
            loading={updateMutation.isPending}
            className="bg-gradient-to-r from-[var(--klein-blue)] to-[var(--klein-blue-light)] text-white"
          >
            保存更改
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}