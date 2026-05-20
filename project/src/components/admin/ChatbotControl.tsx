import React, { useState, useEffect } from 'react';
import { MessageCircle, Save, Loader2, Stethoscope } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface ChatbotSettings {
  isEnabled: boolean;
  customInstructions: string;
  disallowedTopics: string;
  welcomeMessage: string;
  preferredModel: string;
  updatedAt: string | null;
}

interface DiagnosticStep {
  step: string;
  pass: boolean;
  detail: string;
}

interface DiagnosticResult {
  timestamp?: string;
  database?: {
    rowExists?: boolean;
    rawValue: unknown;
    rawType?: string;
    rawString?: string;
    json?: string;
  };
  publicApiLogic?: { enabled: boolean; description: string };
  steps?: DiagnosticStep[];
  possibleCauses?: string[];
  verdict?: { chatbotWillShowOnSite: boolean; suggestion: string };
  frontendNote?: string;
  error?: string;
  suggestion?: string;
  publicFetch?: { enabled: unknown; status: number; ok: boolean; error?: string };
}

export default function ChatbotControl() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [diagnosticsResult, setDiagnosticsResult] = useState<DiagnosticResult | null>(null);
  const [settings, setSettings] = useState<ChatbotSettings>({
    isEnabled: true,
    customInstructions: '',
    disallowedTopics: '',
    welcomeMessage: '',
    preferredModel: '',
    updatedAt: null,
  });
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const authHeaders = () => {
    const t = token ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') : null);
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  useEffect(() => {
    const t = token ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') : null);
    if (t) fetchSettings();
    else setLoading(false);
  }, [token]);

  const fetchModels = async () => {
    setModelsLoading(true);
    try {
      const res = await axios.get<{ models: string[] }>(`${API_BASE_URL}/chatbot/models`);
      setAvailableModels(Array.isArray(res.data?.models) ? res.data.models : []);
    } catch (_) {
      setAvailableModels([]);
    } finally {
      setModelsLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/chatbot-settings`, { headers: authHeaders() });
      const data = response.data;
      setSettings({
        isEnabled: data.isEnabled === true || data.isEnabled === 1,
        customInstructions: data.customInstructions || '',
        disallowedTopics: data.disallowedTopics || '',
        welcomeMessage: data.welcomeMessage || '',
        preferredModel: data.preferredModel ?? '',
        updatedAt: data.updatedAt || null,
      });
    } catch (error) {
      console.error('Error fetching chatbot settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await axios.put(`${API_BASE_URL}/admin/chatbot-settings`, {
        isEnabled: settings.isEnabled,
        customInstructions: settings.customInstructions || '',
        disallowedTopics: settings.disallowedTopics || '',
        welcomeMessage: settings.welcomeMessage || '',
        preferredModel: settings.preferredModel || '',
      }, { headers: authHeaders() });
      await fetchSettings();
      const savedEnabled = res.data?.isEnabled;
      setSaveMessage({
        type: 'success',
        text: savedEnabled !== undefined
          ? `Saved. Chatbot is now ${savedEnabled ? 'visible' : 'hidden'} on the site.`
          : 'Settings saved successfully.',
      });
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message || 'Failed to save. Check you are logged in and try again.';
      setSaveMessage({ type: 'error', text: msg });
      console.error('Error saving chatbot settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const runDiagnostics = async () => {
    setDiagnosticsLoading(true);
    setDiagnosticsResult(null);
    setDiagnosticsOpen(true);
    try {
      const [backendRes, publicRes] = await Promise.all([
        fetch(`${API_BASE_URL}/chatbot/visibility-diagnostics`).then((r) => {
          if (!r.ok) throw new Error(`Diagnostics failed: ${r.status}`);
          return r.json();
        }),
        fetch(`${API_BASE_URL}/chatbot/settings`).then(async (r) => {
          const ok = r.ok;
          const status = r.status;
          const data = ok ? await r.json() : {};
          return { enabled: data.enabled === true || data.enabled === 1, ok, status };
        }),
      ]);
      setDiagnosticsResult({
        ...backendRes,
        publicFetch: publicRes,
      });
    } catch (err: any) {
      setDiagnosticsResult({
        timestamp: new Date().toISOString(),
        error: err.message || 'Diagnostics failed',
        suggestion: 'Check that the backend is running and reachable.',
      });
    } finally {
      setDiagnosticsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <MessageCircle size={28} className="text-emerald-600" />
          Chatbot Control
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={runDiagnostics}
            disabled={diagnosticsLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-60 transition-colors border border-slate-300"
          >
            {diagnosticsLoading ? <Loader2 size={18} className="animate-spin" /> : <Stethoscope size={18} />}
            Run diagnostics
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save changes
          </button>
        </div>
      </div>

      {saveMessage && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg border ${
            saveMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
          role="alert"
        >
          {saveMessage.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {/* Enable / Disable */}
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Chatbot visibility</h2>
          <p className="text-sm text-slate-600 mb-4">
            When disabled, the chatbot button will be hidden from the website. Visitors will not see or use the chatbot.
          </p>
          <div className="flex items-center gap-4">
            <span className={`text-sm font-medium ${settings.isEnabled ? 'text-slate-500' : 'text-slate-900'}`}>
              Off
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={settings.isEnabled}
              onClick={() => setSettings((s) => ({ ...s, isEnabled: !s.isEnabled }))}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                settings.isEnabled ? 'bg-emerald-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.isEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${settings.isEnabled ? 'text-slate-900' : 'text-slate-500'}`}>
              On
            </span>
          </div>
        </div>

        {/* What the chatbot should respond to */}
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">What the chatbot should respond to</h2>
          <p className="text-sm text-slate-600 mb-3">
            Add extra instructions or topics the assistant should focus on. These are added to the default Cottonunique/tote bag knowledge.
          </p>
          <textarea
            value={settings.customInstructions}
            onChange={(e) => setSettings((s) => ({ ...s, customInstructions: e.target.value }))}
            placeholder="e.g. Always mention our 24-hour response time. Emphasize bulk order discounts for 500+ units."
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 placeholder-slate-400"
            rows={4}
          />
        </div>

        {/* What the chatbot should NOT respond to */}
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">What the chatbot should NOT respond to</h2>
          <p className="text-sm text-slate-600 mb-3">
            List topics, keywords, or types of requests the chatbot must refuse or redirect. One per line or comma-separated.
          </p>
          <textarea
            value={settings.disallowedTopics}
            onChange={(e) => setSettings((s) => ({ ...s, disallowedTopics: e.target.value }))}
            placeholder="e.g. politics, competitor names, pricing outside our catalog, medical advice"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 placeholder-slate-400"
            rows={3}
          />
        </div>

        {/* AI Model selection */}
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">AI model</h2>
          <p className="text-sm text-slate-600 mb-3">
            Choose which Gemini model the chatbot uses. &quot;Auto&quot; lets the server pick a working model.
          </p>
          <select
            value={settings.preferredModel}
            onChange={(e) => setSettings((s) => ({ ...s, preferredModel: e.target.value }))}
            disabled={modelsLoading}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 bg-white disabled:bg-slate-50"
          >
            <option value="">Auto (recommended)</option>
            {availableModels.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          {modelsLoading && (
            <p className="text-xs text-slate-500 mt-2">Loading models…</p>
          )}
        </div>

        {/* Welcome message */}
        <div className="px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Custom welcome message</h2>
          <p className="text-sm text-slate-600 mb-3">
            Optional first message when the user opens the chatbot. Leave blank to use the default greeting.
          </p>
          <textarea
            value={settings.welcomeMessage}
            onChange={(e) => setSettings((s) => ({ ...s, welcomeMessage: e.target.value }))}
            placeholder="e.g. Hi! I'm the Cottonunique assistant. Ask me about our tote bags, certifications, or how to place an order."
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 placeholder-slate-400"
            rows={2}
          />
        </div>
      </div>

      {settings.updatedAt && (
        <p className="text-xs text-slate-500">Last updated: {new Date(settings.updatedAt).toLocaleString()}</p>
      )}

      {/* Diagnostics popup modal */}
      {diagnosticsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setDiagnosticsOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Stethoscope size={20} className="text-slate-600" />
                Enable/Disable diagnostics
              </h2>
              <button
                onClick={() => setDiagnosticsOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>
            <div className="px-6 py-4 space-y-4 text-sm overflow-y-auto">
              {diagnosticsLoading && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Loader2 size={18} className="animate-spin" />
                  Running diagnostics…
                </div>
              )}
              {!diagnosticsLoading && diagnosticsResult && (
                <>
                  {diagnosticsResult.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
                      <strong>Error:</strong> {diagnosticsResult.error}
                      {diagnosticsResult.suggestion && <p className="mt-2">{diagnosticsResult.suggestion}</p>}
                    </div>
                  )}
                  {diagnosticsResult.steps && diagnosticsResult.steps.length > 0 && (
                    <div className="space-y-2">
                      <strong className="text-slate-700 block">Step-by-step checklist</strong>
                      {diagnosticsResult.steps.map((s, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border text-xs ${
                            s.pass ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                          }`}
                        >
                          <span className="font-medium">{s.pass ? '✓' : '✗'} {s.step}</span>
                          <p className="mt-1 text-slate-600">{s.detail}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {diagnosticsResult.database && (
                    <div className="space-y-1">
                      <strong className="text-slate-700">Database (raw)</strong>
                      <pre className="p-3 bg-slate-50 rounded border border-slate-200 text-xs overflow-x-auto whitespace-pre-wrap">
                        {diagnosticsResult.database.rowExists !== undefined && `row exists: ${diagnosticsResult.database.rowExists}\n`}
                        value: {JSON.stringify(diagnosticsResult.database.rawValue)}
                        {diagnosticsResult.database.rawType != null && ` (${diagnosticsResult.database.rawType})`}
                        {diagnosticsResult.database.rawString != null && `\nas string: "${diagnosticsResult.database.rawString}"`}
                        {diagnosticsResult.database.json != null && `\nrow: ${diagnosticsResult.database.json}`}
                      </pre>
                    </div>
                  )}
                  {diagnosticsResult.publicApiLogic && (
                    <div>
                      <strong className="text-slate-700">Public API (GET /api/chatbot/settings)</strong>
                      <p className="text-slate-600 mt-1 text-xs">{diagnosticsResult.publicApiLogic.description}</p>
                      <p className="text-slate-600 mt-1">
                        enabled = <code className="bg-slate-100 px-1 rounded">{String(diagnosticsResult.publicApiLogic.enabled)}</code>
                      </p>
                    </div>
                  )}
                  {diagnosticsResult.publicFetch !== undefined && (
                    <div>
                      <strong className="text-slate-700">Live fetch from this browser</strong>
                      <p className="text-slate-600 mt-1">
                        GET {API_BASE_URL}/chatbot/settings → enabled ={' '}
                        <code className="bg-slate-100 px-1 rounded">{String(diagnosticsResult.publicFetch.enabled)}</code>
                        {!diagnosticsResult.publicFetch.ok && (
                          <span className="ml-2 text-amber-700"> (HTTP {diagnosticsResult.publicFetch.status})</span>
                        )}
                      </p>
                      {diagnosticsResult.publicFetch.enabled !== diagnosticsResult.publicApiLogic?.enabled && (
                        <p className="text-amber-700 mt-1 text-xs">
                          Mismatch: browser got different value than backend logic. Check cache or API URL.
                        </p>
                      )}
                    </div>
                  )}
                  {diagnosticsResult.possibleCauses && diagnosticsResult.possibleCauses.length > 0 && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <strong className="text-slate-700 block mb-2">Why the chatbot might not be hiding</strong>
                      <ul className="list-disc list-inside space-y-1 text-slate-600 text-xs">
                        {diagnosticsResult.possibleCauses.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {diagnosticsResult.frontendNote && (
                    <p className="text-xs text-slate-500 italic">{diagnosticsResult.frontendNote}</p>
                  )}
                  {diagnosticsResult.verdict && (
                    <div className={`p-4 rounded-lg border ${diagnosticsResult.verdict.chatbotWillShowOnSite ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                      <strong className="block text-slate-800 mb-1">Verdict</strong>
                      <p className="text-slate-700">
                        Chatbot will {diagnosticsResult.verdict.chatbotWillShowOnSite ? 'show' : 'be hidden'} on the website.
                      </p>
                      <p className="text-slate-600 mt-2">{diagnosticsResult.verdict.suggestion}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
