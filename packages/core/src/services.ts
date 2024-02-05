import { z } from "zod";
import { AuthPayload, SignInResponse } from "./types";

const authHeaders = (token: string) => `Bearer ${token}`;

const defaultHeaders = {
  "Content-Type": "application/json",
};

const credentaislSignInSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export type CredentialsSigninSchema = z.infer<typeof credentaislSignInSchema>;

export function AuthServices(baseUrl: string) {
  async function createSession(
    params: CredentialsSigninSchema
  ): Promise<AuthPayload> {
    const body = JSON.stringify(params);
    const url = `${baseUrl}/sessions`;

    const response = await fetch(url, {
      method: "POST",
      body,
      headers: defaultHeaders,
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const data: SignInResponse = await response.json();

    return {
      success: true,
      token: data.token,
      user: data.user,
    };
  }

  async function deleteSession({
    userId,
    token,
  }: {
    userId: string;
    token: string;
  }) {
    try {
      const response = await fetch(`${baseUrl}/sessions/${userId}`, {
        method: "DELETE",
        headers: {
          ...defaultHeaders,
          Authorization: authHeaders(token),
        },
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error("Unexpected Error");
      }

      return true;
    } catch (e) {
      console.log(e);
    }

    return true;
  }

  return {
    createSession,
    deleteSession,
  };
}
