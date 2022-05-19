import { Discord, Slash, SlashGroup } from "discordx";
import { CommandInteraction } from "discord.js";
import { PrismaClient } from "@prisma/client";
import {createNewDatabaseServer} from "../utils/databaseManager.js";

@Discord()
@SlashGroup({ name: 'db' })
@SlashGroup('db')
export class database {
    @Slash('create', { description: 'Create a new database' })
    async create(interaction: CommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply("This command can only be used in a guild.");
            return;
        }
        await interaction.deferReply();

        const prisma = new PrismaClient();

        const user = await prisma.user.findUnique({
            where: {
                id: interaction.user.id,
            },
            include: {
                servers: true,
                permissions: true
            }
        });

        if (!user) {
            await interaction.editReply('You are not registered in the database.');
            return;
        }

        if (!user.permissions.canCreateDB && !user.permissions.isAdmin) {
            await interaction.editReply('You do not have permission to create a database.');
            return;
        }

        const channelName = interaction.member?.user.username;

        if (!channelName) {
            await interaction.editReply('An error occurred, while creating your channel,');
            return;
        }

        const channel = await interaction.guild.channels.create(channelName, {
            type: 'GUILD_TEXT',
        });

        let category = interaction.guild.channels.cache.find(c => c.type === 'GUILD_CATEGORY' && c.name === 'Databases');

        if (!category) {
            category = await interaction.guild.channels.create('Databases', {
                type: 'GUILD_CATEGORY',
            });
        }
        await channel.setParent(category.id);

        await channel.permissionOverwrites.create(interaction.user.id, {
            VIEW_CHANNEL: true,
            SEND_MESSAGES: true,
            READ_MESSAGE_HISTORY: true,
            ADD_REACTIONS: true,
            USE_APPLICATION_COMMANDS: true
        })

        await interaction.editReply('Created database channel.');

        await channel.send(`<@${interaction.user.id}> I am currently creating your database. As soon as I'm ready I will notify you in this channel.`);

        const serverId = await createNewDatabaseServer(`user-db-${channel.id}`, channel);

        if (!serverId) {
            await channel.send('An error occurred while creating your database. (cc: <@172726364900687872>)');
            return;
        }

        await prisma.server.create({
            data: {
                type: 'postgres-database',
                owner: {
                    connect: {
                        id: interaction.user.id,
                    }
                },
                channel: channel.id,
                createdAt: new Date(),
                hetznerId: serverId
            }
        })
    }
}