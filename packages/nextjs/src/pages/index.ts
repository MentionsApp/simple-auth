import { useRouter } from "next/router";
import { makeAuth as ogFactory } from "@mentions-simple-auth/core";
import type {
  ITokenStore,
  AuthFactoryParams as OgAuthFactoryParams,
  RouterImpl,
} from "@mentions-simple-auth/core";

type AuthFactoryParams = Omit<OgAuthFactoryParams, "useRouterImpl">;

const useRouterImpl: RouterImpl = () => {
  const router = useRouter();
  return {
    push: (href) => {
      router.push(href);
    },
    replace: (href) => {
      router.replace(href);
    },
  };
};

export const makeAuth = (
  params: AuthFactoryParams
): ReturnType<typeof ogFactory> => {
  return ogFactory({
    ...params,
    useRouterImpl,
  });
};

export type { ITokenStore };
