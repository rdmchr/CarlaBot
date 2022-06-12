import { ArgsOf, Discord, On } from 'discordx';
import { execSQL } from '../utils/databaseManager.js';
import prisma from '@carla/database';
import { Message, MessageEmbed } from 'discord.js';
import fetch from 'node-fetch-native';

@Discord()
export class onMessage {
    @On('messageCreate')
    async onMessageCreate([ message ]: ArgsOf<'messageCreate'>): Promise<void> {
        if (message.author.bot) return;
        if (message.cleanContent.startsWith('$'))
            await this.handleSQLCommand([ message ]);
        this.handleTwitter([ message ]);
    }

    async handleTwitter([ message ]: ArgsOf<'messageCreate'>) {
        if (!message.guild) return;
        const token = process.env.TWITTER_TOKEN;
        const socialUrl = process.env.SOCIAL_CACHE_URL;
        if (!token || !socialUrl) return;

        const tweetRegex = new RegExp('https?:\\/\\/(?:www\\.)?twitter\\.com\\/(?:[a-zA-Z0-9_]{4,15}|i)\\/status\\/[0-9]{0,20}(?:/photo/[1-4])?/?');

        const tweets: string[] = [];
        const splitMessage = message.cleanContent.split(' ');
        for (const word of splitMessage) {
            const tweet = tweetRegex.exec(word);
            if (tweet) tweets.push(tweet[0]);
        }

        if (tweets.length === 0) return;

        const fetchedTweets: { id: string, photoNum: number, text: string, type: 'text' | 'photo' | 'video', userId: string, photoId?: number, authorName: string, authorUsername: string, authorPic: string }[] = [];
        for (const tweet of tweets) {
            const tweetId = tweet.split('/')[5].replaceAll(/\D/g, ''); // remove non-numeric characters
            if (fetchedTweets.find(t => t.id === tweetId)) continue;
            const tweetData = await fetch(`https://api.twitter.com/2/tweets?ids=${tweetId}&expansions=attachments.media_keys,author_id&tweet.fields=id&user.fields=profile_image_url`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (tweetData.status !== 200) continue;
            const tweetJSON = await tweetData.json().catch(() => null);
            if (!tweetJSON) continue;
            console.log(tweetJSON.includes.users);
            if (tweetJSON.data[0].attachments && tweetJSON.data[0].attachments.media_keys && tweetJSON.data[0].attachments.media_keys.length !== 0) {
                const type = tweetJSON.includes.media[0].type === 'photo' ? 'photo' : 'video';
                const photoPart = tweet.match('/photo/[1-4]/?');
                if (type === 'photo' && photoPart) {
                    // tweet points to a specific photo
                    const photoId = photoPart[0].split('/')[2];
                    if (photoId && Number(photoId) <= tweetJSON.data[0].attachments.media_keys.length) {
                        fetchedTweets.push({
                            id: tweetId,
                            photoNum: tweetJSON.data[0].attachments.media_keys.length,
                            text: removeTrailingShortLink(tweetJSON.data[0].text),
                            userId: tweetJSON.includes.users[0].id,
                            type,
                            photoId: Number(photoId),
                            authorName: tweetJSON.includes.users[0].name,
                            authorUsername: tweetJSON.includes.users[0].username,
                            authorPic: tweetJSON.includes.users[0].profile_image_url,
                        });
                    }
                } else {
                    // tweet does not point to a specific photo, all photos will be included
                    fetchedTweets.push({
                        id: tweetId,
                        photoNum: tweetJSON.data[0].attachments.media_keys.length,
                        text: removeTrailingShortLink(tweetJSON.data[0].text),
                        userId: tweetJSON.includes.users[0].id,
                        type,
                        authorName: tweetJSON.includes.users[0].name,
                        authorUsername: tweetJSON.includes.users[0].username,
                        authorPic: tweetJSON.includes.users[0].profile_image_url,
                    });
                }
            } else {
                fetchedTweets.push({
                    type: 'text',
                    id: tweetId,
                    photoNum: 0,
                    text: removeTrailingShortLink(tweetJSON.data[0].text),
                    userId: tweetJSON.includes.users[0].id,
                    authorName: tweetJSON.includes.users[0].name,
                    authorUsername: tweetJSON.includes.users[0].username,
                    authorPic: tweetJSON.includes.users[0].profile_image_url,
                });
            }
        }
        if (fetchedTweets.length === 0) return;
        const promises: Promise<Message<boolean>>[] = [];
        fetchedTweets.forEach(twt => {
            const embeds: MessageEmbed[] = [];
            if (twt.photoNum === 0) { // tweet does not contain any media, only attach text
                embeds.push(new MessageEmbed()
                    .setFooter({
                        text: `Carla Twitter Embed`,
                        iconURL: 'https://about.twitter.com/etc/designs/about2-twitter/public/img/favicon-32x32.png',
                    })
                    .setDescription(`${twt.text}`)
                    .setAuthor({
                        name: `${twt.authorName} (@${twt.authorUsername})`,
                        iconURL: twt.authorPic,
                        url: `https://twitter.com/${twt.authorUsername}`,
                    })
                    .setURL(`${socialUrl}/${twt.userId}/status/${twt.id}`)
                    .setColor('#1da1f2'));
                promises.push(message.reply({embeds}));
            } else {
                if (twt.type === 'video') { // tweet contains a video
                    promises.push(message.reply(`${socialUrl}/${twt.userId}/status/${twt.id}`));
                } else {
                    if (twt.photoId) { // only attach specified photo
                        embeds.push(new MessageEmbed()
                            .setFooter({
                                text: `Carla Twitter Embed`,
                                iconURL: 'https://about.twitter.com/etc/designs/about2-twitter/public/img/favicon-32x32.png',
                            })
                            .setDescription(`${twt.text}`)
                            .setAuthor({
                                name: `${twt.authorName} (@${twt.authorUsername})`,
                                iconURL: twt.authorPic,
                                url: `https://twitter.com/${twt.authorUsername}`,
                            })
                            .setURL(`${socialUrl}/${twt.userId}/status/${twt.id}`)
                            .setImage(`${socialUrl}/media/${twt.id}/${twt.photoId}`)
                            .setColor('#1da1f2'));
                    } else { // attach all photos
                        for (let i = 1; i <= twt.photoNum; i++) {
                            embeds.push(new MessageEmbed()
                                .setFooter({
                                    text: `Carla Twitter Embed`,
                                    iconURL: 'https://about.twitter.com/etc/designs/about2-twitter/public/img/favicon-32x32.png',
                                })
                                .setDescription(`${twt.text}`)
                                .setAuthor({
                                    name: `${twt.authorName} (@${twt.authorUsername})`,
                                    iconURL: twt.authorPic,
                                    url: `https://twitter.com/${twt.authorUsername}`,
                                })
                                .setURL(`${socialUrl}/${twt.userId}/status/${twt.id}`)
                                .setImage(`${socialUrl}/media/${twt.id}/${i}`)
                                .setColor('#1da1f2'));
                        }
                    }
                    promises.push(message.reply({embeds}));
                }
            }
        });
        await message.suppressEmbeds(true);
        setTimeout(() => message.suppressEmbeds(true), 1000); // sometimes embeds take a bit to load
        return Promise.all(promises);
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

function removeTrailingShortLink(text: string) {
    const regex = new RegExp('https:\/\/t\.co/[A-Za-z0-9]*');
    const parts = text.split(' ');
    if (parts.length === 0) {
        if (text.match(regex)) {
            return text.replace(regex, '');
        }
        return text;
    }
    const lastPart = parts.pop()!;
    if (lastPart.match(regex)) {
        // remove last part of text
        return parts.join(' ');
    }
    return text;
}