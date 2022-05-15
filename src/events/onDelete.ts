import {ArgsOf, Discord, On} from "discordx";
import {Client, MessageEmbed, TextChannel} from "discord.js";

@Discord()
export class onDelete {
    @On('messageDelete')
    onMessageDelete([message]: ArgsOf<"messageDelete">, client: Client): void {
        if (message.author?.bot) return;
        const channel = message.channel;
        const embed = new MessageEmbed()
        embed.title = "Message Deleted";
        embed.description = message.content;
        embed.color = 0xFF0000;
        const author = message.author?.tag ? message.author.tag : "Unknown";
        embed.footer = {
            text: 'Originally send by ' + author + ' at ' + new Date(message.createdTimestamp).toLocaleString("de-DE"),
            iconURL: message.author?.avatarURL() ?? undefined
        }
        channel.send({embeds: [embed]});
    }
}