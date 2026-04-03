import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { initializeAuth, getAuth, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import firebaseConfig from '../firebase';
import { fetchWithFailover, clearServerCache } from '../services/api';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  location_city?: string | null;
  location_area?: string | null;
  preferred_language: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
  updateLanguage: (lang: string) => Promise<void>;
  updateLocation: (lat: number, lng: number) => Promise<void>;
  isAuthenticated: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
  address?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_ENDPOINT = '/api';

function useApi() {
  return { fetchWithFailover };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const { i18n } = useTranslation();

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  useEffect(() => {
    if (user?.preferred_language && user.preferred_language !== i18n.language) {
      i18n.changeLanguage(user.preferred_language);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await fetchWithFailover(`${API_ENDPOINT}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        logout();
      }
    } catch {
      logout();
    }
  };

  const login = async (email: string, password: string) => {
    const res = await fetchWithFailover(`${API_ENDPOINT}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();
    
    const res = await fetchWithFailover(`${API_ENDPOINT}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Google login failed');
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const loginWithToken = async (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const register = async (regData: RegisterData) => {
    const lang = i18n.language;
    const res = await fetchWithFailover(`${API_ENDPOINT}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...regData, preferred_language: lang }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    clearServerCache();
    firebaseSignOut(auth).catch(console.error);
  };

  const updateLanguage = async (lang: string) => {
    i18n.changeLanguage(lang);
    if (token) {
      await fetchWithFailover(`${API_ENDPOINT}/auth/language`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ preferred_language: lang }),
      });
      if (user) {
        setUser({ ...user, preferred_language: lang });
      }
    }
  };

  const updateLocation = async (latitude: number, longitude: number) => {
    if (!token) return;
    
    try {
      const res = await fetchWithFailover(`${API_ENDPOINT}/auth/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ latitude, longitude }),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (user) {
          setUser({
            ...user,
            latitude,
            longitude,
            location_city: data.location?.city,
            location_area: data.location?.area,
          });
        }
      }
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, loginWithGoogle, register, loginWithToken, logout, updateLanguage, updateLocation, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
