import {ButtonComponent, Discord, Slash, SlashGroup, SlashOption} from "discordx";
import { CommandInteraction, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import {prisma} from '../utils/prisma.js';
import {createNewDatabaseServer, deleteDatabaseServer, execSQL} from "../utils/databaseManager.js";

@Discord()
@SlashGroup({ name: 'db' })
@SlashGroup('db')
export class database {
    @Slash('create', { description: 'Create a new database' })
    async create(@SlashOption('db-name', {type: "STRING", required: false}) channelName: string,interaction: CommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply("This command can only be used in a guild.");
            return;
        }
        await interaction.deferReply();

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

        if(user.servers.length >= user.permissions.maxDatabases) {
            await interaction.editReply('You have reached the maximum number of databases you can create.');
            return;
        }

        channelName = channelName ?? `${interaction.member?.user.username}-${user.servers.length}`;

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

        const serverData = await createNewDatabaseServer(`user-db-${channel.id}`, channel);

        if (!serverData) {
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
                hetznerId: serverData.serverId,
                database: 'postgres',
                port: 5432,
                username: 'postgres',
                ip: serverData.ip,
                password: serverData.password,
            }
        })
    }

    @Slash('exec', { description: 'Execute a command in the database' })
    async exec(@SlashOption('command', {type: "STRING"}) command: string, interaction: CommandInteraction) {
        await interaction.deferReply();
        const dbServer = await prisma.server.findUnique({
            where: {
                channel: interaction.channelId,
            },
            select: {
                id: true
            }
        });
        if (!dbServer) {
            await interaction.editReply('This channel does not have a database associated with it.');
            return;
        }
        const reponse = await execSQL(dbServer.id, command);
        if (!reponse) {
            await interaction.editReply('An error occurred while executing the command.');
            return;
        }
        await interaction.editReply(reponse);
    }

    @Slash('delete', { description: 'Delete a database' })
    async delete(interaction: CommandInteraction) {
        const confirmDeleteButton = new MessageButton()
        .setLabel("Delete Server")
        .setEmoji("💀")
        .setStyle("DANGER")
        .setCustomId("confirm-delete");

        const cancelDeleteButton = new MessageButton()
        .setLabel("Cancel Delete")
        .setEmoji("🥺")
        .setStyle("PRIMARY")
        .setCustomId("cancel-delete");

        const actionRow = new MessageActionRow().addComponents(confirmDeleteButton, cancelDeleteButton);

        const embed = new MessageEmbed();
        embed.setTitle("Do you really want to delete this database?");
        embed.setDescription("This channel and all of the database data will be lost. This action can not be undone.");
        embed.setColor("#ff0000");

        interaction.reply({embeds: [embed], components: [actionRow]});
    }

    @ButtonComponent('confirm-delete')
    async confirmDelete(interaction: CommandInteraction) {
        await interaction.deferReply({ephemeral: true});
        const dbServer = await prisma.server.findUnique({
            where: {
                channel: interaction.channelId,
            },
            select: {
                hetznerId: true
            }
        });
        if (!dbServer) {
            await interaction.editReply('This channel does not have a database associated with it.');
            return;
        }
        const success = await deleteDatabaseServer(dbServer.hetznerId);
        if (success) {
            await prisma.server.delete({
                where: {
                    channel: interaction.channelId,
                }
            });
            await interaction.editReply('Successfully deleted database. I will now delete this channel.');
            setTimeout(() => interaction.channel?.delete(), 15e3);
        }
    }

    @ButtonComponent('cancel-delete')
    async cancelDelete(interaction: CommandInteraction) {
        await interaction.deferReply({ephemeral: true});
        await interaction.editReply('Cancelled database deletion.');
    }
}