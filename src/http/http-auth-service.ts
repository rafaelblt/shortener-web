import type { components } from "@contracts/go-auth";
import type { User } from "@/domain/user";
import type {
  AuthService,
  Credentials,
  PasswordChange,
  PasswordChangeError,
  RegistrationError,
  SignInError,
} from "@/services/auth-service";
import { NotSignedInError } from "@/services/errors";
import type { Result } from "@/services/result";
import { err, ok } from "@/services/result";

import { fieldIssuesOf } from "./field-issues";
import type { Fetch } from "./server-requests";
import { bodyOf, errorBodyOf, send, unexpected } from "./server-requests";

type Schemas = components["schemas"];
// The server answers the user as go-auth does, and its errors in go-auth's shape.
type UserAnswer = Schemas["MeResponse"];
type ErrorAnswer = Schemas["Error"];

/** The accounts and the session, through the server of the app. See docs/architecture/server.md#the-api */
export class HttpAuthService implements AuthService {
  private readonly fetch: Fetch;

  constructor(fetchFunction: Fetch) {
    this.fetch = fetchFunction;
  }

  async currentUser(): Promise<User | null> {
    const answer = await send(this.fetch, "GET", "/api/session");
    if (answer.status === 401) return null;
    if (answer.status !== 200) throw unexpected(answer);
    return (await bodyOf<UserAnswer>(answer)).user;
  }

  async register({ username, password }: Credentials): Promise<Result<User, RegistrationError>> {
    const answer = await send(this.fetch, "POST", "/api/users", { username, password });
    if (answer.status === 201) return ok((await bodyOf<UserAnswer>(answer)).user);

    const { error } = await errorBodyOf<ErrorAnswer>(answer);
    if (error.code === "username_already_exists") return err({ code: "username_taken" });
    if (error.code === "validation_failed") {
      const fields = fieldIssuesOf(error.fields ?? [], {
        username: "username",
        password: "password",
      });
      return err({ code: "invalid_input", fields });
    }
    throw unexpected(answer);
  }

  async signIn({ username, password }: Credentials): Promise<Result<User, SignInError>> {
    const answer = await send(this.fetch, "POST", "/api/session", { username, password });
    if (answer.status === 200) return ok((await bodyOf<UserAnswer>(answer)).user);

    const { error } = await errorBodyOf<ErrorAnswer>(answer);
    if (error.code === "invalid_credentials") return err({ code: "invalid_credentials" });
    throw unexpected(answer);
  }

  async signOut(): Promise<void> {
    const answer = await send(this.fetch, "DELETE", "/api/session");
    if (answer.status !== 204) throw unexpected(answer);
  }

  async changePassword({
    currentPassword,
    newPassword,
  }: PasswordChange): Promise<Result<void, PasswordChangeError>> {
    const answer = await send(this.fetch, "POST", "/api/session/password", {
      current_password: currentPassword,
      new_password: newPassword,
    });
    if (answer.status === 204) return ok(undefined);

    const { error } = await errorBodyOf<ErrorAnswer>(answer);
    if (error.code === "not_signed_in") throw new NotSignedInError();
    if (error.code === "invalid_credentials") return err({ code: "invalid_credentials" });
    if (error.code === "validation_failed") {
      const fields = fieldIssuesOf(error.fields ?? [], { new_password: "newPassword" });
      return err({ code: "invalid_input", fields });
    }
    throw unexpected(answer);
  }
}
