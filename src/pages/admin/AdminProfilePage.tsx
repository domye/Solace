import { useState } from 'react';
import { useCurrentUser, useUpdateUser } from '@/hooks';
import { LoadingButton, InputField, TextAreaField } from '@/components';
import { Icon } from '@iconify/react';

export function AdminProfilePage() {
  const { data: user } = useCurrentUser();
  const updateMutation = useUpdateUser();

  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initialize form
  useState(() => {
    if (user) {
      setNickname(user.nickname || '');
      setAvatarUrl(user.avatar_url || '');
      setBio(user.bio || '');
    }
  });

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
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="card-base p-6 mb-4">
        <h1 className="text-90 text-2xl font-bold">Profile</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card-base p-6">
        {error && (
          <div className="bg-red-500/10 text-red-500 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 text-green-600 rounded-lg p-3 mb-4 text-sm">
            {success}
          </div>
        )}

        {/* Avatar Preview */}
        <div className="mb-6 text-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-20 h-20 rounded-full mx-auto object-cover mb-2"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[var(--btn-regular-bg)] mx-auto mb-2 flex items-center justify-center">
              <Icon icon="material-symbols:person-outline-rounded" className="text-3xl text-50" />
            </div>
          )}
        </div>

        <InputField
          label="Nickname"
          value={nickname}
          onChange={setNickname}
          placeholder="Display name"
        />

        <InputField
          label="Avatar URL"
          value={avatarUrl}
          onChange={setAvatarUrl}
          placeholder="https://example.com/avatar.png"
          type="url"
        />

        <TextAreaField
          label="Bio"
          value={bio}
          onChange={setBio}
          placeholder="Tell us about yourself"
          rows={3}
        />

        {/* Read-only info */}
        <div className="border-t border-black/10 dark:border-white/10 pt-4 mt-4">
          <div className="text-50 text-sm space-y-1">
            <div>Username: {user?.username}</div>
            <div>Email: {user?.email}</div>
            <div>Role: {user?.role}</div>
          </div>
        </div>

        <div className="mt-6">
          <LoadingButton type="submit" loading={updateMutation.isPending}>
            Save Changes
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}