import { ArgsOf, Discord, On } from 'discordx';
import prisma from '@carla/database';

@Discord()
export class onNewMember {
    @On('guildMemberAdd')
    async onNewMember([ member ]: ArgsOf<'guildMemberAdd'>): Promise<void> {
        const user = await prisma.user.findUnique({
            where: {
                id: member.id,
            },
        });

        if (user) {
            await prisma.user.update({
                where: {
                    id: member.id,
                },
                data: {
                    lastSeen: new Date(),
                    tag: member.user.tag,
                },
            });
            await prisma.$disconnect();
            if (user.verified) {
                await member.roles.add('575046309967298580');
            }
            return;
        }

        await prisma.user.create({
            data: {
                id: member.id,
                lastSeen: new Date(),
                verified: false,
                tag: member.user.tag,
                permissions: {
                    create: {},
                },
            },
        });

        await prisma.$disconnect();
    }
}