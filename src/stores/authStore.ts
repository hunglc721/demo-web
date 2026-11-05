import { create } from 'zustand';

export type UserRole = 'admin' | 'staff' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  initAuth: () => void;
  switchRole: (role: UserRole) => void;
  login: (user: User) => void;
  logout: () => void;
}

export const AUTH_STORAGE_KEY = 'd2c_ecommerce:auth:v1';
export const STORAGE_KEY = AUTH_STORAGE_KEY;

export const defaultAdminUser: User = {
  id: 'usr_admin_01',
  name: 'Nguyễn Quản Trị',
  email: 'admin@d2cstarter.vn',
  role: 'admin',
};

export const defaultStaffUser: User = {
  id: 'usr_staff_01',
  name: 'Trần Nhân Viên',
  email: 'staff@d2cstarter.vn',
  role: 'staff',
};

export const defaultCustomerUser: User = {
  id: 'usr_cust_01',
  name: 'Lê Khách Hàng',
  email: 'customer@gmail.com',
  role: 'customer',
};

interface PersistedAuthSnapshot {
  user: User | null;
  isAuthenticated: boolean;
}

function loadPersistedAuth(): PersistedAuthSnapshot {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<PersistedAuthSnapshot>;
        if (parsed && typeof parsed === 'object') {
          return {
            user: parsed.user !== undefined ? parsed.user : null,
            isAuthenticated:
              typeof parsed.isAuthenticated === 'boolean'
                ? parsed.isAuthenticated
                : Boolean(parsed.user),
          };
        }
      }
    }
  } catch {
    // Malformed JSON or storage security restriction fallback
  }
  return { user: null, isAuthenticated: false };
}

function savePersistedAuth(snapshot: PersistedAuthSnapshot): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(snapshot));
    }
  } catch {
    // Quota guard or private browsing
  }
}

const initialAuth = loadPersistedAuth();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialAuth.user,
  isAuthenticated: initialAuth.isAuthenticated,

  initAuth: () => {
    const rehydrated = loadPersistedAuth();
    set(rehydrated);
  },

  switchRole: (role) => {
    let targetUser: User;
    if (role === 'admin') targetUser = defaultAdminUser;
    else if (role === 'staff') targetUser = defaultStaffUser;
    else targetUser = defaultCustomerUser;

    const nextState: PersistedAuthSnapshot = {
      user: targetUser,
      isAuthenticated: true,
    };
    set(nextState);
    savePersistedAuth(nextState);
  },

  login: (user) => {
    const nextState: PersistedAuthSnapshot = {
      user,
      isAuthenticated: true,
    };
    set(nextState);
    savePersistedAuth(nextState);
  },

  logout: () => {
    const nextState: PersistedAuthSnapshot = {
      user: null,
      isAuthenticated: false,
    };
    set(nextState);
    savePersistedAuth(nextState);
  },
}));

