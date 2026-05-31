import { useState, useEffect, useCallback } from 'react';
import type { GithubUser } from '../types';
import { api } from '../services/api';

const GITHUB_AUTH_URL = `https://github.com/login/oauth/authorize?client_id=${
  import.meta.env.VITE_GITHUB_CLIENT_ID || ''
}&scope=repo,user&redirect_uri=${window.location.origin}/auth/callback`;

export function useAuth() {
  const [user, setUser] = useState<GithubUser | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('luwiai_token')
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.auth
        .getMe()
        .then((data) => setUser(data.user))
        .catch(() => {
          localStorage.removeItem('luwiai_token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = useCallback(async (code: string) => {
    const data = await api.auth.loginWithGithub(code);
    localStorage.setItem('luwiai_token', data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('luwiai_token');
    setToken(null);
    setUser(null);
  }, []);

  const loginUrl = GITHUB_AUTH_URL;

  return { user, token, loading, login, logout, loginUrl, isAuthenticated: !!token && !!user };
}