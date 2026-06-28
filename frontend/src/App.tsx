import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { SoundProvider } from './context/SoundContext';
import { CrashLoggingProvider } from './context/CrashLoggingContext';
import { NotificationProvider } from './context/NotificationContext';
import { useRTL } from './hooks/useRTL';
import { logError } from './utils/logger';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LocationPrompt from './components/LocationPrompt';

const Home = React.lazy(() => import('./pages/Home'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Donations = React.lazy(() => import('./pages/Donations'));
const Chat = React.lazy(() => import('./pages/Chat'));
const Support = React.lazy(() => import('./pages/Support'));
const Admin = React.lazy(() => import('./pages/Admin'));
const UserProfile = React.lazy(() => import('./pages/UserProfile'));
const Settings = React.lazy(() => import('./pages/Settings'));
const MealDetails = React.lazy(() => import('./pages/MealDetails'));
const MyDonations = React.lazy(() => import('./pages/MyDonations'));
const MyReservations = React.lazy(() => import('./pages/MyReservations'));
const About = React.lazy(() => import('./pages/About'));
const Requests = React.lazy(() => import('./pages/Requests'));
const RequestDetails = React.lazy(() => import('./pages/RequestDetails'));
const MyRequests = React.lazy(() => import('./pages/MyRequests'));
const MyFulfillments = React.lazy(() => import('./pages/MyFulfillments'));
const Downloads = React.lazy(() => import('./pages/Downloads'));
const NotificationsPage = React.lazy(() => import('./pages/NotificationsPage'));
const TestimonialsPage = React.lazy(() => import('./pages/TestimonialsPage'));
const SadaqatPage = React.lazy(() => import('./pages/SadaqatPage'));

function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid var(--color-border, #e0e0e0)',
        borderTopColor: 'var(--color-primary, #4CAF50)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

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
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
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
            <Route path="/chat/request/:requestId" element={<Chat />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/requests/:id" element={<RequestDetails />} />
            <Route path="/my-requests" element={<MyRequests />} />
            <Route path="/my-fulfillments" element={<MyFulfillments />} />
            <Route path="/support" element={<Support />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/profile/:userId" element={<UserProfile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/downloads" element={<Downloads />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/testimonials" element={<TestimonialsPage />} />
            <Route path="/sadaqat" element={<SadaqatPage />} />
          </Routes>
        </Suspense>
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
              <NotificationProvider>
                <AppContent />
              </NotificationProvider>
            </CrashLoggingProvider>
          </SoundProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}
