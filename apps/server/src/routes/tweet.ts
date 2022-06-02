import prisma from '@carla/database';
import Express from 'express';

const router = Express.Router();
const serverUrl = process.env.SERVER_URL;

type tweetResponse = {
    text: string,
    author: {
        name: string,
        username: string
    },
    media: string[],
}

router.get('/tweet:id', async (req, res) => {
    const tweet = await prisma.tweet.findUnique({
        where: {
            id: req.params.id
        },
        include: {
            author: true,
            media: true
        }
    });
    if (!tweet) {
        return res.status(404).send({ error: 'Tweet not found' });
    }

    const response: tweetResponse = {
        text: tweet.text,
        author: {
            name: tweet.author.name,
            username: tweet.author.username,
        },
        media: []
    }

    if (tweet.media) {
        const media = tweet.media.map((m) => {
            return `${serverUrl}/tweetMedia/${m.id}`
        })
        response.media.push(...media);
    }
});

export default router;