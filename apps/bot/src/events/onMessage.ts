import {ArgsOf, Discord, On} from "discordx";
import {execSQL} from "../utils/databaseManager.js";
import prisma from "@carla/database";

@Discord()
export class onMessage {
    @On('messageCreate')
    async onMessageCreate([message]: ArgsOf<"messageCreate">): Promise<void> {
        if (!message.guild) return;
        if (message.author.bot) return;
        const channel = await message.guild.channels.resolve(message.channel.id);
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