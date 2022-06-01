import { ArgsOf, Discord, On } from "discordx";
import { execSQL } from "../utils/databaseManager.js";
import prisma from "@carla/database";
import { Client } from "twitter-api-sdk";
import { getEnvValue } from "@carla/variable-provider";
import axios from "axios";

type TwitterResponse = {
    data: {
        attachements: {
            media_keys: string[]
        },
        id: string,
        author_id: string,
        created_at: string,
        public_metrics: {
            retweet_count: number,
            reply_count: number,
            like_count: number
            quote_count: number
        },
        text: string
    },
    includes: {
        media: [
            {
                height: number,
                width: number,
                url: string,
                media_key: string
                type: "photo" | "video"
            }
        ],
        users: [
            {
                id: string,
                username: string,
                name: string,
            }
        ]
    }
}

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
            const tweetId = link.split('/')[5];
            const url = `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=public_metrics&expansions=attachments.media_keys,author_id,geo.place_id&media.fields=duration_ms,height,media_key,public_metrics,type,url,width`
            const res = await axios.get<TwitterResponse>(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const {data} = res.data;
            if (!data) continue;
            console.log(data);
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