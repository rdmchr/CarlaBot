import { ArgsOf, Discord, On } from 'discordx';
import { execSQL } from '../utils/databaseManager.js';
import prisma from '@carla/database';
import fetch from 'node-fetch-native';
import { uploadToS3 } from '../utils/s3Handler.js';
import { database } from '../commands/database.js';

type TwitterResponse = {
    data: [{
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
    }],
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
    url: string,
    type: string
}

interface tweetData {
    id: string,
    text: string,
    author: {
        id: string,
        username: string,
        name: string
    },
    media: {
        media_key: string,
        url: string,
        type: string,
        awsKey: string
    }[]
}

@Discord()
export class onMessage {
    @On('messageCreate')
    async onMessageCreate([message]: ArgsOf<'messageCreate'>): Promise<void> {
        if (message.author.bot) return;
        if (message.cleanContent.startsWith('$'))
            await this.handleSQLCommand([message]);
        else
            await this.checkForTwitter([message]);
    }

    //TODO: check if url points to specific video or photo
    async checkForTwitter([message]: ArgsOf<'messageCreate'>) {
        const token = process.env.TWITTER_TOKEN;
        const serverUrl = process.env.SERVER_URL;

        if (!token) return;
        const tweetLinks = message.cleanContent.match('http(?:s)?:\/\/(?:www\.)?twitter\.com\/(?:[a-zA-Z0-9_]{4,15}|i)/status/[0-9]{0,20}');
        if (!tweetLinks) return;
        const fetchedKeys: string[] = [];
        const mediaEntities: mediaEntity[] = [];
        const tweetData: tweetData[] = [];

        // fetch media from tweets
        for (const link of tweetLinks) {
            const tweetId = link.split('/')[5];

            // look for tweet in database
            const tweet = await prisma.tweet.findUnique({
                where: {
                    id: tweetId,
                },
            });

            if (tweet) {
                await message.reply(`${serverUrl}/tweet/${tweetId}`);
                return;
            }

            const url = `https://api.twitter.com/2/tweets?ids=${tweetId}&expansions=author_id,attachments.media_keys&tweet.fields=id,created_at,public_metrics&media.fields=media_key,duration_ms,height,preview_image_url,type,url,width,public_metrics,alt_text,variants`;
            const res = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const rawData: TwitterResponse = await res.json();
            const { includes } = rawData;
            const data = rawData.data[0];
            if (!data.attachments || !includes) {
                continue;
            }

            const tempTweet: tweetData = {
                id: data.id,
                text: data.text,
                author: {
                    name: includes.users[0].name,
                    username: includes.users[0].username,
                    id: includes.users[0].id,
                },
                media: []
            }

            for (const media of includes.media) {
                //if (fetchedKeys.includes(media.media_key)) continue;
                if (tweetData.filter((tweet) => tweet.media.find((media) => media.media_key === media.media_key)).length > 0) continue;
                fetchedKeys.push(media.media_key);
                mediaEntities.push({ url: media.url, media_key: media.media_key, type: media.type });
                tempTweet.media.push({
                    media_key: media.media_key,
                    url: media.url,
                    type: media.type,
                    awsKey: `${media.media_key}.${media.url.split('.')[media.url.split('.').length - 1]}`,
                })
            }

            tweetData.push(tempTweet);
        }

        // add to database
        for (const tweet of tweetData) {
            await prisma.tweet.create({
                data: {
                    id: tweet.id,
                    text: tweet.text,
                    author: {
                        connectOrCreate: {
                            where: {
                                id: tweet.author.id
                            },
                            create: {
                                id: tweet.author.id,
                                name: tweet.author.name,
                                username: tweet.author.username
                            }
                        }
                    },
                    media: {
                        connectOrCreate: tweet.media.map((media) => {
                            return {
                                where: {
                                    mediaKey: media.media_key
                                },
                                create: {
                                    mediaKey: media.media_key,
                                    originalUrl: media.url,
                                    type: media.type,
                                    awsKey: media.awsKey
                                }
                            }
                        }),
                    }
                }
            });
        }


        // upload media to s3
        const s3Promises = [];
        for (const mediaEntity of mediaEntities) {
            const res = await fetch(mediaEntity.url);
            const fileExtension = mediaEntity.url.split('.')[mediaEntity.url.split('.').length - 1];
            const fileName = `${mediaEntity.media_key}.${fileExtension}`;
            if (res.body) {
                s3Promises.push(uploadToS3(res.body, fileName));
            } else {
                console.log('Error fetching media');
            }
        }
        await Promise.all(s3Promises);
    }

    async handleSQLCommand([message]: ArgsOf<'messageCreate'>) {
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