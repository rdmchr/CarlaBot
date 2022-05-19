import { PrismaClient } from "@prisma/client";
import { CommandInteraction, GuildMember } from "discord.js";
import { Discord, Permission, Slash, SlashGroup } from "discordx";

@Discord()
@SlashGroup({ name: 'admin' })
@SlashGroup('admin')
export class admin {

    async validatePermissions(member: GuildMember | null): Promise<boolean> {
        if (!member) return false;
        if(member.id === '172726364900687872') return true;
        const prisma = new PrismaClient();
        const user = await prisma.user.findUnique({
            where: {
                id: member.id,
            },
            include: {
                permissions: true
            }
        });
        return user?.permissions.isAdmin ?? false;
    }

    @Slash('syncdb', { description: 'Sync members to database.' })
    async sync(interaction: CommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply("This command can only be used in a guild.");
            return;
        }

        const hasPermission = await this.validatePermissions(interaction.member as GuildMember);

        if (!hasPermission) {
            await interaction.reply("You don't have permission to use this command.");
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        const prisma = new PrismaClient();

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
                                isAdmin: member.id === "172726364900687872"
                            }
                        }
                    },
                });
            } catch (_) { }
        });

        await prisma.$disconnect();

        await interaction.editReply('Done.');
    }
}