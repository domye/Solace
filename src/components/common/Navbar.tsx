import { Icon } from '@iconify/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { ThemeToggle } from './ThemeToggle';
import { SearchModal } from '../widget/SearchModal';
import { useState } from 'react';

const navLinks = [
  { name: 'Home', path: '/', icon: 'material-symbols:home-outline-rounded' },
  { name: 'Archive', path: '/archive', icon: 'material-symbols:archive-outline-rounded' },
];

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <div className="z-50 onload-animation">
        <div className="card-base max-w-[var(--page-width)] h-[4.5rem] !rounded-t-none mx-auto flex items-center justify-between px-4">
          {/* Logo */}
          <Link
            to="/"
            className="btn-plain scale-animation rounded-lg h-[3.25rem] px-5 font-bold active:scale-95"
          >
            <div className="flex items-center text-[var(--primary)] text-md">
              <Icon icon="material-symbols:home-outline-rounded" className="text-[1.75rem] mb-1 mr-2" />
              <span>Blog</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="btn-plain scale-animation rounded-lg h-11 font-bold px-5 active:scale-95"
              >
                {link.name}
              </Link>
            ))}
            {isAuthenticated && (
              <Link
                to="/admin"
                className="btn-plain scale-animation rounded-lg h-11 font-bold px-5 active:scale-95"
              >
                Admin
              </Link>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <button
              onClick={() => setShowSearch(true)}
              className="btn-plain scale-animation rounded-lg h-11 w-11 active:scale-90"
              aria-label="Search"
            >
              <Icon icon="material-symbols:search-rounded" className="text-[1.25rem]" />
            </button>

            <ThemeToggle />

            {/* Auth */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-75 text-sm">{user?.username}</span>
                <button
                  onClick={handleLogout}
                  className="btn-plain scale-animation rounded-lg h-11 px-4 active:scale-95 text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-1">
                <Link
                  to="/login"
                  className="btn-plain scale-animation rounded-lg h-11 px-4 active:scale-95 text-sm"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-regular scale-animation rounded-lg h-11 px-4 active:scale-95 text-sm"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="btn-plain scale-animation rounded-lg w-11 h-11 active:scale-90 md:hidden"
              aria-label="Menu"
            >
              <Icon icon="material-symbols:menu-rounded" className="text-[1.25rem]" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="float-panel mt-2 p-4 mx-4 md:hidden">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setShowMobileMenu(false)}
                  className="btn-plain rounded-lg h-11 px-4"
                >
                  <Icon icon={link.icon} className="mr-2" />
                  {link.name}
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  <Link
                    to="/admin"
                    onClick={() => setShowMobileMenu(false)}
                    className="btn-plain rounded-lg h-11 px-4"
                  >
                    <Icon icon="material-symbols:dashboard-outline-rounded" className="mr-2" />
                    Admin
                  </Link>
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      handleLogout();
                    }}
                    className="btn-plain rounded-lg h-11 px-4"
                  >
                    <Icon icon="material-symbols:logout-rounded" className="mr-2" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setShowMobileMenu(false)}
                    className="btn-plain rounded-lg h-11 px-4"
                  >
                    <Icon icon="material-symbols:login-rounded" className="mr-2" />
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setShowMobileMenu(false)}
                    className="btn-regular rounded-lg h-11 px-4"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Search Modal */}
      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
}