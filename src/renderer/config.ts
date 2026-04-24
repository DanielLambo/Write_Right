/**
 * Central config for renderer. Change these here instead of hunting through files.
 */

export const API_BASE = 'http://localhost:3051';

export const TIMINGS = {
  autosaveDebounceMs: 2000,
  autoAnalyzeDebounceMs: 1500,
  typingIdleThresholdMs: 2000,
  activeTimeTickMs: 500,
  indicatorFlashMs: 1500,
};

export const THRESHOLDS = {
  autoAnalyzeMinChars: 50,
  wpmActiveTimeMinMs: 30_000,
  wpmStandard: 120,
  wpmFastTypist: 150,
  readingWordsPerMin: 200,
};

export const ENDPOINTS = {
  analyze: '/analyze',
  autosave: '/autosave',
  autosaveLatest: '/autosave/latest',
  reverseOutline: '/reverse-outline',
  simplify: '/simplify',
  log: '/log',
} as const;
