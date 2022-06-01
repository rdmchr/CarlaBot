<script lang="ts" async>
    import { browser } from '$app/env';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';

    let error = '';

    const DISCORD_OAUTH_CLIENT_ID = import.meta.env.VITE_DISCORD_OAUTH_CLIENT_ID;
    const WEB_URL = import.meta.env.VITE_WEB_URL;
    const SERVER_URL = import.meta.env.VITE_SERVER_URL;

    async function authenticate() {
        const code = $page.url.searchParams.get('code');
        if (!code) {
            await goto(`https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(DISCORD_OAUTH_CLIENT_ID)}&redirect_uri=${encodeURIComponent(WEB_URL)}/auth&response_type=code&scope=identify%20connections%20email%20guilds`);
        } else {
            const res = await fetch(`${SERVER_URL}/auth?code=${code}`, {
                credentials: 'include',
            });
            const json = await res.json();
            // console.log(json);
            if (json.error) {
                error = json.error;
            }
        }
    }

    if (browser)
        authenticate();
</script>


<h1>Please login</h1>
<p>{error}</p>
