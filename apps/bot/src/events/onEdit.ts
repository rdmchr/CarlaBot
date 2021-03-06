import { ArgsOf, Discord, On } from 'discordx';
import { Client, MessageEmbed } from 'discord.js';

@Discord()
export class onDelete {
    @On('messageUpdate')
    async onMessageDelete([ message ]: ArgsOf<'messageUpdate'>, client: Client): Promise<void> {
        if (message.author?.bot) return;
        const newMessage = await message.channel.messages.fetch(message.id);
        if (newMessage.content === message.content) return;

        const embed = new MessageEmbed();
        embed.title = 'Message Updated';
        embed.description = `Old: ${'```'}${message.cleanContent ? message.cleanContent : "N/A"}${'```'}\nNew: ${'```'}${newMessage.cleanContent ? newMessage.cleanContent : "N/A"}${'```'}`;
        embed.color = 0xFF0000;
        const author = message.author?.tag ? message.author.tag : 'Unknown';
        embed.footer = {
            text: 'Originally send by ' + author + ' at ' + new Date(message.createdTimestamp).toLocaleString('de-DE'),
            iconURL: message.author?.avatarURL() ?? undefined,
        };
        await newMessage.reply({embeds: [ embed ], allowedMentions: {repliedUser: false}});
    }
}