import Express from 'express';
import cors from 'cors';
import {VERSION} from './constants.js';
import twitterRoute from './routes/twitter.js';
import redditRoute from './routes/reddit.js';

const app = Express();
const PORT = 4444;


app.use(cors());

app.use(redditRoute);
app.use(twitterRoute);

app.use((req, res, next) => {
    console.log(`\n=================================`);
    console.log(req.headers['user-agent']);
    console.log(`=================================`);
    next();
})

app.get('/', async (req, res) => {
    return res.send('Ok');
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}. Started server version ${VERSION}`);
});