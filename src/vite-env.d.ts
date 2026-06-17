/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GO_BACKEND_URL: string;
  readonly VITE_INTERNAL_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
