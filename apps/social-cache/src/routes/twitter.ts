import Express from 'express';
import prisma from '@carla/database';
import { fetchTweetFromId, getPreSignedUrl, uploadToS3 } from '../utils/twitterUtils.js';
import fetch from 'node-fetch-native';
import videoTemplate from '../templates/video.js';

const router = Express.Router();

router.get('/:user/status/:id', async (req, res) => {
    const token = process.env.TWITTER_TOKEN;
    if (!token) return res.send('No token');

    const { user, id } = req.params;
    const dbTweet = await prisma.tweet.findUnique({
        where: {
            id: id,
        },
        include: {
            media: true,
        }
    });

    if (dbTweet) {
        const videoUrl = await getPreSignedUrl(dbTweet.media[0].awsKey);

        return res.send(videoTemplate(videoUrl));
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

    const videoUrl = await getPreSignedUrl(tweet.media[0].awsKey);

    return res.send(videoTemplate(videoUrl));
});

export default router;