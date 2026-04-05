import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores';

export function ProfileWidget() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <div className="card-base p-6">
        <div className="text-center mb-4">
          <div className="w-20 h-20 rounded-full bg-[var(--btn-regular-bg)] mx-auto mb-4 flex items-center justify-center">
            <Icon icon="material-symbols:person-outline-rounded" className="text-3xl text-50" />
          </div>
          <div className="text-90 font-bold mb-2">Guest</div>
          <div className="text-50 text-sm">Login to access admin features</div>
        </div>
        <Link
          to="/login"
          className="btn-regular rounded-lg w-full py-3 text-center font-medium"
        >
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="card-base p-6">
      <div className="text-center mb-4">
        {user?.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.username}
            className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-[var(--primary)]/20 mx-auto mb-4 flex items-center justify-center">
            <Icon icon="material-symbols:person-outline-rounded" className="text-3xl text-[var(--primary)]" />
          </div>
        )}
        <div className="text-90 font-bold mb-1">{user?.nickname || user?.username}</div>
        <div className="text-50 text-sm">{user?.bio || 'No bio yet'}</div>
      </div>
      <Link
        to="/admin"
        className="btn-regular rounded-lg w-full py-3 text-center font-medium"
      >
        Dashboard
      </Link>
    </div>
  );
}