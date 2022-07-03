import { Main } from '../index.js';
import prisma from '@carla/database';

function checkMemberStatus() {
    Main.Client.guilds.cache.forEach(async (guild) => {

        const dbGuild = await prisma.guild.findUnique({
            where: {
                id: guild.id,
            },
            select: {
                offlineRole: true
            }
        });

        if (!dbGuild || !dbGuild.offlineRole) return;

        const members = await guild.members.fetch(); // update member cache

        for (const i of members) {
            const member = i[1];
            if (!member || member.user.bot) {
                prisma.$disconnect();
                continue;
            }
            if (!member.presence || member.presence.status === 'offline') {
                if (member.roles.cache.has(dbGuild.offlineRole)) {
                    // user already has offline role
                    prisma.$disconnect();
                    continue;
                }
                if (member.roles.cache.size === 0) {
                    // user has no roles
                    prisma.$disconnect();
                    continue;
                }
                // user has roles, but is offline: save roles to db and replace all roles with offline role
                const roles = member.roles.cache.map((r) => r.id);
                prisma.$connect();
                try {
                    await prisma.user.update({
                        where: {
                            id: member.id,
                        },
                        data: {
                            roles: {
                                set: roles,
                            },
                        },
                    });
                } catch (_) {
                    // if an error occurs, continue to next member; user was probably not found in db
                    prisma.$disconnect();
                    continue;
                }
                prisma.$disconnect();
                await member.roles.set([ dbGuild.offlineRole ]);
                // kick user from voice channel
                if (member.voice.channel) {
                    await member.voice.disconnect();
                }
            } else {
                if (!member.roles.cache.has(dbGuild.offlineRole)) {
                    // user does not have offline role
                    prisma.$disconnect();
                    continue;
                }
                if (member.roles.cache.size === 0) {
                    // user has no roles
                    prisma.$disconnect();
                    continue;
                }
                // user has offline role and roles: remove offline role and restore all roles
                await member.roles.remove([ dbGuild.offlineRole ]);
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
                if (!dbData || !dbData.roles) continue;
                await member.roles.set(dbData.roles);
            }
        }
    });
}

export function initialiseOnlineMonitor() {
    checkMemberStatus();
    setInterval(checkMemberStatus, 5000);
}