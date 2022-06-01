import Express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch-native';
import cors from 'cors';
import prisma from '@carla/database';
import { generateJWT, getUserFromJWT } from './utils.js';
import {VERSION} from './constants.js';
import { getEnvValue } from '@carla/variable-provider';

const clientId = getEnvValue("DISCORD_OAUTH_CLIENT_ID") as string;
const clientSecret = getEnvValue("DISCORD_OAUTH_CLIENT_SECRET") as string;
const webUrl = getEnvValue("WEB_URL") as string;

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

app.get('/music', async (req, res) => {
    const jwt = req.headers.authorization as string;
    if (!jwt) {
        return res.sendStatus(401);
    }
    const user = await getUserFromJWT(jwt);
    console.log(user);
    if (!user) {
        return res.sendStatus(403);
    }
    return res.status(200).send({userId: user});
})

app.get('/auth', async (req, res) => {
    const code = req.query.code as string;
    if (!code) {
        return;
    }
    const resp = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        body: new URLSearchParams({
            'client_id': clientId,
            'client_secret': clientSecret,
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': `${webUrl}/auth`,
        }),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    const json = await resp.json();

    if (!json.refresh_token) {
        console.log(json);
        return res.send({error: 'Something went wrong. Please try again.'}).status(400);
    }
    if (!json.scope.includes('email') || !json.scope.includes('identify') || !json.scope.includes('guilds') || !json.scope.includes('connections')) {
        return res.send({error: 'Invalid scope'}).status(400);
    }
    const {refresh_token, access_token, expires_in} = json;
    const expiration = new Date(Date.now() + expires_in * 1000);

    const userData = await fetch('https://discord.com/api/users/@me', {
        method: 'GET',
        headers: {
            authorization: `Bearer ${access_token}`,
        },
    });

    const userJson = await userData.json();

    if (!userJson.id) {
        return res.send({error: 'Could not authenticate.'}).status(400);
    }

    let webUser = await prisma.webUser.findUnique({
        where: {
            dcId: userJson.id,
        },
    });

    if (!webUser) {
        webUser = await prisma.webUser.create({
            data: {
                dcId: userJson.id,
                dcAccessToken: access_token,
                email: userJson.email,
                dcRefreshToken: refresh_token,
                dcAccessExpires: expiration.getTime(),
            },
        });
    }

    const token = generateJWT(webUser.id);

    return res.cookie('authorization', token, {
        secure: true,
        httpOnly: true,
        maxAge: expiration.getTime() - Date.now(),
        sameSite: 'strict',
    }).send({success: true, expiresAt: expiration.getTime()});
});

app.listen(4000, () => {
    console.log(`Listening on port ${PORT}. Started server version ${VERSION}`);
});