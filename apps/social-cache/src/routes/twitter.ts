import Express from 'express';
import prisma from '@carla/database';
import { fetchTweetFromId, getPreSignedUrl, removeTrailingShortLink, uploadToS3 } from '../utils/twitterUtils.js';
import fetch from 'node-fetch-native';
import videoTemplate from '../templates/video.js';
import photoTemplate from '../templates/photo.js';
import gifTemplate from '../templates/gif.js';

const router = Express.Router();

router.get('/:user/status/:id', async (req, res) => {
    const token = process.env.TWITTER_TOKEN;
    if (!token) return res.send('No token');

    const {user, id} = req.params;
    const dbTweet = await prisma.tweet.findUnique({
        where: {
            id: id,
        },
        include: {
            media: true,
        },
    });

    if (dbTweet) {
        const videoUrl = await getPreSignedUrl(dbTweet.media[0].awsKey);
        const tweetUrl = `https://twitter.com/${dbTweet.authorId}/status/${id}`;
        return res.send(videoTemplate(videoUrl, tweetUrl, removeTrailingShortLink(dbTweet.text)));
    }

    // fetch tweet from twitter
    const tweet = await fetchTweetFromId(id, token).catch((e) => console.log(e));
    if (!tweet) return res.send('No tweet found');

    // upload media to s3
    const s3Promises = [];
    for (const media of tweet.media) {
        const res = await fetch(media.url);
        const fileExtension = media.url.split('.').pop()!.includes('?') ? media.url.split('.').pop()!.split('?').shift() : media.url.split('.').pop();
        const fileName = `${media.media_key}.${fileExtension}`;
        if (res.body) {
            s3Promises.push(uploadToS3(res.body, fileName));
        } else {
            console.log('Error fetching media');
        }
    }
    await Promise.all(s3Promises);

    // add to database
    await prisma.tweet.create({
        data: {
            id: tweet.id,
            text: tweet.text,
            author: {
                connectOrCreate: {
                    where: {
                        id: tweet.author.id,
                    },
                    create: {
                        id: tweet.author.id,
                        username: tweet.author.username,
                        name: tweet.author.name,
                    },
                },
            },
            media: {
                connectOrCreate: tweet.media.map((media) => {
                    return {
                        where: {
                            mediaKey: media.media_key,
                        },
                        create: {
                            mediaKey: media.media_key,
                            originalUrl: media.url,
                            type: media.type,
                            awsKey: media.awsKey,
                            width: media.width,
                            height: media.height,
                        },
                    };
                }),
            },
        },
    });

    const mediaUrl = await getPreSignedUrl(tweet.media[0].awsKey);
    const tweetUrl = `https://twitter.com/${tweet.author.id}/status/${tweet.id}`;
    const text = removeTrailingShortLink(tweet.text);

    switch (tweet.media[0].type) {
        case 'photo':
            return res.send(photoTemplate(mediaUrl, tweetUrl, text));
        case 'video':
            return res.send(videoTemplate(mediaUrl, tweetUrl, text));
        case 'animated_gif':
            return res.send(gifTemplate(mediaUrl, tweetUrl, text));
        default:
            return res.send('No template found');
    }
});

export default router;