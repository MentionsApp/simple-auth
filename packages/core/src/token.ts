import { jwtDecode } from "jwt-decode";
import { IDecodedToken } from "./types";

export const AUTH_TOKEN_KEY = "auth_token";

export function decodeToken(token: string) {
  if (!token) {
    return { error: "not matched", valid: false };
  }
  try {
    const decoded = jwtDecode<IDecodedToken>(token);
    if (!decoded.exp) {
      return { error: "not matched", valid: false };
    }

    const expiredAt = decoded.exp * 1000;

    if (expiredAt > new Date().getTime()) {
      return {
        decoded,
        token,
        valid: true,
        expiredAt: new Date(expiredAt),
      };
    }
    return { error: "Token expired", valid: false };
  } catch (e) {
    console.log(e, "token validator");
    return { error: "Server Error", valid: false };
  }
}
