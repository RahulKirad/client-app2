import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminLogin from '../components/admin/AdminLogin';
import AdminLayout from '../components/admin/AdminLayout';
import Dashboard from '../components/admin/Dashboard';
import ProductsManager from '../components/admin/ProductsManager';
import InquiriesManager from '../components/admin/InquiriesManager';
import RequestedSamplesManager from '../components/admin/RequestedSamplesManager';
import ContentManager from '../components/admin/ContentManager';
import ChatbotControl from '../components/admin/ChatbotControl';
import SmtpSettings from '../components/admin/SmtpSettings';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <AdminLogin />;
  }

  return <>{children}</>;
}

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={
        <ProtectedRoute>
          <AdminLayout>
            <Dashboard />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/products" element={
        <ProtectedRoute>
          <AdminLayout>
            <ProductsManager />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/inquiries" element={
        <ProtectedRoute>
          <AdminLayout>
            <InquiriesManager />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/sample-requests" element={
        <ProtectedRoute>
          <AdminLayout>
            <RequestedSamplesManager />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/content" element={
        <ProtectedRoute>
          <AdminLayout>
            <ContentManager />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/chatbot" element={
        <ProtectedRoute>
          <AdminLayout>
            <ChatbotControl />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/smtp" element={
        <ProtectedRoute>
          <AdminLayout>
            <SmtpSettings />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}