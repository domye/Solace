import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores';

export function useRequireAuth(redirectUrl = '/login') {
  const { isAuthenticated, accessToken } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      navigate(redirectUrl, {
        state: { from: location.pathname },
      });
    }
  }, [isAuthenticated, accessToken, navigate, redirectUrl, location]);

  return { isAuthenticated, accessToken };
}

export function useRedirectIfAuthenticated(redirectUrl = '/') {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectUrl);
    }
  }, [isAuthenticated, navigate, redirectUrl]);
}