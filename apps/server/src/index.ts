import Express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch-native';
import cors from 'cors';
import prisma from '@carla/database';
import {VERSION} from './constants.js';
import musicRoute from './routes/music.js';
import authRoute from './routes/auth.js';
import tweetRoute from './routes/tweet.js';
import tweetMedia from './routes/tweetMedia.js';

const webUrl = process.env.WEB_URL as string;

const corsOptions: cors.CorsOptions = {
    origin: [ webUrl ],
    credentials: true,
    methods: [ 'GET', 'POST' ],
};

const app = Express();
const PORT = 4000;

app.use(Express.urlencoded({extended: true}));
app.use(Express.json());
app.use(bodyParser.text());
app.use(cors(corsOptions));

app.get('/', async (req, res) => {
    return res.sendStatus(200);
});


app.use(musicRoute);
app.use(authRoute);
app.use(tweetRoute);
app.use(tweetMedia);

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}. Started server version ${VERSION}`);
});