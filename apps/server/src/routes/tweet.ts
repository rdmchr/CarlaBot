import prisma from '@carla/database';
import Express from 'express';

const router = Express.Router();
const serverUrl = process.env.SERVER_URL;

type tweetResponse = {
    text: string,
    url: string,
    author: {
        name: string,
        username: string
    },
    media: {
        url: string,
        type: string
    }[],
}

router.get('/tweet/:id', async (req, res) => {
    const tweet = await prisma.tweet.findUnique({
        where: {
            id: req.params.id,
        },
        include: {
            author: true,
            media: true,
        },
    });
    if (!tweet) {
        return res.status(404).send({error: 'Tweet not found'});
    }

    const response: tweetResponse = {
        text: tweet.text,
        url: `https://twitter.com/${tweet.authorId}/status${tweet.id}`,
        author: {
            name: tweet.author.name,
            username: tweet.author.username,
        },
        media: [],
    };

    if (tweet.media) {
        const media = tweet.media.map((m) => {
            return {
                url: `${serverUrl}/tweetMedia/${m.awsKey}`,
                type: m.type,
            };
        });
        response.media.push(...media);
    }

    return res.status(200).send(response);
});

export default router;