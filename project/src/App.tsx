import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import AdminRoutes from './pages/AdminRoutes';
import Chatbot from './components/Chatbot';
import CookieConsentBanner from './components/CookieConsentBanner';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <Routes>
          <Route path="/*" element={<HomePage />} />
          <Route path="/admin/*" element={<AdminRoutes />} />
        </Routes>
        <Chatbot />
        <CookieConsentBanner />
      </Router>
    </AuthProvider>
  );
}

export default App;
