import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, firebaseConfig } from '../firebase';
import { fetchWithFailover, clearServerCache } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  can_donate: boolean;
  can_receive: boolean;
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
    console.log('[AUTH] Starting Google login...');
    console.log('[AUTH] Firebase config projectId:', firebaseConfig.projectId);
    
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    provider.addScope('profile');
    provider.addScope('email');
    
    console.log('[AUTH] Opening sign-in popup...');
    const result = await signInWithPopup(auth, provider);
    console.log('[AUTH] User signed in:', result.user.email);
    console.log('[AUTH] User UID:', result.user.uid);
    
    const idToken = await result.user.getIdToken();
    
    // Log raw token details
    console.log('[AUTH] ========== RAW TOKEN ==========');
    console.log('[AUTH] Token length:', idToken.length);
    console.log('[AUTH] Token hash (MD5):', await md5(idToken));
    console.log('[AUTH] Token hash (SHA256):', await sha256(idToken));
    console.log('[AUTH] First 100 chars:', idToken.substring(0, 100));
    console.log('[AUTH] Last 100 chars:', idToken.substring(idToken.length - 100));
    console.log('[AUTH] =================================');
    
    // Decode and log token parts
    const tokenParts = idToken.split('.');
    console.log('[AUTH] Token has', tokenParts.length, 'parts');
    
    // Header
    try {
      const header = JSON.parse(atob(tokenParts[0]));
      console.log('[AUTH] ===== TOKEN HEADER =====');
      console.log('[AUTH] alg:', header.alg);
      console.log('[AUTH] kid:', header.kid);
      console.log('[AUTH] typ:', header.typ);
      console.log('[AUTH] Raw header base64:', tokenParts[0]);
    } catch (e) {
      console.error('[AUTH] Failed to decode header:', e);
    }
    
    // Payload
    try {
      const payload = JSON.parse(atob(tokenParts[1]));
      console.log('[AUTH] ===== TOKEN PAYLOAD =====');
      console.log('[AUTH] aud:', payload.aud);
      console.log('[AUTH] iss:', payload.iss);
      console.log('[AUTH] sub:', payload.sub);
      console.log('[AUTH] auth_time:', payload.auth_time);
      console.log('[AUTH] email:', payload.email);
      console.log('[AUTH] email_verified:', payload.email_verified);
      console.log('[AUTH] iat:', payload.iat);
      console.log('[AUTH] exp:', payload.exp);
    } catch (e) {
      console.error('[AUTH] Failed to decode payload:', e);
    }
    
    // Signature (part 3)
    console.log('[AUTH] ===== TOKEN SIGNATURE =====');
    console.log('[AUTH] Signature base64:', tokenParts[2]);
    console.log('[AUTH] Signature length:', tokenParts[2].length);
    
    console.log('[AUTH] Sending token to backend...');
    const res = await fetchWithFailover(`${API_ENDPOINT}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, _debug: { length: idToken.length, hash: await sha256(idToken) } }),
    });
    
    console.log('[AUTH] Backend response status:', res.status);
    const data = await res.json();
    console.log('[AUTH] Backend response:', data);
    
    if (!res.ok) {
      console.error('[AUTH] Login failed:', data.message);
      throw new Error(data.message || 'Google login failed');
    }
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    console.log('[AUTH] Login successful!');
  };

// Helper functions for hashing
async function md5(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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
