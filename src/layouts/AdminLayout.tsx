import { Outlet } from 'react-router-dom';
import { Navbar, Footer } from '@/components/common';
import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores';

export function AdminLayout() {
  const { user } = useAuthStore();

  const navItems = [
    { name: 'Articles', path: '/admin', icon: 'material-symbols:article-outline-rounded' },
    { name: 'New Article', path: '/admin/articles/new', icon: 'material-symbols:add-rounded' },
    { name: 'Profile', path: '/admin/profile', icon: 'material-symbols:person-outline-rounded' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-[var(--page-width)] mx-auto w-full px-4 py-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Admin Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="card-base p-4 mb-4">
              <div className="text-75 text-sm font-medium mb-2">Admin Dashboard</div>
              {user && (
                <div className="text-50 text-xs">
                  {user.nickname || user.username}
                </div>
              )}
            </div>

            <div className="card-base p-2">
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="btn-plain rounded-lg py-2 px-3 text-sm"
                  >
                    <Icon icon={item.icon} className="mr-2 text-lg" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          {/* Admin Content */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}