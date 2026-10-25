const DEFAULT_PORT = 3000;
const SESSION_KEY_BYTES = 32;

/** What the server reads from its environment. See docs/architecture/server.md#settings */
export interface ServerSettings {
  port: number;
  /** The back ends the app runs on, or null for the simulation, which has none. */
  backEnds: BackEndSettings | null;
}

export interface BackEndSettings {
  /** Where go-auth answers, such as `http://go-auth.railway.internal:8080`. */
  goAuthUrl: string;
  /** Where the shortener's API answers. */
  shortenerUrl: string;
  /** The key that encrypts the sessions. Changing it signs everyone out. */
  sessionKey: Buffer;
  /** The header in which the proxy in front of the server gives the client's address, if any. */
  clientAddressHeader: string | undefined;
}

export class SettingsError extends Error {
  override name = "SettingsError";
}

/** The settings, from environment variables. Throws a SettingsError that names what is wrong. */
export function settingsFromEnvironment(
  environment: Record<string, string | undefined>,
): ServerSettings {
  return {
    port: portFrom(environment.PORT),
    backEnds: simulationFrom(environment.SIMULATION) ? null : backEndSettingsFrom(environment),
  };
}

function backEndSettingsFrom(environment: Record<string, string | undefined>): BackEndSettings {
  return {
    goAuthUrl: urlFrom("GO_AUTH_URL", environment.GO_AUTH_URL),
    shortenerUrl: urlFrom("SHORTENER_URL", environment.SHORTENER_URL),
    sessionKey: sessionKeyFrom(environment.SESSION_KEY),
    clientAddressHeader: headerFrom(environment.CLIENT_ADDRESS_HEADER),
  };
}

function simulationFrom(value: string | undefined): boolean {
  if (value === undefined || value === "" || value === "false") return false;
  if (value === "true") return true;
  throw new SettingsError(`SIMULATION must be true or false, not "${value}"`);
}

function portFrom(value: string | undefined): number {
  if (value === undefined || value === "") return DEFAULT_PORT;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new SettingsError(`PORT must be a number from 1 to 65535, not "${value}"`);
  }
  return port;
}

function urlFrom(name: string, value: string | undefined): string {
  if (value === undefined || value === "") {
    throw new SettingsError(`${name} is required, unless SIMULATION is true`);
  }
  const protocol = URL.parse(value)?.protocol;
  if (protocol !== "http:" && protocol !== "https:") {
    throw new SettingsError(`${name} must be an http or https URL, not "${value}"`);
  }
  return value.replace(/\/+$/, "");
}

function sessionKeyFrom(value: string | undefined): Buffer {
  const key = Buffer.from(value ?? "", "base64");
  if (key.length !== SESSION_KEY_BYTES) {
    throw new SettingsError(
      `SESSION_KEY must be ${SESSION_KEY_BYTES} random bytes in base64, such as \`openssl rand -base64 32\` writes, not ${key.length} bytes`,
    );
  }
  return key;
}

function headerFrom(value: string | undefined): string | undefined {
  const header = value?.trim().toLowerCase();
  return header === "" ? undefined : header;
}
