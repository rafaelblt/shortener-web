import { hasIssues } from "@/domain/issue";
import type { User } from "@/domain/user";
import { newPasswordIssue, normalizeUsername, passwordIssue, usernameIssue } from "@/domain/user";
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

import { wait } from "./latency";
import type { SimulationOptions, SimulationStore, StoredUser } from "./store";

export class SimulatedAuthService implements AuthService {
  private readonly store: SimulationStore;
  private readonly options: SimulationOptions;

  constructor(store: SimulationStore, options: SimulationOptions) {
    this.store = store;
    this.options = options;
  }

  async currentUser(): Promise<User | null> {
    await wait(this.options.latency);
    const user = this.signedInUser();
    return user ? publicUser(user) : null;
  }

  async register(credentials: Credentials): Promise<Result<User, RegistrationError>> {
    await wait(this.options.latency);
    const fields = {
      username: usernameIssue(credentials.username),
      password: passwordIssue(credentials.password),
    };
    if (hasIssues(fields)) return err({ code: "invalid_input", fields });

    const username = normalizeUsername(credentials.username);
    if (this.store.userByUsername(username)) return err({ code: "username_taken" });

    const user = { id: this.options.newId(), username, password: credentials.password };
    this.store.users.set(user.id, user);
    return ok(publicUser(user));
  }

  async signIn(credentials: Credentials): Promise<Result<User, SignInError>> {
    await wait(this.options.latency);
    const user = this.store.userByUsername(normalizeUsername(credentials.username));
    if (user?.password !== credentials.password) return err({ code: "invalid_credentials" });

    this.store.signedInUserId = user.id;
    return ok(publicUser(user));
  }

  async signOut(): Promise<void> {
    await wait(this.options.latency);
    this.store.signedInUserId = null;
  }

  async changePassword(change: PasswordChange): Promise<Result<void, PasswordChangeError>> {
    await wait(this.options.latency);
    const user = this.signedInUser();
    if (!user) throw new NotSignedInError();

    const newPassword = newPasswordIssue(change.newPassword, change.currentPassword);
    if (newPassword) return err({ code: "invalid_input", fields: { newPassword } });
    if (user.password !== change.currentPassword) return err({ code: "invalid_credentials" });

    user.password = change.newPassword;
    this.store.signedInUserId = null;
    return ok(undefined);
  }

  private signedInUser(): StoredUser | undefined {
    const id = this.store.signedInUserId;
    return id === null ? undefined : this.store.users.get(id);
  }
}

function publicUser({ id, username }: StoredUser): User {
  return { id, username };
}
