import React, { useState, useEffect } from 'react';
import { Mail, Save, Loader2, Send } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../lib/api';

interface SmtpView {
  emailUser: string;
  hasAppPassword: boolean;
  sendingWith: 'database' | 'env' | 'none';
  updatedAt: string | null;
}

const fieldClass =
  'w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500';

export default function SmtpSettings() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [view, setView] = useState<SmtpView | null>(null);
  const [emailUser, setEmailUser] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [clearAppPassword, setClearAppPassword] = useState(false);
  const [testTo, setTestTo] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const authHeaders = () => {
    const t = token ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') : null);
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get<SmtpView>(`${API_BASE_URL}/admin/smtp-settings`, { headers: authHeaders() });
      setView(res.data);
      setEmailUser(res.data.emailUser || '');
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Failed to load SMTP settings.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = token ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') : null);
    if (t) fetchSettings();
    else setLoading(false);
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const body: {
        emailUser: string;
        appPassword?: string;
        clearAppPassword?: boolean;
      } = { emailUser: emailUser.trim() };
      if (clearAppPassword) {
        body.clearAppPassword = true;
      } else if (appPassword.trim()) {
        body.appPassword = appPassword.trim();
      }
      const res = await axios.put<SmtpView & { message?: string }>(
        `${API_BASE_URL}/admin/smtp-settings`,
        body,
        { headers: { ...authHeaders(), 'Content-Type': 'application/json' } }
      );
      const d = res.data;
      if (d?.emailUser !== undefined) {
        setView({
          emailUser: d.emailUser,
          hasAppPassword: d.hasAppPassword,
          sendingWith: d.sendingWith,
          updatedAt: d.updatedAt,
        });
      } else {
        await fetchSettings();
      }
      setMessage({
        type: 'success',
        text: d?.message || 'SMTP settings saved. Inquiry emails will use these credentials.',
      });
      setAppPassword('');
      setClearAppPassword(false);
    } catch (err: unknown) {
      const ax = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: { error?: string } } }).response : null;
      setMessage({ type: 'error', text: ax?.data?.error || 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setMessage(null);
    const to = testTo.trim();
    if (!to) {
      setMessage({ type: 'error', text: 'Enter an email address to send the test to.' });
      return;
    }
    setTesting(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/admin/smtp-settings/test`,
        { to },
        { headers: { ...authHeaders(), 'Content-Type': 'application/json' } }
      );
      setMessage({ type: 'success', text: (res.data as { message?: string })?.message || 'Test email sent.' });
    } catch (err: unknown) {
      const ax = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: { error?: string } } }).response : null;
      setMessage({ type: 'error', text: ax?.data?.error || 'Test send failed. Check credentials (Gmail needs an App Password).' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  const withLabel = (id: string, label: string, children: React.ReactNode) => (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Mail className="h-8 w-8 text-emerald-600" />
          Email / SMTP
        </h1>
        <p className="text-slate-600">
          Configure the Gmail (or other SMTP) account used to send contact-form inquiry notifications. Saved here takes priority
          over <code className="text-sm bg-slate-100 px-1 rounded">EMAIL_USER</code> /{' '}
          <code className="text-sm bg-slate-100 px-1 rounded">EMAIL_APP_PASSWORD</code> in the server environment.
        </p>
      </div>

      {view && (
        <div className="mb-6 p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700">
          <p className="font-medium text-slate-800">Inquiry delivery source</p>
          <p className="mt-1">
            {view.sendingWith === 'database' && (
              <span className="text-emerald-800">
                Using credentials <strong>saved in the database</strong> (this page).
                {view.updatedAt && (
                  <span className="text-slate-500"> Last updated: {new Date(view.updatedAt).toLocaleString()}</span>
                )}
              </span>
            )}
            {view.sendingWith === 'env' && (
              <span>
                Using <strong>environment variables</strong> on the server. Save valid email + app password below to store settings in
                the database and override .env.
              </span>
            )}
            {view.sendingWith === 'none' && (
              <span className="text-amber-800">No working SMTP: configure below or set EMAIL_USER and EMAIL_APP_PASSWORD in .env.</span>
            )}
          </p>
        </div>
      )}

      {message && (
        <div
          className={`mb-6 p-3 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {withLabel(
          'smtp-email',
          'Sending email address (Gmail)',
          <input
            id="smtp-email"
            type="email"
            className={fieldClass}
            value={emailUser}
            onChange={(e) => setEmailUser(e.target.value)}
            placeholder="you@gmail.com"
            autoComplete="off"
            required
          />
        )}

        {withLabel(
          'smtp-app-pw',
          'Gmail app password',
          <>
            <input
              id="smtp-app-pw"
              type="password"
              className={fieldClass}
              value={appPassword}
              onChange={(e) => {
                setAppPassword(e.target.value);
                if (e.target.value) setClearAppPassword(false);
              }}
              placeholder={view?.hasAppPassword ? '•••••••• (leave blank to keep current)' : '16-character app password'}
              autoComplete="new-password"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Use a Google <strong>App password</strong>, not your normal Gmail password (
              <a
                className="text-emerald-700 underline"
                href="https://support.google.com/accounts/answer/185833"
                target="_blank"
                rel="noreferrer"
              >
                how to create
              </a>
              ).{view?.hasAppPassword && ' Leave blank to keep the stored password.'}
            </p>
            {view?.hasAppPassword && (
              <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={clearAppPassword}
                  onChange={(e) => {
                    setClearAppPassword(e.target.checked);
                    if (e.target.checked) setAppPassword('');
                  }}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                Remove stored app password (server will fall back to .env if set)
              </label>
            )}
          </>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save settings
          </button>
        </div>
      </form>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Send test email</h2>
        <p className="text-sm text-slate-600 mb-4">After saving, send a test to confirm SMTP works (inbox and spam folder).</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            className={fieldClass + ' sm:flex-1'}
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="recipient@example.com"
          />
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-800 hover:bg-slate-50 disabled:opacity-50"
          >
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send test
          </button>
        </div>
      </div>
    </div>
  );
}
