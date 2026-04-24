import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  username: string | null;
  userId: string | null;
  isLoggedIn: boolean;
  login: (token: string, refreshToken: string, username: string, userId: string) => void;
  logout: () => void;
}

/** Avoid touching `localStorage` during Next.js server render. */
const memoryStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      username: null,
      userId: null,
      isLoggedIn: false,
      login: (token, refreshToken, username, userId) =>
        set({ token, refreshToken, username, userId, isLoggedIn: true }),
      logout: () =>
        set({
          token: null,
          refreshToken: null,
          username: null,
          userId: null,
          isLoggedIn: false,
        }),
    }),
    {
      name: 'coinche-auth',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? window.localStorage : memoryStorage,
      ),
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        username: state.username,
        userId: state.userId,
        isLoggedIn: state.isLoggedIn,
      }),
    },
  ),
);
