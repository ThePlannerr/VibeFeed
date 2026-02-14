const DEFAULT_LLM_TIMEOUT_MS = 7000;

const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === '1' || normalized === 'true' || normalized === 'yes') {
    return true;
  }
  if (normalized === '0' || normalized === 'false' || normalized === 'no') {
    return false;
  }
  return fallback;
};

const parsePositiveNumber = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const normalizeUrl = (value: string | undefined) => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.replace(/\/$/, '');
};

const llmProxyUrl = normalizeUrl(process.env.EXPO_PUBLIC_LLM_PROXY_URL);
const apiProxyUrl = normalizeUrl(process.env.EXPO_PUBLIC_API_PROXY_URL);
const supabaseUrl = normalizeUrl(process.env.EXPO_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
const authEnabled = Boolean(supabaseUrl && supabaseAnonKey);

export const APP_ENV = {
  llmExplanationsEnabled: parseBoolean(process.env.EXPO_PUBLIC_ENABLE_LLM_EXPLANATIONS, false),
  llmProxyUrl,
  apiProxyUrl: apiProxyUrl ?? llmProxyUrl,
  llmRequestTimeoutMs: parsePositiveNumber(
    process.env.EXPO_PUBLIC_LLM_REQUEST_TIMEOUT_MS,
    DEFAULT_LLM_TIMEOUT_MS,
  ),
  authEnabled,
  supabaseUrl,
  supabaseAnonKey,
} as const;
