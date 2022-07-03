import { ArgsOf, Discord, On } from 'discordx';
import prisma from '@carla/database';

@Discord()
export class onNewMember {
    @On('messageReactionAdd')
    async onNewMember([ reaction ]: ArgsOf<'messageReactionAdd'>): Promise<void> {

        const guild = reaction.message.guild;
        if (!guild) return;

        const guildData = await prisma.guild.findUnique({
            where: {
                id: guild.id,
            },
            select: {
                onlineMessage: true,
                offlineRole: true,
            },
        });
        prisma.$disconnect();
        // check if reaction is on online message
        if (!guildData || !guildData.onlineMessage || !guildData.offlineRole) return;

        const self = reaction.client.user!;


        // get user who reacted with the message
        const users = await reaction.users.fetch();
        const user = users.filter((u) => u.id !== self.id).first();
        if (!user) return;


        if (reaction.message.id !== guildData.onlineMessage) return;

        // reset message reactions
        await reaction.message.reactions.removeAll();
        await reaction.message.react('✅');


        const member = guild.members.resolve(user);
        if (!member) return;
        const presence = member.presence;
        const channel = reaction.message.channel;

        // check users status
        if (!presence || presence.status === 'offline') {
            // user is offline; remind them to come online

            const message = await member.send(`${user} You are still offline. Please come online to continue.`);
            setTimeout(() => {
                message.delete();
            }, 5000);
            return;
        }
        // user is online; restore their roles
        prisma.$connect();
        const dbData = await prisma.user.findUnique({
            where: {
                id: member.id,
            },
            select: {
                roles: true,
            },
        });
        prisma.$disconnect();

        // remove offline role
        await member.roles.remove([ guildData.offlineRole ]);

        if (!dbData || !dbData.roles) {
            // user has no roles
            const message = await member.send(`${user} Could not find any roles for you.`);
            setTimeout(() => {
                message.delete();
            }, 5000);
            return;
        }

        // user has roles; restore them
        await member.roles.set(dbData.roles);
    }
}