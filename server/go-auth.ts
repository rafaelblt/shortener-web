import type { components, paths } from "../contracts/go-auth.ts";
import { BackEndError, callBackEnd } from "./back-end.ts";
import type { Fetch } from "./back-end.ts";

type Schemas = components["schemas"];
export type Tokens = Schemas["TokensResponse"];
export type GoAuthUser = Schemas["User"];

/** The calls the server makes to go-auth, whose contract is contracts/go-auth.openapi.yaml. */
export class GoAuth {
  private readonly url: string;
  private readonly fetch: Fetch;

  constructor(url: string, fetchFunction: Fetch) {
    this.url = url;
    this.fetch = fetchFunction;
  }

  /** Posts a JSON body, as it came from the browser or as the server wrote it. */
  send(path: keyof paths, body: Uint8Array | string, clientAddress: string): Promise<Response> {
    return callBackEnd(this.fetch, this.url + path, {
      method: "POST",
      body,
      headers: { "content-type": "application/json" },
      clientAddress,
    });
  }

  /** The tokens that replace the refresh token, or null when go-auth refuses it. */
  async refresh(refreshToken: string, clientAddress: string): Promise<Tokens | null> {
    const body = JSON.stringify({ refresh_token: refreshToken });
    const answer = await this.send("/v1/auth/refresh", body, clientAddress);
    if (answer.status === 401) return null;
    return bodyOf<Tokens>(answer, 200);
  }

  async me(accessToken: string, clientAddress: string): Promise<GoAuthUser> {
    const body = JSON.stringify({ access_token: accessToken });
    const answer = await this.send("/v1/auth/me", body, clientAddress);
    return (await bodyOf<Schemas["MeResponse"]>(answer, 200)).user;
  }

  /** Ends the session of the refresh token. A 401 means that nothing was left to end. */
  async logout(refreshToken: string, clientAddress: string): Promise<void> {
    const body = JSON.stringify({ refresh_token: refreshToken });
    const answer = await this.send("/v1/auth/logout", body, clientAddress);
    if (answer.status !== 204 && answer.status !== 401) throw unexpected(answer);
  }
}

async function bodyOf<Body>(answer: Response, status: number): Promise<Body> {
  if (answer.status !== status) throw unexpected(answer);
  return (await answer.json()) as Body;
}

function unexpected(answer: Response): BackEndError {
  return new BackEndError(`go-auth answered ${answer.status} to ${answer.url}`);
}
