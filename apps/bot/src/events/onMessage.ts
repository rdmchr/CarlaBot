import { ArgsOf, Discord, On } from 'discordx';
import { execSQL } from '../utils/databaseManager.js';
import prisma from '@carla/database';
import fetch from 'node-fetch-native';
import { uploadToS3 } from '../utils/s3Handler.js';

type TwitterResponse = {
    data: [ {
        attachments?: {
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
    } ],
    includes?: {
        media: [
            {
                height: number,
                width: number,
                url: string,
                media_key: string
                type: 'photo' | 'video'
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

interface mediaEntity {
    media_key: string,
    url: string
}

@Discord()
export class onMessage {
    @On('messageCreate')
    async onMessageCreate([ message ]: ArgsOf<'messageCreate'>): Promise<void> {
        if (message.author.bot) return;
        if (message.cleanContent.startsWith('$'))
            await this.handleSQLCommand([ message ]);
        else
            await this.checkForTwitter([ message ]);
    }

    //TODO: check if url points to specific video or photo
    async checkForTwitter([ message ]: ArgsOf<'messageCreate'>) {
        const token = process.env.TWITTER_TOKEN;

        if (!token) return;
        const tweetLinks = message.cleanContent.match('http(?:s)?:\/\/(?:www\.)?twitter\.com\/(?:[a-zA-Z0-9_]{4,15}|i)/status/[0-9]{0,20}');
        if (!tweetLinks) return;
        const fetchedKeys: string[] = [];
        const mediaEntities: mediaEntity[] = [];

        // fetch media from tweets
        for (const link of tweetLinks) {
            const tweetId = link.split('/')[5];
            const url = `https://api.twitter.com/2/tweets?ids=${tweetId}&expansions=author_id,attachments.media_keys&tweet.fields=id,created_at,public_metrics&media.fields=media_key,duration_ms,height,preview_image_url,type,url,width,public_metrics,alt_text,variants`;
            const res = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const rawData: TwitterResponse = await res.json();
            const {includes} = rawData;
            const data = rawData.data[0];
            if (!data.attachments || !includes) {
                continue;
            }
            for (const media of includes.media) {
                if (fetchedKeys.includes(media.media_key)) continue;
                fetchedKeys.push(media.media_key);
                mediaEntities.push({url: media.url, media_key: media.media_key});
            }
        }

        // upload media to s3
        const s3Promises = [];
        for (const mediaEntity of mediaEntities) {
            const res = await fetch(mediaEntity.url);
            const filename = mediaEntity.url.split('/')[mediaEntity.url.split('/').length - 1];
            if (res.body) {
                s3Promises.push(uploadToS3(res.body, filename));
            } else {
                console.log('Error fetching media');
            }
        }
        await Promise.all(s3Promises);
    }

    async handleSQLCommand([ message ]: ArgsOf<'messageCreate'>) {
        if (!message.guild) return;
        const channel = message.guild.channels.resolve(message.channel.id);
        if (!channel || !channel.parent || channel.parent.name !== 'Databases') return;
        const server = await prisma.server.findUnique({
            where: {
                channel: message.channel.id,
            },
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