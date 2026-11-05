import { create } from 'zustand';
import { defaultAppConfig, type ThemeMode, type ThemePreset, type RadiusPreset } from '@/config/appConfig';

interface ThemeState {
  mode: ThemeMode;
  preset: ThemePreset;
  radius: RadiusPreset;
  setMode: (mode: ThemeMode) => void;
  setPreset: (preset: ThemePreset) => void;
  setRadius: (radius: RadiusPreset) => void;
  toggleMode: () => void;
  initTheme: () => void;
}

export const THEME_STORAGE_KEY = 'd2c_ecommerce:theme:v1';
const STORAGE_KEY = THEME_STORAGE_KEY;
const LEGACY_STORAGE_KEY = 'd2c_theme_v1';

function safePersistTheme(state: { mode: ThemeMode; preset: ThemePreset; radius: RadiusPreset }): void {
  try {
    if (typeof localStorage !== 'undefined') {
      const payload = JSON.stringify({
        mode: state.mode,
        preset: state.preset,
        radius: state.radius,
      });
      localStorage.setItem(STORAGE_KEY, payload);
      localStorage.setItem(LEGACY_STORAGE_KEY, payload);
    }
  } catch (err) {
    console.warn('[themeStore] Failed to persist theme state to LocalStorage:', err);
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: defaultAppConfig.theme.mode,
  preset: defaultAppConfig.theme.preset,
  radius: defaultAppConfig.theme.radius,

  initTheme: () => {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            if (parsed.mode) get().setMode(parsed.mode);
            if (parsed.preset) get().setPreset(parsed.preset);
            if (parsed.radius) get().setRadius(parsed.radius);
            return;
          }
        }
      }
    } catch {
      // Fallback to default
    }
    // Apply defaults
    get().setMode(defaultAppConfig.theme.mode);
    get().setPreset(defaultAppConfig.theme.preset);
    get().setRadius(defaultAppConfig.theme.radius);
  },

  setMode: (mode) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (mode === 'dark') {
        root.classList.add('dark');
      } else if (mode === 'light') {
        root.classList.remove('dark');
      } else if (typeof window !== 'undefined') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
      }
    }
    set({ mode });
    safePersistTheme({ ...get(), mode });
  },

  setPreset: (preset) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme-preset', preset);
    }
    set({ preset });
    safePersistTheme({ ...get(), preset });
  },

  setRadius: (radius) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-radius', radius);
    }
    set({ radius });
    safePersistTheme({ ...get(), radius });
  },

  toggleMode: () => {
    const current = get().mode;
    const next = current === 'dark' ? 'light' : 'dark';
    get().setMode(next);
  },
}));
