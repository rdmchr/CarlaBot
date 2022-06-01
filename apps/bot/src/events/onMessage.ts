import { ArgsOf, Discord, On } from "discordx";
import { execSQL } from "../utils/databaseManager.js";
import prisma from "@carla/database";
import {Client} from "twitter-api-sdk";
import { getEnvValue } from "@carla/variable-provider";

@Discord()
export class onMessage {
    @On('messageCreate')
    async onMessageCreate([message]: ArgsOf<"messageCreate">): Promise<void> {
        if (message.author.bot) return;
        if (message.cleanContent.startsWith('$'))
            this.handleSQLCommand([message]);
        else
            this.checkForTwitter([message]);
    }

    //TODO: check if url points to specific video or photo
    async checkForTwitter([message]: ArgsOf<"messageCreate">) {
        const token = getEnvValue('TWITTER_TOKEN');
        if (!token) return;
        const tweetLinks = message.cleanContent.match('http(?:s)?:\/\/(?:www\.)?twitter\.com\/(?:[a-zA-Z0-9_]{4,15}|i)/status/[0-9]{0,20}');
        if (!tweetLinks) return;
        const client = new Client(token);
        for (const link of tweetLinks) {
            const tweet = await client.tweets.findTweetById(link.split('/')[5], {"media.fields": ["url", "type", "media_key"]});
            if (!tweet) continue;
        }
    }

    async handleSQLCommand([message]: ArgsOf<"messageCreate">) {
        if (!message.guild) return;
        const channel = message.guild.channels.resolve(message.channel.id);
        if (!channel || !channel.parent || channel.parent.name !== 'Databases') return;
        const server = await prisma.server.findUnique({
            where: {
                channel: message.channel.id
            }
        });
        prisma.$disconnect();
        if (!server) return;
        if (!message.cleanContent.startsWith('$')) return;
        const sql = message.cleanContent.substring(1);
        const response = await execSQL(server.id, sql);
        if (response) {
            await message.reply(response);
        }
    }
}