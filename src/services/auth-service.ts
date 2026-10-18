import type { User } from "@/domain/user";

import type { InvalidInput } from "./errors";
import type { Result } from "./result";

export interface Credentials {
  username: string;
  password: string;
}

export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
}

export type RegistrationError = { code: "username_taken" } | InvalidInput<"username" | "password">;

/** Any failure, an unknown username included, so that it doesn't tell which accounts exist. */
export interface SignInError {
  code: "invalid_credentials";
}

export type PasswordChangeError = { code: "invalid_credentials" } | InvalidInput<"newPassword">;

export interface AuthService {
  currentUser(): Promise<User | null>;
  /** Creates the account without signing in. */
  register(credentials: Credentials): Promise<Result<User, RegistrationError>>;
  signIn(credentials: Credentials): Promise<Result<User, SignInError>>;
  signOut(): Promise<void>;
  /** Changes the password of the signed-in user, which ends every session, this one included. */
  changePassword(change: PasswordChange): Promise<Result<void, PasswordChangeError>>;
}
