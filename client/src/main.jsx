import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { ClerkProvider, SignIn, SignUp } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';

import './index.css';
import App from './App.jsx';
import OAuthCallback from './pages/OAuthCallback.jsx';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey)  {
  throw new Error("Missing Clerk publishable key in environment variables.");
}

// ✅ You need this wrapper component to connect ClerkProvider with React Router navigate()
const ClerkWithRoutes = () => {
  const navigate = useNavigate();

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} navigate={navigate}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />
        <Route path="/sign-in" element={<SignIn routing="path" path="/sign-in" />} />
        <Route path="/sign-up" element={<SignUp routing="path" path="/sign-up" />} />
        <Route path="/sign-in/sso-callback" element={<Navigate to="/" />} />
        <Route path="/sign-up/sso-callback" element={<Navigate to="/" />} />
      </Routes>
    </ClerkProvider>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ClerkWithRoutes />
    </BrowserRouter>
  </StrictMode>
);