import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  MessageSquare, 
  ClipboardList,
  FileText, 
  LogOut, 
  Menu, 
  X,
  User,
  MessageCircle,
  Mail,
  Globe
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Inquiries', href: '/admin/inquiries', icon: MessageSquare },
    { name: 'Requested Samples', href: '/admin/sample-requests', icon: ClipboardList },
    { name: 'Content', href: '/admin/content', icon: FileText },
    { name: 'Site Settings', href: '/admin/site-settings', icon: Globe },
    { name: 'Email / SMTP', href: '/admin/smtp', icon: Mail },
    { name: 'Chatbot Control', href: '/admin/chatbot', icon: MessageCircle },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
          <h1 className="text-xl font-bold text-emerald-600">Cottonunique Admin</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-500 hover:text-slate-700"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="mt-6 px-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2 mb-1 text-sm font-medium rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} className="mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
          <div className="flex items-center mb-3">
            <div className="bg-emerald-100 w-8 h-8 rounded-full flex items-center justify-center mr-3">
              <User size={16} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{user?.username}</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={16} className="mr-2" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-slate-200">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-500 hover:text-slate-700"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-500">
                Welcome back, {user?.username}
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}