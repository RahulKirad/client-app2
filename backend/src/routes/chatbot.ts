import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pool } from 'mysql2/promise';

/** Fallback model names if API list fails (in order of preference) */
const FALLBACK_MODEL_NAMES = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-pro',
];

/** Current model being used (will be set after discovery or testing) */
let currentModelName = FALLBACK_MODEL_NAMES[0];

/** Models discovered from API (populated by fetchAvailableModels) */
let discoveredModelNames: string[] = [];

const GEMINI_MODELS_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Fetches list of available models from Gemini API and returns model IDs
 * that support generateContent. Prefers text-generation models.
 */
async function fetchAvailableModels(apiKey: string): Promise<string[]> {
  const url = `${GEMINI_MODELS_URL}?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Models list failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { models?: Array<{ name: string; supportedGenerationMethods?: string[] }> };
  const models = data.models || [];
  const names: string[] = [];
  for (const m of models) {
    const supported = m.supportedGenerationMethods || [];
    if (!supported.includes('generateContent')) continue;
    const name = m.name.startsWith('models/') ? m.name.slice(7) : m.name;
    if (!names.includes(name)) names.push(name);
  }
  return names;
}

/**
 * Cottonunique-trained system prompt.
 * This defines the chatbot's role, brand knowledge, and behaviour. Admin can add
 * custom_instructions and disallowed_topics in chatbot_settings; getSystemPrompt() merges them.
 */
const COTTONUNIQUE_SYSTEM_PROMPT = `You are the official Cottonunique assistant. Your only job is to help visitors with anything about Cottonunique: our brand, our sustainable tote bags, certifications, ordering, and how to get in touch. Always speak as Cottonunique’s friendly, professional voice.

--- BRAND: Cottonunique ---
- Cottonunique is a premium sustainable tote bag brand.
- We make ethically sourced, intelligently designed, export-ready tote bags.
- We focus on modern elegance: clean lines, sustainable materials, premium quality.
- Our values: Sustainability First (100% organic cotton, GOTS certification), Quality Excellence (premium materials and craftsmanship), Export Ready (international markets, quality control), Ethical Sourcing (fair, transparent supply chains from farm to finished tote).
- We serve individuals, businesses, and corporate gifting with custom branding.

--- PRODUCTS & OFFERINGS ---
- Product: Premium sustainable tote bags (e.g. classic cotton totes, floral and design collections, custom-branded totes).
- Material: 100% GOTS-certified organic cotton.
- Print: Water-based inks.
- Packaging: FSC-certified hangtags and labels.
- MOQ: Flexible for pilot programs; we support sample orders, bulk orders, and custom orders.
- Use cases: Corporate gifting, retail, events, personal use, export.

--- CERTIFICATIONS & COMPLIANCE ---
- GOTS (Global Organic Textile Standard) certified.
- FSC-compliant packaging.
- MSME registered and export compliant.
- Ready for seamless global delivery and regulatory compliance.

--- ORDERING & CONTACT ---
- For quotes, samples, bulk orders, or custom requests: direct users to the website’s contact form or “Get a Quote” / contact section.
- We do not process payments or orders inside this chat; we only provide information and guide to the right contact step.

--- TOTE BAGS (when users ask what tote bags are) ---
- Definition: A tote bag is a large, open-top bag with two handles (often long straps), used for shopping, groceries, books, beach, or everyday carry. Reusable and eco-friendly.
- Types: Canvas/cotton totes, promotional totes, grocery totes, beach totes, laptop totes, custom-branded totes for events or corporate gifting.
- Benefits: Reusable, durable, reduce plastic waste, lightweight, foldable, custom-printable for branding, suitable for retail and corporate gifting.
- Materials: Cotton totes use natural fibres; organic cotton is GOTS-certified (environmental and social standards), breathable, washable, biodegradable.
- Cottonunique’s totes: Premium sustainable tote bags from 100% GOTS-certified organic cotton, water-based inks, FSC-certified packaging; ideal for corporate gifting, retail, samples, and bulk; custom branding and export-ready. When explaining tote bags, always tie back to Cottonunique’s offer and suggest using the contact form for next steps.

--- RULES ---
- Only answer questions related to Cottonunique (products, sustainability, certifications, ordering, tote bags in the context of Cottonunique). Be concise and helpful.
- For off-topic or unrelated questions, reply once with: "I'm the Cottonunique assistant and I'm here to help with our sustainable tote bags, certifications, ordering, or contact. What would you like to know?"
- Do not invent product names, prices, or policies not stated above. If unsure, suggest they use the contact form.
- Be friendly, professional, and consistent with Cottonunique’s brand.`;

/**
 * Returns the admin-selected preferred model ID from chatbot_settings, or null for auto.
 */
async function getPreferredModel(pool: Pool): Promise<string | null> {
  try {
    const [rows] = await pool.execute(
      'SELECT preferred_model AS preferredModel FROM chatbot_settings WHERE id = 1'
    );
    const row = Array.isArray(rows) && rows.length > 0 ? (rows as any[])[0] : null;
    const v = row?.preferredModel;
    return typeof v === 'string' && v.trim() ? v.trim() : null;
  } catch (_) {
    return null;
  }
}

/**
 * Builds the system prompt for the chatbot, merging base Cottonunique prompt with admin-configured instructions.
 */
async function getSystemPrompt(pool: Pool): Promise<string> {
  let prompt = COTTONUNIQUE_SYSTEM_PROMPT;
  try {
    const [rows] = await pool.execute(
      'SELECT custom_instructions, disallowed_topics FROM chatbot_settings WHERE id = 1'
    );
    const s = Array.isArray(rows) && rows.length > 0 ? (rows as any[])[0] : null;
    if (s?.custom_instructions?.trim()) {
      prompt += '\n\n--- Additional instructions from admin (follow these) ---\n' + s.custom_instructions.trim();
    }
    if (s?.disallowed_topics?.trim()) {
      prompt += '\n\n--- Do NOT respond to or discuss the following ---\n' + s.disallowed_topics.trim();
    }
  } catch (_) {
    // ignore; use base prompt only
  }
  return prompt;
}

export default function createChatbotRouter(pool: Pool) {
  const router = Router();

/**
 * GET /api/chatbot/diagnostics
 * Returns diagnostic information about the chatbot configuration.
 */
router.get('/diagnostics', async (req: Request, res: Response) => {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!process.env.GOOGLE_API_KEY,
    apiKeyLength: process.env.GOOGLE_API_KEY?.length || 0,
    currentModel: currentModelName,
    availableModels: discoveredModelNames.length > 0 ? discoveredModelNames : FALLBACK_MODEL_NAMES,
  };

  if (!process.env.GOOGLE_API_KEY) {
    return res.json({
      ...diagnostics,
      status: 'error',
      error: 'GOOGLE_API_KEY is not configured',
    });
  }

  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);

    // Fetch available models from API
    try {
      discoveredModelNames = await fetchAvailableModels(apiKey);
      diagnostics.modelsFromAPI = discoveredModelNames;
      if (discoveredModelNames.length > 0) {
        currentModelName = discoveredModelNames[0];
        diagnostics.currentModel = currentModelName;
      }
    } catch (listErr: any) {
      diagnostics.modelListError = listErr.message;
      discoveredModelNames = [];
    }

    const modelsToTest = discoveredModelNames.length > 0 ? discoveredModelNames : FALLBACK_MODEL_NAMES;
    const modelTests: any[] = [];
    for (const modelName of modelsToTest) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const testResult = await model.generateContent('Test');
        await testResult.response;
        modelTests.push({ model: modelName, status: 'working' });
        if (!diagnostics.workingModel) {
          diagnostics.workingModel = modelName;
          currentModelName = modelName;
        }
      } catch (error: any) {
        modelTests.push({
          model: modelName,
          status: 'failed',
          error: error.message,
          statusCode: error.status,
        });
      }
    }
    diagnostics.modelTests = modelTests;

    res.json({
      ...diagnostics,
      status: diagnostics.workingModel ? 'ok' : 'error',
    });
  } catch (error: any) {
    res.json({
      ...diagnostics,
      status: 'error',
      error: error.message,
      stack: error.stack,
    });
  }
});

/**
 * GET /api/chatbot/models
 * Returns list of available Gemini model IDs (for admin model selector).
 */
router.get('/models', async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.json({ models: FALLBACK_MODEL_NAMES });
    }
    try {
      const models = await fetchAvailableModels(apiKey);
      return res.json({ models: models.length > 0 ? models : FALLBACK_MODEL_NAMES });
    } catch (_) {
      return res.json({ models: FALLBACK_MODEL_NAMES });
    }
  } catch (error: any) {
    res.json({ models: FALLBACK_MODEL_NAMES });
  }
});

/**
 * POST /api/chatbot/message
 * Handles chatbot messages using Google Gemini API with Cottonunique-specific context.
 */
router.post('/message', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    messageLength: req.body.message?.length || 0,
    historyLength: req.body.conversationHistory?.length || 0,
  };

  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error('[CHATBOT] GOOGLE_API_KEY is not set');
      debugInfo.error = 'API key not configured';
      return res.status(500).json({
        error: 'Chatbot service is not configured',
        debug: debugInfo,
      });
    }

    debugInfo.apiKeyConfigured = true;
    debugInfo.apiKeyPrefix = apiKey.substring(0, 10) + '...';

    const genAI = new GoogleGenerativeAI(apiKey);
    debugInfo.attemptedModel = currentModelName;

    // If we haven't discovered models yet, fetch from API once
    if (discoveredModelNames.length === 0) {
      try {
        discoveredModelNames = await fetchAvailableModels(apiKey);
        if (discoveredModelNames.length > 0) {
          currentModelName = discoveredModelNames[0];
          debugInfo.modelsDiscovered = discoveredModelNames.length;
        }
      } catch (_) {
        discoveredModelNames = [];
      }
    }

    const baseModels = discoveredModelNames.length > 0 ? discoveredModelNames : FALLBACK_MODEL_NAMES;
    const preferred = await getPreferredModel(pool);
    const modelsToTry =
      preferred && baseModels.includes(preferred)
        ? [preferred, ...baseModels.filter((m) => m !== preferred)]
        : preferred
          ? [preferred, ...baseModels]
          : baseModels;
    debugInfo.preferredModel = preferred || undefined;

    // Try to use the current model, fallback to others if it fails
    let model;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        debugInfo.testingModel = modelName;
        model = genAI.getGenerativeModel({ model: modelName });
        await model.generateContent('test');
        currentModelName = modelName;
        if (modelName !== debugInfo.attemptedModel) {
          debugInfo.modelSwitched = true;
          debugInfo.newModel = modelName;
          console.log(`[CHATBOT] Using model: ${modelName}`);
        }
        break;
      } catch (error: any) {
        debugInfo.modelTestFailed = modelName;
        lastError = error;
        model = undefined;
        continue;
      }
    }

    if (!model) {
      const errMsg = lastError?.message || String(lastError);
      const cause = (lastError as any)?.cause;
      const causeInfo = cause ? ` [cause: ${cause.code || cause.message || 'unknown'}]` : '';
      const causeStr = cause ? String(cause.code || cause.message || '') : '';
      const isNetworkError = ['fetch failed', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'socket hang up', 'UND_ERR'].some(
        (s) => errMsg.includes(s) || causeStr.includes(s)
      );
      console.error('[CHATBOT] No working model found. Last error:', errMsg + causeInfo);
      debugInfo.allModelsFailed = true;
      debugInfo.lastError = errMsg;
      if (cause) debugInfo.lastErrorCause = cause.code || cause.message;
      const suggestion = isNetworkError
        ? 'Cannot reach Google API (network error). Check: 1) Internet connection, 2) Firewall/proxy allowing HTTPS to *.googleapis.com, 3) GOOGLE_API_KEY in .env is valid.'
        : 'Check GOOGLE_API_KEY in .env and that the key has access to Gemini models.';
      return res.status(500).json({
        error: 'No working model found',
        debug: debugInfo,
        suggestion,
      });
    }

    debugInfo.usingModel = currentModelName;

    // Load admin-configured prompt (custom instructions + disallowed topics)
    const systemPrompt = await getSystemPrompt(pool);

    // Build conversation history (last 10 messages to avoid token limits)
    // Gemini requires history to START with 'user' – strip any leading assistant messages
    const rawHistory = conversationHistory.slice(-10);
    debugInfo.rawHistoryLength = rawHistory.length;
    
    const recentHistory = (() => {
      let i = 0;
      while (i < rawHistory.length && rawHistory[i].role === 'assistant') i++;
      return rawHistory.slice(i);
    })();
    
    debugInfo.recentHistoryLength = recentHistory.length;
    debugInfo.strippedLeadingAssistants = rawHistory.length - recentHistory.length;

    const history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    // If no user messages yet (only had assistant greeting), treat as first message
    if (recentHistory.length === 0) {
      debugInfo.mode = 'first_message';
      debugInfo.systemPromptLength = systemPrompt.length;
      
      try {
        const contextualMessage = `${systemPrompt}\n\nUser: ${message}\nAssistant:`;
        debugInfo.contextualMessageLength = contextualMessage.length;
        
        const result = await model.generateContent(contextualMessage);
        const response = await result.response;
        const text = response.text();
        
        debugInfo.responseLength = text.length;
        debugInfo.processingTime = Date.now() - startTime;

        return res.json({
          message: text,
          timestamp: new Date().toISOString(),
          debug: process.env.NODE_ENV === 'development' ? debugInfo : undefined,
        });
      } catch (error: any) {
        debugInfo.generateContentError = error.message;
        debugInfo.errorStatus = error.status;
        debugInfo.errorStatusText = error.statusText;
        throw error;
      }
    }

    // Convert to Gemini format: first content must be 'user'
    debugInfo.mode = 'conversation';
    let isFirstUserMessage = true;
    for (const item of recentHistory) {
      if (item.role === 'user') {
        history.push({
          role: 'user',
          parts: [{ text: isFirstUserMessage ? `${systemPrompt}\n\n${item.content}` : item.content }],
        });
        isFirstUserMessage = false;
      } else {
        history.push({
          role: 'model',
          parts: [{ text: item.content }],
        });
      }
    }
    
    debugInfo.historyLength = history.length;
    debugInfo.historyStartsWith = history[0]?.role || 'none';

    try {
      // startChat requires first entry to be role 'user'
      debugInfo.startingChat = true;
      const chat = model.startChat({
        history,
      });
      debugInfo.chatStarted = true;

      // Send current message
      debugInfo.sendingMessage = true;
      const result = await chat.sendMessage(message);
      const response = await result.response;
      const text = response.text();
      
      debugInfo.responseLength = text.length;
      debugInfo.processingTime = Date.now() - startTime;

      res.json({
        message: text,
        timestamp: new Date().toISOString(),
        debug: process.env.NODE_ENV === 'development' ? debugInfo : undefined,
      });
    } catch (chatError: any) {
      debugInfo.chatError = chatError.message;
      debugInfo.chatErrorStatus = chatError.status;
      debugInfo.chatErrorStatusText = chatError.statusText;
      debugInfo.chatErrorDetails = chatError.errorDetails;
      throw chatError;
    }
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('[CHATBOT] Error processing message:', {
      error: error.message,
      status: error.status,
      statusText: error.statusText,
      model: debugInfo.usingModel || debugInfo.attemptedModel,
      processingTime,
    });
    
    debugInfo.finalError = error.message;
    debugInfo.finalErrorStatus = error.status;
    debugInfo.finalErrorStatusText = error.statusText;
    debugInfo.processingTime = processingTime;
    
    res.status(500).json({
      error: 'Failed to process message',
      message: error.message || 'An unexpected error occurred',
      debug: debugInfo,
      suggestion: error.status === 404 
        ? 'Model not found. Try calling GET /api/chatbot/diagnostics to find available models.'
        : 'Check API key and model availability.',
    });
  }
});

  return router;
}
