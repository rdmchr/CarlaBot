<script lang="ts" context="module">
    import { goto } from '$app/navigation';
    import { browser } from '$app/env';

    export async function load({params}) {
        const SERVER_URL = import.meta.env.VITE_SERVER_URL;
        const tweetId = params.id;
        const tweet = await fetch(`${SERVER_URL}/tweet/${tweetId}`);
        const tweetData = await tweet.json();
        /*if (browser)
            window.location = tweetData.media[0];*/
        return {
            props: {
                tweet: tweetData,
                tweetLink: `https://twitter.com/${tweetData.author.username}/status/${tweetId}`,
            },
        };
    }
</script>

<svelte:head>
    <title>Test</title>

    <meta content='text/html; charset=UTF-8' http-equiv='Content-Type' />
    <meta content="#1da0f2" name="theme-color" />
    <meta property="og:site_name" content="Carla">

    <meta http-equiv="refresh" content="0; url = {$$props.tweet.url}" />

    <meta content="Carla Twitter Embed" property="og:title"/>
    <meta name="og:site_name" content="Carla Twitter Embed" />
    {#if $$props.tweet.media[0].type === 'photo'}
        <meta content={$$props.tweet.media[0].url} property="og:image"/>
    {:else}
        <meta name="twitter:card" content="player" />
        <meta name="twitter:title" content="Carla" />
        <meta name="twitter:image" content="{$$props.tweet.url}" />
        <meta name="twitter:player:width" content="720" />
        <meta name="twitter:player:height" content="480" />
        <meta name="twitter:player:stream" content={$$props.tweet.media[0].url} />
        <meta name="twitter:player:stream:content_type" content="video/mp4" />

        <meta property="og:url" content="{$$props.tweet.media[0].url}" />
        <meta property="og:video" content="{$$props.tweet.media[0].url}" />
        <meta property="og:video:secure_url" content="{$$props.tweet.media[0].url}" />
        <meta property="og:video:type" content="video/mp4" />
        <meta property="og:video:width" content="720" />
        <meta property="og:video:height" content="480" />
        <meta name="twitter:title" content="Carla" />
        <meta property="og:image" content="{$$props.tweet.media[0].url}" />
    {/if}
</svelte:head>

<p>{JSON.stringify($$props.tweet)}</p>