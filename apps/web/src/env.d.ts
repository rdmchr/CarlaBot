/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_DISCORD_OAUTH_CLIENT_ID: string
    readonly VITE_WEB_URL: string
    readonly VITE_SERVER_URL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}