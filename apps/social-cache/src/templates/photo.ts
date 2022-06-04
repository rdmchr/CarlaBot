const template = (photoUrl: string, tweetUrl: string, text: string) => {
    return `
    <title>Carla Social Cache</title>

    <meta content='text/html; charset=UTF-8' http-equiv='Content-Type' />
    <meta content="#1da0f2" name="theme-color" />
    <meta property="og:site_name" content="Carla Social Cache">

    <meta http-equiv="refresh" content="0; url = ${tweetUrl}" />

    <meta content="Carla Twitter Embed" property="og:title"/>
    <meta name="og:site_name" content="Carla Social Cache" />
    <meta name="og:description" content="${text}" />
    
    <meta name="twitter:title" content="Carla" />
    <meta name="twitter:image" content="${photoUrl}" />

    <meta property="og:url" content="${photoUrl}}" />
    <meta name="twitter:title" content="Carla Social Cache" />
    <meta property="og:image" content="${photoUrl}" />
    <meta name="twitter:card" content="summary_large_image">
            `
}

export default template;