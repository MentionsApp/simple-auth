export type JWTUser = {
  id: string;
  name: string;
  username: string;
  email: string;
};

export interface IDecodedToken {
  iss: string;
  sub: string;
  aud: string;
  iat: number;
  exp: number;
  user_id: string;
  email: string;
  username: string;
}

export interface TokenCheckPayload {
  decoded?: IDecodedToken;
  token?: string;
  error?: string;
  valid: boolean;
  expiredAt?: Date;
}

export type SignInResponse = {
  token: string;
  user: JWTUser;
};

export type AuthPayload =
  | {
      success: true;
      token: string;
      user: JWTUser;
    }
  | { success: false };

export type TokenStoreInstance = {
  getToken: () => Promise<string | null> | string | null;
  saveToken: (value: string) => Promise<void> | void;
  reset: () => void;
};

export type ITokenStore = (key?: string) => TokenStoreInstance;

export type AuthState = {
  token: string | null;
  isInitialized: boolean;
  isAuthenticated: boolean;
};

function useRouterStub() {
  return {
    push: (href: string) => {},
    replace: (href: string) => {},
  };
}

export type RouterImpl = typeof useRouterStub;
