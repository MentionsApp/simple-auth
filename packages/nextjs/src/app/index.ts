import { useRouter } from "next/navigation";
import {
  makeAuth as ogFactory,
  AuthFactoryParams as OgAuthFactoryParams,
  RouterImpl,
  ITokenStore,
} from "@mentions-simple-auth/core";
// import type {
//   AuthFactoryParams as OgAuthFactoryParams,
//   RouterImpl,
// } from "@mentions-simple-auth/core";

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
