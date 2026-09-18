/**
 * Vercel Serverless Function: MFILM AI Chatbot Proxy
 * Route: POST /api/ai/chat
 * 
 * Target server-side Vercel environment variables:
 * - GROQ_API_KEYS (primary) or GROQ_API_KEY (alias), with VITE_GROQ_API_KEYS (migration fallback)
 * - GEMINI_API_KEYS (primary) or GEMINI_API_KEY (alias), with VITE_GEMINI_API_KEYS (migration fallback)
 * 
 * Secure server-side execution:
 * - Zero secrets exposed to browser/bundle
 * - Decoupled from Render / Big Data / Kafka / Tinybird / PostgreSQL / Valkey
 */

/**
 * Safely parse delimited or JSON array API key strings
 * @param {string|undefined} raw
 * @returns {string[]}
 */
export function parseApiKeys(raw) {
  if (!raw || typeof raw !== 'string') return [];
  const trimmed = raw.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const arr = JSON.parse(trimmed);
      if (Array.isArray(arr)) {
        return arr.map(k => String(k).trim().replace(/[\r\n\\"]/g, '')).filter(Boolean);
      }
    } catch {
      // fallback to delimiter split
    }
  }
  return trimmed
    .split(/[,;\n]+/)
    .map(k => k.trim().replace(/[\r\n\\"]/g, ''))
    .filter(Boolean);
}

/**
 * Call Groq chat completions API
 */
async function callGroq({ prompt, history = [], systemInstruction, key, model, fetchFn = fetch }) {
  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: String(systemInstruction) });
  }
  if (Array.isArray(history)) {
    for (const h of history) {
      if (h && (h.text || h.content)) {
        messages.push({
          role: h.role === 'user' ? 'user' : 'assistant',
          content: String(h.text || h.content)
        });
      }
    }
  }
  messages.push({ role: 'user', content: String(prompt) });

  const res = await fetchFn('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: model || 'openai/gpt-oss-20b',
      messages,
      max_tokens: 1024,
      temperature: 0.7
    })
  });

  if (!res.ok) {
    const status = res.status;
    let errText = '';
    try {
      const errJson = await res.json();
      errText = errJson?.error?.message || JSON.stringify(errJson);
    } catch {
      errText = await res.text().catch(() => '');
    }
    const err = new Error(`Groq API error HTTP ${status}: ${errText.slice(0, 200)}`);
    err.status = status;
    throw err;
  }

  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) {
    throw new Error('Groq returned empty reply content');
  }
  return reply;
}

/**
 * Call Gemini generateContent API
 */
async function callGemini({ prompt, history = [], systemInstruction, key, model, fetchFn = fetch }) {
  const geminiModel = model || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(key)}`;

  const contents = [];
  if (Array.isArray(history)) {
    for (const h of history) {
      if (h && (h.text || h.content)) {
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: String(h.text || h.content) }]
        });
      }
    }
  }
  contents.push({
    role: 'user',
    parts: [{ text: String(prompt) }]
  });

  const reqBody = {
    contents,
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0.7
    }
  };

  if (systemInstruction) {
    reqBody.system_instruction = {
      parts: [{ text: String(systemInstruction) }]
    };
  }

  const res = await fetchFn(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(reqBody)
  });

  if (!res.ok) {
    const status = res.status;
    let errText = '';
    try {
      const errJson = await res.json();
      errText = errJson?.error?.message || JSON.stringify(errJson);
    } catch {
      errText = await res.text().catch(() => '');
    }
    const err = new Error(`Gemini API error HTTP ${status}: ${errText.slice(0, 200)}`);
    err.status = status;
    throw err;
  }

  const data = await res.json();
  const candidate = data?.candidates?.[0];
  const reply = candidate?.content?.parts?.[0]?.text;
  if (!reply) {
    throw new Error('Gemini returned empty reply content');
  }
  return reply;
}

/**
 * Core AI routing with fallback between Groq and Gemini
 */
export async function executeAiChat({
  prompt,
  history = [],
  systemInstruction,
  preferredProvider = 'groq',
  groqKeys = [],
  geminiKeys = [],
  groqModel = 'openai/gpt-oss-20b',
  geminiModel = 'gemini-2.5-flash',
  fetchFn = fetch
}) {
  const hasGroq = groqKeys.length > 0;
  const hasGemini = geminiKeys.length > 0;

  if (!hasGroq && !hasGemini) {
    const err = new Error('No AI provider keys configured in Vercel environment.');
    err.code = 'NO_KEYS';
    throw err;
  }

  const providerOrder =
    preferredProvider === 'gemini'
      ? (hasGemini ? (hasGroq ? ['gemini', 'groq'] : ['gemini']) : ['groq'])
      : (hasGroq ? (hasGemini ? ['groq', 'gemini'] : ['groq']) : ['gemini']);

  let lastError = null;

  for (const provider of providerOrder) {
    if (provider === 'groq' && hasGroq) {
      // Try up to 2 keys if multiple keys exist
      const keysToTry = groqKeys.slice(0, 2);
      for (const key of keysToTry) {
        try {
          const reply = await callGroq({
            prompt,
            history,
            systemInstruction,
            key,
            model: groqModel,
            fetchFn
          });
          return {
            success: true,
            reply,
            text: reply,
            provider: 'groq',
            model: groqModel
          };
        } catch (err) {
          lastError = err;
          // Continue to next key if rate limited (429)
          if (err.status !== 429 && keysToTry.length > 1) {
            // non-rate-limit error, try next provider
            break;
          }
        }
      }
    }

    if (provider === 'gemini' && hasGemini) {
      const keysToTry = geminiKeys.slice(0, 2);
      for (const key of keysToTry) {
        try {
          const reply = await callGemini({
            prompt,
            history,
            systemInstruction,
            key,
            model: geminiModel,
            fetchFn
          });
          return {
            success: true,
            reply,
            text: reply,
            provider: 'gemini',
            model: geminiModel
          };
        } catch (err) {
          lastError = err;
          if (err.status !== 429 && keysToTry.length > 1) {
            break;
          }
        }
      }
    }
  }

  const failureErr = new Error(`All configured AI providers failed: ${lastError?.message || 'unknown'}`);
  failureErr.code = 'ALL_PROVIDERS_FAILED';
  throw failureErr;
}

/**
 * Vercel Serverless Function Default Export Handler
 */
export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Only POST requests are supported.'
    });
  }

  try {
    // Vercel's Node runtime may throw "Invalid JSON" when accessing req.body
    // as a lazy getter. We need to handle this gracefully.
    let body;
    try {
      body = req.body;
    } catch (bodyErr) {
      // Fallback: read raw stream and parse manually
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const rawBody = Buffer.concat(chunks).toString('utf8');
      try {
        body = JSON.parse(rawBody);
      } catch {
        return res.status(400).json({
          success: false,
          error: 'INVALID_JSON',
          message: 'Request body must be valid JSON.'
        });
      }
    }

    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({
          success: false,
          error: 'INVALID_JSON',
          message: 'Request body must be valid JSON.'
        });
      }
    }

    const { prompt, history, systemInstruction, preferredProvider } = body || {};

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_REQUEST',
        message: 'Prompt is required and must be a non-empty string.'
      });
    }

    if (prompt.length > 8000) {
      return res.status(400).json({
        success: false,
        error: 'PROMPT_TOO_LONG',
        message: 'Prompt exceeds maximum allowed length (8000 characters).'
      });
    }

    // Read provider keys exclusively from server-side environment
    // Priority: GROQ_API_KEYS (final) -> GROQ_API_KEY (alias) -> VITE_GROQ_API_KEYS (migration fallback)
    const rawGroq =
      process.env.GROQ_API_KEYS ||
      process.env.GROQ_API_KEY ||
      process.env.VITE_GROQ_API_KEYS ||
      process.env.VITE_GROQ_API_KEY;

    // Priority: GEMINI_API_KEYS (final) -> GEMINI_API_KEY (alias) -> VITE_GEMINI_API_KEYS (migration fallback)
    const rawGemini =
      process.env.GEMINI_API_KEYS ||
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEYS ||
      process.env.VITE_GEMINI_API_KEY;

    const groqKeys = parseApiKeys(rawGroq);
    const geminiKeys = parseApiKeys(rawGemini);

    const groqModel = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    const result = await executeAiChat({
      prompt: prompt.trim(),
      history,
      systemInstruction,
      preferredProvider: preferredProvider || 'groq',
      groqKeys,
      geminiKeys,
      groqModel,
      geminiModel
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error.code === 'NO_KEYS') {
      return res.status(503).json({
        success: false,
        error: 'AI_PROVIDER_UNCONFIGURED',
        message: 'Trợ lý AI MFILM hiện đang bận hoặc chưa được kích hoạt API key trên máy chủ.'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'AI_PROVIDER_UNAVAILABLE',
      message: 'Trợ lý AI MFILM hiện đang bận hoặc đang bảo trì kết nối máy chủ. Bạn vui lòng thử lại sau giây lát nhé! 🍿'
    });
  }
}
