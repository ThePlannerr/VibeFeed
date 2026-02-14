import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { URL } from 'node:url';

const loadLocalEnvFile = () => {
  const envPath = join(process.cwd(), 'proxy', '.env');
  let raw;
  try {
    raw = readFileSync(envPath, 'utf8');
  } catch {
    return;
  }

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

loadLocalEnvFile();

const PORT = Number.parseInt(process.env.PORT ?? '8787', 10) || 8787;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim() ?? '';
const OPENAI_MODEL = process.env.OPENAI_MODEL?.trim() || 'gpt-4.1-mini';
const SUPABASE_URL = process.env.SUPABASE_URL?.trim().replace(/\/$/, '') ?? '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY?.trim() ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? '';
const DELETE_ACCOUNT_CONFIRMATION = 'DELETE_MY_ACCOUNT';
const MAX_BODY_SIZE_BYTES = 512 * 1024;

const setCorsHeaders = (response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
};

const sendJson = (response, statusCode, body) => {
  setCorsHeaders(response);
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
};

const readJsonBody = (request) =>
  new Promise((resolve, reject) => {
    let received = 0;
    const chunks = [];

    request.on('data', (chunk) => {
      received += chunk.length;
      if (received > MAX_BODY_SIZE_BYTES) {
        reject(new Error('Payload too large'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });

    request.on('end', () => {
      try {
        const body = Buffer.concat(chunks).toString('utf8');
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });

    request.on('error', (error) => {
      reject(error);
    });
  });

const isStringArray = (value) => Array.isArray(value) && value.every((item) => typeof item === 'string');

const parseBearerToken = (authorizationHeader) => {
  if (typeof authorizationHeader !== 'string') {
    return null;
  }

  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
};

const isDeleteAccountRequest = (value) => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return typeof value.confirmation === 'string';
};

const isSupabaseDeletionConfigured = () =>
  Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE_KEY);

const resolveSupabaseUser = async (accessToken) => {
  const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userResponse.ok) {
    throw new Error('INVALID_TOKEN');
  }

  const user = await userResponse.json();
  if (!user || typeof user !== 'object' || typeof user.id !== 'string') {
    throw new Error('INVALID_USER_PAYLOAD');
  }

  return user;
};

const deleteSupabaseUser = async (userId) => {
  const adminDeleteResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });

  if (!adminDeleteResponse.ok) {
    throw new Error('ADMIN_DELETE_FAILED');
  }
};

const isWhyTagsRequest = (value) => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  if (!('profile' in value) || typeof value.profile !== 'object') {
    return false;
  }

  if (!('cards' in value) || !Array.isArray(value.cards)) {
    return false;
  }

  return value.cards.every(
    (card) =>
      card &&
      typeof card === 'object' &&
      typeof card.title_id === 'string' &&
      typeof card.title_name === 'string' &&
      typeof card.match_score === 'number' &&
      isStringArray(card.genres) &&
      isStringArray(card.moods) &&
      isStringArray(card.base_why_tags),
  );
};

const normalizeTags = (tags, fallback) => {
  const unique = Array.from(
    new Set(
      tags
        .map((tag) => String(tag).trim())
        .filter((tag) => tag.length > 0),
    ),
  ).slice(0, 3);

  if (unique.length >= 2) {
    return unique;
  }

  return fallback.slice(0, 3);
};

const fallbackTagsForCard = (card, profile) => {
  const result = [];
  const preferredVibe = card.moods.find((mood) => profile.vibe_chips?.includes(mood));
  if (preferredVibe) {
    result.push(`${preferredVibe} vibe`);
  }

  const primaryGenre = card.genres[0];
  if (primaryGenre) {
    result.push(`${primaryGenre} pick`);
  }

  if (card.exploration_pick) {
    result.push('Exploration pick');
  } else {
    result.push('Fits your taste');
  }

  result.push(...card.base_why_tags);
  return normalizeTags(result, ['Aligned with your selected vibes', 'Balanced genre coverage']);
};

const buildFallbackResponse = (payload) => ({
  cards: payload.cards.map((card) => ({
    title_id: card.title_id,
    why_tags: fallbackTagsForCard(card, payload.profile),
  })),
});

const safeJsonParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const extractJsonObject = (text) => {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) {
    return safeJsonParse(fenceMatch[1]);
  }
  return safeJsonParse(trimmed);
};

const isWhyTagsResponse = (value) => {
  if (!value || typeof value !== 'object' || !Array.isArray(value.cards)) {
    return false;
  }

  return value.cards.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      typeof item.title_id === 'string' &&
      isStringArray(item.why_tags),
  );
};

const generateWhyTagsWithOpenAI = async (payload) => {
  const promptPayload = {
    profile: {
      vibe_chips: payload.profile.vibe_chips ?? [],
      favorite_title_ids: payload.profile.favorite_title_ids ?? [],
      blocked_genres: payload.profile.blocked_genres ?? [],
      language_pref: payload.profile.language_pref ?? [],
      mood_intensity: payload.profile.mood_intensity ?? 50,
    },
    cards: payload.cards.map((card) => ({
      title_id: card.title_id,
      title_name: card.title_name,
      year: card.year,
      genres: card.genres,
      moods: card.moods,
      match_score: card.match_score,
      confidence: card.confidence,
      exploration_pick: card.exploration_pick,
      base_why_tags: card.base_why_tags,
      synopsis: card.synopsis,
    })),
  };

  const completionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Return JSON only with shape {"cards":[{"title_id":"string","why_tags":["tag1","tag2","tag3"]}]}. Generate 2-3 concise why tags per card (max 4 words each), no punctuation at end, no duplicates.',
        },
        {
          role: 'user',
          content: JSON.stringify(promptPayload),
        },
      ],
    }),
  });

  if (!completionResponse.ok) {
    throw new Error(`Upstream LLM request failed with status ${completionResponse.status}`);
  }

  const completionJson = await completionResponse.json();
  const messageContent = completionJson?.choices?.[0]?.message?.content;
  if (typeof messageContent !== 'string') {
    throw new Error('LLM response content was not a string');
  }

  const parsed = extractJsonObject(messageContent);
  if (!isWhyTagsResponse(parsed)) {
    throw new Error('LLM response JSON shape was invalid');
  }

  return parsed;
};

const server = createServer(async (request, response) => {
  const method = request.method ?? 'GET';
  const pathname = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`).pathname;

  if (method === 'OPTIONS') {
    setCorsHeaders(response);
    response.statusCode = 204;
    response.end();
    return;
  }

  if (method === 'GET' && pathname === '/health') {
    sendJson(response, 200, {
      ok: true,
      provider: OPENAI_API_KEY ? 'openai' : 'fallback',
      model: OPENAI_MODEL,
      auth_delete_enabled: isSupabaseDeletionConfigured(),
    });
    return;
  }

  if (method === 'POST' && pathname === '/v1/auth/delete-account') {
    if (!isSupabaseDeletionConfigured()) {
      sendJson(response, 503, {
        error: 'Account deletion is unavailable. Configure SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.',
      });
      return;
    }

    const accessToken = parseBearerToken(request.headers.authorization);
    if (!accessToken) {
      sendJson(response, 401, { error: 'Missing bearer token.' });
      return;
    }

    let body;
    try {
      body = await readJsonBody(request);
    } catch (error) {
      sendJson(response, 400, { error: error instanceof Error ? error.message : 'Invalid request' });
      return;
    }

    if (!isDeleteAccountRequest(body)) {
      sendJson(response, 400, { error: 'Body must include confirmation string.' });
      return;
    }

    if (body.confirmation.trim() !== DELETE_ACCOUNT_CONFIRMATION) {
      sendJson(response, 400, { error: `Confirmation must equal ${DELETE_ACCOUNT_CONFIRMATION}.` });
      return;
    }

    try {
      const user = await resolveSupabaseUser(accessToken);
      await deleteSupabaseUser(user.id);
      sendJson(response, 200, { ok: true, user_id: user.id });
    } catch (error) {
      if (error instanceof Error && error.message === 'INVALID_TOKEN') {
        sendJson(response, 401, { error: 'Invalid or expired access token.' });
        return;
      }

      if (error instanceof Error && error.message === 'INVALID_USER_PAYLOAD') {
        sendJson(response, 502, { error: 'Upstream auth service returned invalid payload.' });
        return;
      }

      sendJson(response, 502, { error: 'Failed to delete account via upstream auth service.' });
    }

    return;
  }

  if (method !== 'POST' || pathname !== '/v1/recs/why-tags') {
    sendJson(response, 404, { error: 'Not found' });
    return;
  }

  let body;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    sendJson(response, 400, { error: error instanceof Error ? error.message : 'Invalid request' });
    return;
  }

  if (!isWhyTagsRequest(body)) {
    sendJson(response, 400, { error: 'Body must match expected why-tags request shape' });
    return;
  }

  const fallback = buildFallbackResponse(body);
  if (!OPENAI_API_KEY) {
    sendJson(response, 200, {
      ...fallback,
      meta: { provider: 'fallback', reason: 'OPENAI_API_KEY missing' },
    });
    return;
  }

  try {
    const llmResponse = await generateWhyTagsWithOpenAI(body);
    const byTitle = new Map(llmResponse.cards.map((card) => [card.title_id, card.why_tags]));

    sendJson(response, 200, {
      cards: body.cards.map((card) => ({
        title_id: card.title_id,
        why_tags: normalizeTags(byTitle.get(card.title_id) ?? [], fallbackTagsForCard(card, body.profile)),
      })),
      meta: { provider: 'openai', model: OPENAI_MODEL },
    });
  } catch (error) {
    sendJson(response, 200, {
      ...fallback,
      meta: {
        provider: 'fallback',
        reason: error instanceof Error ? error.message : 'Unknown LLM failure',
      },
    });
  }
});

server.listen(PORT, () => {
  const provider = OPENAI_API_KEY ? `openai (${OPENAI_MODEL})` : 'fallback';
  console.log(`VibeFeed LLM proxy listening on http://localhost:${PORT} using ${provider}`);
});
