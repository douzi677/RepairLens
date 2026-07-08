/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DASHSCOPE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.json' {
  const value: Record<string, unknown>;
  export default value;
}
