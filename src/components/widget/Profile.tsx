/**
 * 个人信息组件
 */

import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { useOwner } from '@/hooks';
import { LazyImage } from '@/components/common/ui';

export function Profile() {
  const { isAuthenticated } = useAuthStore();
  const { data: owner } = useOwner();

  const displayName = owner?.nickname || '博主';
  const displayBio = owner?.bio || '欢迎来到我的博客！';
  const displayAvatar = owner?.avatar_url;
  const githubUrl = owner?.github_url;

  return (
    <div className="card-base p-3 onload-animation">
      <Link to="/about" className="group block relative mx-auto mt-1 lg:mx-0 lg:mt-0 mb-3 max-w-[12rem] lg:max-w-none overflow-hidden rounded-xl active:scale-95">
        <div className="absolute inset-0 pointer-events-none group-hover:bg-black/30 group-active:bg-black/50 z-50 flex items-center justify-center">
          <Icon icon="fa6-regular:address-card" className="opacity-0 scale-90 group-hover:scale-100 group-hover:opacity-100 text-white text-5xl transition" />
        </div>
        {displayAvatar ? (
          <LazyImage src={displayAvatar} alt="头像" className="mx-auto lg:w-full h-full object-cover rounded-xl" effect="blur" />
        ) : (
          <div className="mx-auto lg:w-full h-32 lg:h-40 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] rounded-xl flex items-center justify-center">
            <Icon icon="material-symbols:person-outline-rounded" className="text-4xl text-white" />
          </div>
        )}
      </Link>

      <div className="px-2">
        <div className="font-bold text-xl text-center mb-1 text-90">{displayName}</div>
        <div className="h-1 w-5 bg-[var(--primary)] mx-auto rounded-full mb-2" />
        <div className="text-center text-50 mb-2.5">{displayBio}</div>

        <div className="flex flex-wrap gap-2 justify-center mb-1">
          {isAuthenticated ? (
            <Link to="/admin" className="btn-regular rounded-lg h-10 gap-2 px-3 font-bold active:scale-95">
              <Icon icon="material-symbols:dashboard-outline-rounded" className="text-[1.25rem]" />
              管理后台
            </Link>
          ) : githubUrl && (
            <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="btn-regular rounded-lg h-10 gap-2 px-3 font-bold active:scale-95" aria-label="GitHub">
              <Icon icon="fa6-brands:github" className="text-[1.5rem]" />
              GitHub
            </a>
          )}
        </div>
      </div>
    </div>
  );
}