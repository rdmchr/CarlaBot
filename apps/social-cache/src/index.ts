import Express from 'express';
import { VERSION } from './constants.js';
import twitterRoute from './routes/twitter.js';
import redditRoute from './routes/reddit.js';

const app = Express();
const PORT = 4444;

app.use(redditRoute);
app.use(twitterRoute);

app.get('/', async (req, res) => {
    return res.send(JSON.stringify({version: VERSION}));
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}. Started server version ${VERSION}`);
});