import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, User, Eye, EyeOff, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute -bottom-24 left-1/4 h-80 w-80 rounded-full bg-teal-500/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.08),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(56,189,248,0.08),transparent_40%)]" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-6 items-stretch">
          {/* Branding / value side */}
          <div className="hidden lg:flex rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 flex-col justify-between shadow-2xl">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-emerald-200 text-sm font-medium">
                <Sparkles size={14} />
                Secure Admin Access
              </div>
              <h2 className="mt-6 text-4xl font-bold text-white leading-tight">
                Cottonunique
                <br />
                Control Center
              </h2>
              <p className="mt-4 text-slate-300 leading-relaxed">
                Manage products, inquiries, and content from one protected dashboard built for reliable business operations.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-200">
                <ShieldCheck size={18} className="text-emerald-300" />
                <span className="text-sm">Encrypted authentication and token-protected sessions</span>
              </div>
              <div className="flex items-center gap-3 text-slate-200">
                <ShieldCheck size={18} className="text-emerald-300" />
                <span className="text-sm">Real-time access to product and inquiry management</span>
              </div>
              <div className="flex items-center gap-3 text-slate-200">
                <ShieldCheck size={18} className="text-emerald-300" />
                <span className="text-sm">Optimized for desktop and on-the-go administration</span>
              </div>
            </div>
          </div>

          {/* Login card */}
          <div className="rounded-3xl border border-white/20 bg-white/90 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.35)] p-6 sm:p-8 md:p-10">
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <Lock className="text-white" size={30} />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Login</h1>
              <p className="text-slate-600">Sign in to access Cottonunique Admin Panel</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-slate-700 mb-2">
                  Email / Username
                </label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl bg-white/90 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                    placeholder="Enter email or username"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-xl bg-white/90 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                    placeholder="Enter password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3.5 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 font-semibold disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
                {!isLoading && <ArrowRight size={18} />}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500">
              Protected area. Authorized administrators only.
            </p>
          </div>
      </div>
    </div>
    </div>
  );
}