import { createStore } from "zustand-x";
import { decodeToken } from "./token";
import { JWTUser, TokenStoreInstance } from "./types";

type AuthState = {
  token: string | null;
  isInitialized: boolean;
  isAuthenticated: boolean;
};

export const createAuthStore = (tokenStore: TokenStoreInstance) => {
  const authStore = createStore("auth-store")<AuthState>({
    token: null,
    isAuthenticated: false,
    isInitialized: false,
  })
    .extendSelectors((set, get, api) => ({
      user: () => {
        const token = get.token();
        if (!token) return null;

        const decoded = decodeToken(token!);

        if (!decoded.valid) return null;

        return {
          id: decoded.decoded?.user_id!,
          name: decoded.decoded?.username!,
          email: decoded.decoded?.email!,
          username: decoded.decoded?.username!,
        } as JWTUser;
      },
    }))
    .extendActions((set, get, api) => ({
      initialize: async () => {
        const token = await tokenStore.getToken();
        const result = decodeToken(token!);

        if (!token || !result.valid) {
          set.isInitialized(true);
          set.isAuthenticated(false);
          return null;
        }

        set.token(token);
        set.isInitialized(true);
        set.isAuthenticated(true);

        return result;
      },
      signIn: async (token: string) => {
        await tokenStore.saveToken(token);
        set.token(token);
        set.isAuthenticated(true);
        set.isInitialized(true);
      },
      signOut: async () => {
        await tokenStore.reset();
        set.token(null);
        set.isAuthenticated(false);
      },
    }));

  return authStore;
};
