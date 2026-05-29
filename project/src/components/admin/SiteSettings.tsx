import { useEffect, useState } from 'react';
import axios from 'axios';
import { Globe, Save } from 'lucide-react';
import { API_BASE_URL } from '../../lib/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function SiteSettings() {
  const [languageToggleEnabled, setLanguageToggleEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/site-settings`, {
        headers: authHeaders(),
      });
      setLanguageToggleEnabled(res.data.languageToggleEnabled === true);
    } catch (error) {
      console.error('Error fetching site settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await axios.put(
        `${API_BASE_URL}/admin/site-settings`,
        { languageToggleEnabled },
        { headers: authHeaders() }
      );
      setLanguageToggleEnabled(res.data.languageToggleEnabled === true);
      setMessage({
        type: 'success',
        text: res.data.languageToggleEnabled
          ? 'Language switcher is now visible on cottonunique.com and cottonunique.de.'
          : 'Language switcher is hidden on all public pages.',
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      setMessage({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Failed to save settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Globe className="text-emerald-600" size={28} />
          Site Settings
        </h1>
        <p className="text-slate-600 mt-2">
          Control global options for the public website (cottonunique.com and cottonunique.de).
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Language switcher (EN / DE)</h2>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              When enabled, visitors see the EN | DE toggle in the header (to the right of
              &quot;Get a Quote&quot;). On cottonunique.de, German content is still shown by default;
              on cottonunique.com, visitors can switch to German translations.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={languageToggleEnabled}
              onChange={(e) => setLanguageToggleEnabled(e.target.checked)}
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
          </label>
        </div>

        {message ? (
          <p
            className={`text-sm rounded-lg px-4 py-3 ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-60"
        >
          <Save size={18} />
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </div>
  );
}
