import jwt, { JwtPayload } from 'jsonwebtoken';
import prisma from '@carla/database';
import fetch from 'node-fetch-native';

const JWT_SECRET = process.env.JWT_SECRET as string;

type DcApiGuild = {
    id: string;
    name: string;
    icon: string;
    owner: boolean;
    permissions: string;
    features: string[];
}

function getJwtSecret() {
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET not set');
    }
    return JWT_SECRET;
}

export function generateJWT(userId: string) {
    return jwt.sign({userId}, getJwtSecret(), {expiresIn: '7d'});
}

export function authenticateJWT(token: string) {
    return jwt.verify(token, getJwtSecret());
}

export async function getUserGuildsFromDiscord(userId: string): Promise<null | DcApiGuild[]> {
    const token = await getDiscordAPIToken(userId);
    if (!token) {
        console.log('No token');
        return null;
    }
    console.log(token);
    const guilds = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    const json = await guilds.json();
    console.log(json);
    if (json.code !== 200) {
        return null;
    }
    return json.guilds;
}

/**
 * Get the user's discord api token from the database. Automatically refreshes the token if it is expired.
 * @param userId the web id of the user
 */
export async function getDiscordAPIToken(userId: string) {
    const user = await prisma.webUser.findUnique({
        where: {
            id: userId,
        },
    });
    if (!user) return null;
    console.log("DEBUG 1")
    console.log(user.dcAccessExpires + " | " + Date.now())
    if (user.dcAccessExpires > Date.now()) return user.dcAccessToken; // current token is still valid
    console.log("DEBUG 2")

    const resp = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        body: new URLSearchParams({
            'client_id': process.env.DISCORD_OAUTH_CLIENT_ID as string,
            'client_secret': process.env.DISCORD_OAUTH_CLIENT_SECRET as string,
            'grant_type': 'refresh_token',
            'refresh_token': user.dcRefreshToken,
        }),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    const json = await resp.json();
    if (!json.access_token) return null;
    console.log("DEBUG 3")

    await prisma.webUser.update({
        where: {
            id: userId,
        },
        data: {
            dcAccessToken: json.access_token,
            dcAccessExpires: Date.now() + json.expires_in * 1000,
        },
    });
    return json.access_token;
}

/**
 * Returns the user's web id or null if the user is not authorized or unauthenticated.
 * @param token the JWT token
 */
export async function getUserFromJWT(token: string): Promise<null | string> {
    const data = authenticateJWT(token) as JwtPayload;
    const userId = data.userId;
    if (!userId) return null;
    const guilds = await getUserGuildsFromDiscord(userId);
    console.log(guilds);
    if (!guilds) return null;
    console.log(guilds);
    console.log(typeof guilds);
    const guild = guilds.find(g => g.id === process.env.DISCORD_GUILD_ID as string);
    if (!guild) {
        // user is not a member of the server
        return null;
    }
    return userId;
}