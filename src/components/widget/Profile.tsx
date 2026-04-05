import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores';

// 配置信息（可以从配置文件读取）
const profileConfig = {
  avatar: '',
  name: '博客作者',
  bio: '欢迎来到我的博客！',
  links: [
    { name: 'GitHub', icon: 'fa6-brands:github', url: 'https://github.com' },
  ],
};

export function Profile() {
  const { user, isAuthenticated } = useAuthStore();

  // 使用登录用户信息或默认配置
  const displayName = user?.nickname || user?.username || profileConfig.name;
  const displayBio = user?.bio || profileConfig.bio;
  const displayAvatar = user?.avatar_url || profileConfig.avatar;

  return (
    <div className="card-base p-3">
      {/* 头像 */}
      <Link
        to="/about"
        className="group block relative mx-auto mt-1 lg:mx-0 lg:mt-0 mb-3
          max-w-[12rem] lg:max-w-none overflow-hidden rounded-xl active:scale-95"
      >
        <div className="absolute transition pointer-events-none group-hover:bg-black/30 group-active:bg-black/50
          w-full h-full z-50 flex items-center justify-center">
          <Icon
            icon="fa6-regular:address-card"
            className="transition opacity-0 scale-90 group-hover:scale-100 group-hover:opacity-100 text-white text-5xl"
          />
        </div>
        {displayAvatar ? (
          <img
            src={displayAvatar}
            alt="头像"
            className="mx-auto lg:w-full h-full object-cover rounded-xl"
          />
        ) : (
          <div className="mx-auto lg:w-full h-32 lg:h-40 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] rounded-xl flex items-center justify-center">
            <Icon icon="material-symbols:person-outline-rounded" className="text-4xl text-white" />
          </div>
        )}
      </Link>

      {/* 个人信息 */}
      <div className="px-2">
        <div className="font-bold text-xl text-center mb-1 text-90 transition">
          {displayName}
        </div>
        <div className="h-1 w-5 bg-[var(--primary)] mx-auto rounded-full mb-2 transition" />
        <div className="text-center text-50 mb-2.5 transition">
          {displayBio}
        </div>

        {/* 社交链接 */}
        <div className="flex flex-wrap gap-2 justify-center mb-1">
          {isAuthenticated ? (
            <Link
              to="/admin"
              className="btn-regular rounded-lg h-10 gap-2 px-3 font-bold active:scale-95"
            >
              <Icon icon="material-symbols:dashboard-outline-rounded" className="text-[1.25rem]" />
              管理后台
            </Link>
          ) : (
            <>
              {profileConfig.links.length > 1 ? (
                profileConfig.links.map((item, index) => (
                  <a
                    key={index}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-regular rounded-lg h-10 w-10 active:scale-90"
                    aria-label={item.name}
                  >
                    <Icon icon={item.icon} className="text-[1.5rem]" />
                  </a>
                ))
              ) : profileConfig.links.length === 1 && profileConfig.links[0] ? (
                <a
                  href={profileConfig.links[0].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-regular rounded-lg h-10 gap-2 px-3 font-bold active:scale-95"
                  aria-label={profileConfig.links[0].name}
                >
                  <Icon icon={profileConfig.links[0].icon} className="text-[1.5rem]" />
                  {profileConfig.links[0].name}
                </a>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}