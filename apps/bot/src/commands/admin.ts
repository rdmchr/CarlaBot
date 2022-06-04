import { CommandInteraction, GuildMember } from 'discord.js';
import { Discord, Slash, SlashGroup } from 'discordx';
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

        await interaction.deferReply({ephemeral: true});

        const members = await interaction.guild.members.fetch();

        members.forEach(async (member) => {
            try {
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
                    },
                });
                await prisma.$disconnect();
            } catch (_) {
            }
        });

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

}