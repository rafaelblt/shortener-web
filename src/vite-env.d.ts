/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Where short links live, such as https://sho.rt. See src/pages/shared/short-link.ts */
  readonly VITE_SHORT_LINK_BASE_URL?: string;
}
