import React, {
  useRef,
  useEffect,
  PropsWithChildren,
  useState,
  useCallback,
  useMemo,
} from "react";
import { AuthServices, CredentialsSigninSchema } from "./services";
import { createAuthStore } from "./store";
import { AUTH_TOKEN_KEY } from "./token";
import { AuthPayload, ITokenStore, JWTUser, RouterImpl } from "./types";
import { createContext } from "@mentions-simple-auth/react/utils";

export type AuthFactoryParams = {
  tokenStore: ITokenStore;
  tokenStorageKey?: string;
  useRouterImpl: RouterImpl;
  apiUrl: string;
};

export type AuthProviderProps = {
  afterSignOutUrl?: string;
  afterSignInUrl?: string;
  signInUrl?: string;
};

export function makeAuth(params: AuthFactoryParams) {
  const {
    tokenStore: tokenStoreImpl,
    tokenStorageKey = AUTH_TOKEN_KEY,
    apiUrl,
    useRouterImpl: useRouter,
  } = params;
  const tokenStore = tokenStoreImpl(tokenStorageKey);
  const services = AuthServices(apiUrl);

  const authStore = createAuthStore(tokenStore);

  function useAuthController(props: AuthProviderProps) {
    const {
      afterSignInUrl,
      signInUrl = "/login",
      afterSignOutUrl = "/",
    } = props;
    const isAuthenticated = authStore.use.isAuthenticated();
    const isInitialized = authStore.use.isInitialized();

    const initialize = useRef(async () => {
      await authStore.set.initialize();
    }).current;

    useEffect(() => {
      initialize();
    }, []);

    return {
      isAuthenticated,
      isInitialized,
      store: authStore,
      signInUrl,
      afterSignInUrl,
      afterSignOutUrl,
    };
  }

  type AuthController = ReturnType<typeof useAuthController>;

  const [Provider, useAuth] = createContext<AuthController>();

  function AuthProvider({
    children,
    ...rest
  }: PropsWithChildren<AuthProviderProps>) {
    const ctx = useAuthController(rest);
    return <Provider value={ctx}>{children}</Provider>;
  }

  function useAuthToken() {
    const getToken = useRef(() => {
      const token = authStore.get.token();
      return token;
    }).current;

    return getToken;
  }

  function useSignIn() {
    const { afterSignInUrl } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const execute = useCallback(
      async (payload: CredentialsSigninSchema) => {
        let response: AuthPayload | null = null;
        try {
          setError(null);
          setLoading(true);
          const result = await services.createSession(payload);

          if (!result.success) {
            return null;
          }

          authStore.set.signIn(result.token!);

          if (afterSignInUrl) {
            router.replace(afterSignInUrl);
          }

          response = result;
        } catch (error) {
          if (error instanceof Error) {
            setError(error.message);
          }
          response = { success: false };
        } finally {
          setLoading(false);
          return response;
        }
      },
      [afterSignInUrl]
    );

    return [execute, { loading, error }] as const;
  }

  function useSignOut() {
    const { signInUrl, afterSignOutUrl } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const execute = useCallback(async () => {
      try {
        setError(null);
        setLoading(false);
        const token = authStore.get.token()!;
        const user = authStore.get.user();

        if (!token || !user) {
          return true;
        }

        const result = await services.deleteSession({
          token,
          userId: user?.id!,
        });

        if (!result) {
          throw new Error("Unexpected Error");
        }

        await authStore.set.signOut();

        router.replace(afterSignOutUrl || signInUrl || "/");

        return result;
      } catch (error) {
        console.log(error);
        if (error instanceof Error) {
          setError(error.message);
        }
      } finally {
        setLoading(false);
      }
    }, [afterSignOutUrl, signInUrl]);

    return [execute, { loading, error }] as const;
  }

  function useAuthGuard({
    redirectOnAuthenticated,
    skip,
  }: {
    redirectOnAuthenticated?: string;
    /** skips unauthenticated redirect */
    skip?: boolean;
  } = {}) {
    const router = useRouter();
    const { isAuthenticated, isInitialized, signInUrl } = useAuth();

    useEffect(
      function execute() {
        if (!isInitialized) return;

        if (!isAuthenticated && !skip) {
          router.replace(signInUrl);
          return;
        }

        if (isAuthenticated && redirectOnAuthenticated) {
          router.replace(redirectOnAuthenticated);
          return;
        }
      },
      [isAuthenticated, isInitialized, redirectOnAuthenticated, signInUrl, skip]
    );
    return { isAuthenticated, isInitialized };
  }

  function useSession() {
    const { store } = useAuth();
    const user = store.use.user();
    const isAuthenticated = store.use.isAuthenticated();
    const isInitialized = store.use.isInitialized();

    const isSignedIn = useMemo(
      () => isInitialized && isAuthenticated,
      [isAuthenticated, isInitialized]
    );

    return { user, isAuthenticated, isLoaded: isInitialized, isSignedIn };
  }

  function useSetSession() {
    const { store } = useAuth();
    const setActiveSession = (token: string, user: JWTUser) => {
      store.set.signIn(token);
    };
    return setActiveSession;
  }

  return {
    AuthProvider,
    useAuth,
    useAuthToken,
    useSignIn,
    useSignOut,
    useAuthGuard,
    useSession,
    useSetSession,
    authStore,
  };
}
