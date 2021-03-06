import { CommandInteraction, GuildMember, Role } from 'discord.js';
import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';
import prisma from '@carla/database';
import { deleteObjects } from '../utils/s3Handler.js';

@Discord()
@SlashGroup({name: 'admin'})
@SlashGroup('admin')
export class admin {

    async validatePermissions(member: GuildMember | null): Promise<boolean> {
        if (!member) return false;
        if (member.id === '172726364900687872') return true;
        const user = await prisma.user.findUnique({
            where: {
                id: member.id,
            },
            include: {
                permissions: true,
            },
        });
        prisma.$disconnect();
        return user?.permissions.isAdmin ?? false;
    }

    @Slash('syncdb', {description: 'Sync members to database.'})
    async sync(interaction: CommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply('This command can only be used in a guild.');
            return;
        }

        const hasPermission = await this.validatePermissions(interaction.member as GuildMember);

        if (!hasPermission) {
            await interaction.reply('You don\'t have permission to use this command.');
            return;
        }

        const dbGuild = await prisma.guild.findUnique({
            where: {
                id: interaction.guild.id,
            },
            select: {
                offlineRole: true,
            },
        });

        await interaction.deferReply({ephemeral: true});
        const members = await interaction.guild.members.fetch({limit: 150, withPresences: true, force: true});
        for (const i of members) {
            const member = i[1];
            if (!member) {
                continue;
            }
            let roles = member.roles.valueOf().map(role => role.id);
            try {
                const user = await prisma.user.findUnique({
                    where: {
                        id: member.id,
                    },
                    select: {
                        id: true,
                    },
                });
                if (!user) {
                    if (dbGuild && dbGuild.offlineRole && member.roles.cache.has(dbGuild.offlineRole)) {
                        // if the user has the offline role don't save their roles
                        await prisma.user.create({
                            data: {
                                id: member.id,
                                lastSeen: member.presence?.status !== 'offline' ? new Date() : null,
                                verified: member.roles.cache.size > 2, // ignore @everyone role
                                tag: member.user.tag,
                                permissions: {
                                    create: {
                                        isAdmin: member.id === '172726364900687872',
                                    },
                                },
                            },
                        });
                    } else {
                        // if the user doesn't have the offline role save their roles
                        await prisma.user.create({
                            data: {
                                id: member.id,
                                lastSeen: member.presence?.status !== 'offline' ? new Date() : null,
                                verified: member.roles.cache.size > 1, // ignore @everyone role
                                tag: member.user.tag,
                                permissions: {
                                    create: {
                                        isAdmin: member.id === '172726364900687872',
                                    },
                                },
                                roles: {
                                    set: roles,
                                },
                            },
                        });
                    }
                } else {
                    if (dbGuild && dbGuild.offlineRole && member.roles.cache.has(dbGuild.offlineRole)) {
                        // if the user has the offline role don't save their roles
                        await prisma.user.update({
                            where: {
                                id: member.id,
                            },
                            data: {
                                lastSeen: member.presence?.status !== 'offline' ? new Date() : null,
                                tag: member.user.tag,
                                permissions: {
                                    create: {
                                        isAdmin: member.id === '172726364900687872',
                                    },
                                },
                            },
                        });
                    } else {
                        // if the user doesn't have the offline role save their roles
                        await prisma.user.update({
                            where: {
                                id: member.id,
                            },
                            data: {
                                lastSeen: member.presence?.status !== 'offline' ? new Date() : null,
                                verified: member.roles.cache.size > 1, // ignore @everyone role
                                tag: member.user.tag,
                                permissions: {
                                    create: {
                                        isAdmin: member.id === '172726364900687872',
                                    },
                                },
                                roles: {
                                    set: roles,
                                },
                            },
                        });
                    }
                }
            } catch (_) {
                await prisma.$disconnect();
            }
        }
        await prisma.$disconnect();

        await interaction.editReply('Done.');
    }

    @Slash('clearcache', {description: 'Clears the Twitter cache'})
    async clearCache(interaction: CommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply('This command can only be used in a guild.');
            return;
        }

        const hasPermission = await this.validatePermissions(interaction.member as GuildMember);

        if (!hasPermission) {
            await interaction.reply('You don\'t have permission to use this command.');
            return;
        }

        await interaction.deferReply({ephemeral: true});

        const tweetMedia = await prisma.tweetMedia.findMany({
            select: {
                awsKey: true,
                tweetId: true,
            },
        });

        const keys = tweetMedia.map(tweetMedia => tweetMedia.awsKey);

        const result = await deleteObjects(keys);

        await prisma.tweetMedia.deleteMany({
            where: {
                awsKey: {
                    in: keys,
                },
            },
        });

        let deletedEverything = true;

        try {
            await prisma.tweet.deleteMany();
            await prisma.tweetAuthor.deleteMany();
        } catch (_) {
            deletedEverything = false;
            // ignore error resulting from too many tweets
        }

        if (result) {
            await interaction.editReply('Done. Deleted ' + keys.length + ' objects. ' + (deletedEverything ? 'Deleted all tweets.' : 'Some tweets are still remaining..'));
        } else {
            await interaction.editReply('An error occurred. Check the console for more information. ' + (deletedEverything ? 'Deleted all tweets.' : 'Some tweets are still remaining..'));
        }
    }

    @Slash('setonlinemessage', {description: 'Sets the online message.'})
    async setOnlineMessage(interaction: CommandInteraction) {
        await interaction.deferReply({ephemeral: true});

        if (!interaction.guild) {
            await interaction.editReply('This command can only be used in a guild.');
            return;
        }

        const hasPermission = await this.validatePermissions(interaction.member as GuildMember);

        if (!hasPermission) {
            await interaction.editReply('You don\'t have permission to use this command.');
            return;
        }

        const channel = interaction.channel;
        if (!channel) {
            await interaction.editReply('This command can only be used in a channel.');
            return;
        }
        const message = channel.lastMessage;
        if (!message) {
            await interaction.editReply('This command can only be used in a channel with a message.');
            return;
        }

        await message.reactions.removeAll();
        await message.react('???');

        const dbGuild = await prisma.guild.findUnique({
            where: {
                id: interaction.guild.id,
            },
        });

        if (!dbGuild) {
            await prisma.guild.create({
                data: {
                    id: interaction.guild.id,
                    onlineMessage: message.id,
                },
            });
        } else {
            await prisma.guild.update({
                where: {
                    id: interaction.guild.id,
                },
                data: {
                    onlineMessage: message.id,
                },
            });
        }

        await interaction.editReply('Done.');
    }

    @Slash('setofflinerole', {description: 'Sets the role that is given to users who are offline.'})
    async setOfflineRole(@SlashOption('role', {type: 'ROLE'}) role: Role, interaction: CommandInteraction) {
        await interaction.deferReply({ephemeral: true});

        if (!interaction.guild) {
            await interaction.editReply('This command can only be used in a guild.');
            return;
        }

        const hasPermission = await this.validatePermissions(interaction.member as GuildMember);

        if (!hasPermission) {
            await interaction.editReply('You don\'t have permission to use this command.');
            return;
        }

        const dbGuild = await prisma.guild.findUnique({
            where: {
                id: interaction.guild.id,
            },
        });

        if (!dbGuild) {
            await prisma.guild.create({
                data: {
                    id: interaction.guild.id,
                    offlineRole: role.id,
                },
            });
        } else {
            await prisma.guild.update({
                where: {
                    id: interaction.guild.id,
                },
                data: {
                    offlineRole: role.id,
                },
            });
        }

        await interaction.editReply('Done.');
    }

    @Slash('toggleofflinemonitor', {description: 'Toggles the offline monitor.'})
    async toggleOfflineMonitor(interaction: CommandInteraction) {
        await interaction.deferReply({ephemeral: true});

        if (!interaction.guild) {
            await interaction.editReply('This command can only be used in a guild.');
            return;
        }

        const hasPermission = await this.validatePermissions(interaction.member as GuildMember);

        if (!hasPermission) {
            await interaction.editReply('You don\'t have permission to use this command.');
            return;
        }

        const dbGuild = await prisma.guild.findUnique({
            where: {
                id: interaction.guild.id,
            },
        });

        if (!dbGuild) {
            await interaction.editReply('This guild is not configured.');
            return;
        }

        if (!dbGuild.offlineRole) {
            await interaction.editReply('This guild does not have an offline role.');
            return;
        }

        if (dbGuild.offlineMonitorEnabled) {
            // disable offline monitor
            await prisma.guild.update({
                where: {
                    id: interaction.guild.id,
                },
                data: {
                    offlineMonitorEnabled: false,
                },
            });
            // restore all roles
            const members = await interaction.guild.members.fetch({limit: 150, force: true});
            for (const i of members) {
                const member = i[1];
                if (member.roles.cache.has(dbGuild.offlineRole)) {
                    await member.roles.remove(dbGuild.offlineRole);
                }
                const dbMember = await prisma.user.findUnique({
                    where: {
                        id: member.id,
                    },
                });
                if (!dbMember) continue;
                if (dbMember.roles) {
                    await member.roles.add(dbMember.roles);
                }
            }
            await interaction.editReply('Done. Offline monitor is now disabled.');
        } else {
            // enable offline monitor
            await prisma.guild.update({
                where: {
                    id: interaction.guild.id,
                },
                data: {
                    offlineMonitorEnabled: true,
                },
            });
            await interaction.editReply('Done. Offline monitor is now enabled.');
        }
        prisma.$disconnect();
    }
}