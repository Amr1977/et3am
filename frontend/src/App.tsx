import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { SoundProvider } from './context/SoundContext';
import { CrashLoggingProvider } from './context/CrashLoggingContext';
import { useRTL } from './hooks/useRTL';
import { logError } from './utils/logger';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LocationPrompt from './components/LocationPrompt';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Donations from './pages/Donations';
import Chat from './pages/Chat';
import Support from './pages/Support';
import Admin from './pages/Admin';
import UserProfile from './pages/UserProfile';
import Settings from './pages/Settings';
import MealDetails from './pages/MealDetails';
import MyDonations from './pages/MyDonations';
import MyReservations from './pages/MyReservations';

function OAuthCallbackHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      loginWithToken(token).then(() => navigate('/dashboard'));
    }
  }, [searchParams, loginWithToken, navigate, token]);

  if (!token) return null;

  return <div className="loading-page">Signing in...</div>;
}

function AppContent() {
  useRTL();

  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/donations" element={<Donations />} />
          <Route path="/donations/:id" element={<MealDetails />} />
          <Route path="/my-donations" element={<MyDonations />} />
          <Route path="/my-reservations" element={<MyReservations />} />
          <Route path="/chat/:donationId" element={<Chat />} />
          <Route path="/support" element={<Support />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/profile/:userId" element={<UserProfile />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      <Footer />
      <LocationPrompt />
      <OAuthCallbackHandler />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <SoundProvider>
            <CrashLoggingProvider>
              <AppContent />
            </CrashLoggingProvider>
          </SoundProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}