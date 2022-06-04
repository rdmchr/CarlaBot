const template = (videoUrl: string, tweetUrl: string, text: string) => {
    return `
    <title>Carla Social Cache</title>

    <meta content='text/html; charset=UTF-8' http-equiv='Content-Type' />
    <meta content="#1da0f2" name="theme-color" />
    <meta property="og:site_name" content="Carla Social Cache">

    <meta http-equiv="refresh" content="0; url = ${tweetUrl}" />

    <meta content="Carla Twitter Embed" property="og:title"/>
    <meta name="og:site_name" content="Carla Social Cache" />
    <meta name="og:description" content="${text}" />
    

        <meta name="twitter:card" content="player" />
        <meta name="twitter:title" content="Carla" />
        <meta name="twitter:image" content="${videoUrl}" />
        <meta name="twitter:player:width" content="720" />
        <meta name="twitter:player:height" content="480" />
        <meta name="twitter:player:stream" content="${videoUrl}" />
        <meta name="twitter:player:stream:content_type" content="video/mp4" />

        <meta property="og:url" content="${videoUrl}}" />
        <meta property="og:video" content="${videoUrl}" />
        <meta property="og:video:secure_url" content="${videoUrl}" />
        <meta property="og:video:type" content="video/mp4" />
        <meta property="og:video:width" content="720" />
        <meta property="og:video:height" content="480" />
        <meta name="twitter:title" content="Carla Social Cache" />
        <meta property="og:image" content="${videoUrl}" />
            `
}

export default template;