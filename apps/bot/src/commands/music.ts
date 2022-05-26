import { CommandInteraction, Guild, GuildMember, MessageEmbed, TextChannel, User } from 'discord.js';
import { ArgsOf, ButtonComponent, Discord, On, Slash, SlashGroup, SlashOption } from 'discordx';
import { MyPlayer, MyQueue } from '../audio/audio.js';
import prisma from '@carla/database';
import { AudioResource } from '@discordjs/voice';
import { CommonTrack } from '@discordx/music';

@Discord()
@SlashGroup({name: 'music'})
@SlashGroup('music')
export class music {
    static player: MyPlayer;

    constructor() {
        music.player = new MyPlayer();
    }

    async getMusicChannel(guild: Guild): Promise<TextChannel | null> {
        const dbGuild = await prisma.guild.findUnique({where: {id: guild.id}});
        if (!dbGuild) {
            return null;
        }
        const channel = guild.channels.cache.get(dbGuild.musicChannel);
        return channel instanceof TextChannel ? channel : null;
    }

    async playFromWeb(guild: Guild, member: GuildMember, songName: string) {
        const channel = await this.getMusicChannel(guild);
        if (!member || !channel || !guild) {
            return {error: 'Could not process your request, please try again.'};
        }

        if (!member.voice.channel) {
            return {error: 'You need to join a voice channel first.'};
        }

        const queue = music.player.getQueue(guild, channel);

        if (!queue.isReady) {
            queue.channel = channel;
            await queue.join(member.voice.channel);
        }

        if (!queue) {
            return {error: 'Could not process your request, please try again.'};
        }

        const song = await queue.play(songName, {user: member});
        if (!song) {
            return {error: 'Could not find a song with that name.'};
        } else {
            const embed = new MessageEmbed();
            embed.setTitle('Enqueued');
            embed.setDescription(`Enqueued song **${song.title}**.`);
            await channel.send({embeds: [ embed ]});

            return {success: `Enqueued song **${song.title}**.`};
        }
    }

    async getCurrentlyPlaying(guild: Guild): Promise<{ error: string | null, track: AudioResource<CommonTrack> | null }> {
        const channel = await this.getMusicChannel(guild);
        if (!channel) {
            return {error: 'Could not find a music channel.', track: null};
        }
        const queue = music.player.getQueue(guild, channel);
        if (!queue.isReady) {
            return {error: 'Could not find a queue.', track: null};
        }
        if (!queue.currentTrack) {
            return {error: 'Nothing is playing.', track: null};
        }
        return {track: queue.currentTrack, error: null};
    }

    @On('voiceStateUpdate')
    voiceUpdate([ oldState, newState ]: ArgsOf<'voiceStateUpdate'>): void {
        const queue = music.player.getQueue(oldState.guild);

        if (!queue.isReady || !queue.voiceChannelId || (oldState.channelId != queue.voiceChannelId && newState.channelId != queue.voiceChannelId) || !queue.channel) {
            return;
        }

        const channel = oldState.channelId === queue.voiceChannelId ? oldState.channel : newState.channel;
        if (!channel) {
            return;
        }

        const totalMembers = channel.members.filter((m) => !m.user.bot);
        if (queue.isPlaying && !totalMembers.size) {
            queue.pause();
            queue.channel.send('No one is in the voice channel, pausing.');

            if (queue.timeoutTimer) {
                clearTimeout(queue.timeoutTimer);
            }

            queue.timeoutTimer = setTimeout(() => {
                queue.channel?.send(
                    `No one is in the voice channel for 5 minutes, stopping playback and deleting queue.`,
                );
                queue.leave();
            }, 5 * 60 * 1000);
        } else if (queue.isPause && totalMembers.size) {
            if (queue.timeoutTimer) {
                clearTimeout(queue.timeoutTimer);
                queue.timeoutTimer = undefined;
            }
            queue.resume();
            queue.channel.send('Resuming playback.');
        }
    }

    validateControlInteraction(interaction: CommandInteraction): MyQueue | undefined {
        if (!interaction.guild || !interaction.channel || !(interaction.member instanceof GuildMember)) {
            interaction.reply('To use these controls, you need to join a voice channel.');
            return;
        }

        const queue = music.player.getQueue(interaction.guild, interaction.channel);
        if (interaction.member.voice.channelId !== queue.voiceChannelId) {
            interaction.reply('You need to join my voice channel first.');

            setTimeout(() => interaction.deleteReply(), 15e3);
            return;
        }

        return queue;
    }

    @ButtonComponent('btn-next')
    async nextControl(interaction: CommandInteraction): Promise<void> {
        const queue = this.validateControlInteraction(interaction);
        if (!queue) {
            return;
        }
        queue.skip();
        await interaction.deferReply();
        interaction.deleteReply();
    }

    @ButtonComponent('btn-pause')
    async pauseControl(interaction: CommandInteraction): Promise<void> {
        const queue = this.validateControlInteraction(interaction);
        if (!queue) {
            return;
        }
        queue.pause() ? queue.resume() : queue.pause();
        await interaction.deferReply();
        interaction.deleteReply();
    }

    @ButtonComponent('btn-leave')
    async leaveControl(interaction: CommandInteraction): Promise<void> {
        const queue = this.validateControlInteraction(interaction);
        if (!queue) {
            return;
        }
        queue.leave();
        await interaction.deferReply();
        interaction.deleteReply();
    }

    @ButtonComponent('btn-repeat')
    async repeatControl(interaction: CommandInteraction): Promise<void> {
        const queue = this.validateControlInteraction(interaction);
        if (!queue) {
            return;
        }
        queue.setRepeat(!queue.repeat);
        await interaction.deferReply();
        interaction.deleteReply();
    }

    @ButtonComponent('btn-queue')
    async queueControl(interaction: CommandInteraction): Promise<void> {
        const queue = this.validateControlInteraction(interaction);
        if (!queue) {
            return;
        }
        queue.view(interaction);
    }

    @ButtonComponent('btn-mix')
    async mixControl(interaction: CommandInteraction): Promise<void> {
        const queue = this.validateControlInteraction(interaction);
        if (!queue) {
            return;
        }
        queue.mix();
        await interaction.deferReply();
        interaction.deleteReply();
    }

    @ButtonComponent('btn-controls')
    async controlsControl(interaction: CommandInteraction): Promise<void> {
        const queue = this.validateControlInteraction(interaction);
        if (!queue) {
            return;
        }
        queue.updateControlMessage({force: true});
        await interaction.deferReply();
        interaction.deleteReply();
    }

    async processJoin(interaction: CommandInteraction): Promise<MyQueue | undefined> {
        if (!interaction.guild || !interaction.channel || !(interaction.member instanceof GuildMember)) {
            interaction.reply('Could not process your request, please try again.');
            setTimeout(() => interaction.deleteReply(), 15e3);
            return;
        }

        if (!(interaction.member instanceof GuildMember) || !interaction.member.voice.channel) {
            interaction.reply('You need to join a voice channel first.');
            setTimeout(() => interaction.deleteReply(), 15e3);
            return;
        }

        await interaction.deferReply();
        const queue = music.player.getQueue(interaction.guild, interaction.channel);

        if (!queue.isReady) {
            queue.channel = interaction.channel;
            await queue.join(interaction.member.voice.channel);
        }

        return queue;
    }

    @Slash('play', {description: 'Play a song.'})
    async play(@SlashOption('song', {description: 'The song to play.'}) songName: string, interaction: CommandInteraction): Promise<void> {
        const queue = await this.processJoin(interaction);
        if (!queue) {
            return;
        }
        const song = await queue.play(songName, {user: interaction.user});
        if (!song) {
            await interaction.followUp('Could not find a song with that name.');
        } else {
            const embed = new MessageEmbed();
            embed.setTitle('Enqueued');
            embed.setDescription(`Enqueued song **${song.title}**.`);
            await interaction.followUp({embeds: [ embed ]});
        }
    }

    @Slash('playlist', {description: 'Play a playlist.'})
    async playlist(@SlashOption('playlist', {description: 'Playlist name.'}) playlistName: string, interaction: CommandInteraction): Promise<void> {
        const queue = await this.processJoin(interaction);
        if (!queue) {
            return;
        }
        const songs = await queue.playlist(playlistName, {user: interaction.user});
        if (!songs) {
            await interaction.followUp('Could not find a playlist with that name.');
        } else {
            const embed = new MessageEmbed();
            embed.setTitle('Enqueued');
            embed.setDescription(`Enqueued **${songs.length}** songs from playlist.`);
            await interaction.followUp({embeds: [ embed ]});
        }
    }

    validateInteraction(interaction: CommandInteraction): undefined | { guild: Guild, member: GuildMember, queue: MyQueue } {
        if (!interaction.guild || !(interaction.member instanceof GuildMember) || !interaction.channel) {
            interaction.reply('Could not process your request, please try again.');

            setTimeout(() => interaction.deleteReply(), 15e3);
            return;
        }

        if (!interaction.member.voice.channel) {
            interaction.reply('You need to join a voice channel first.');

            setTimeout(() => interaction.deleteReply(), 15e3);
            return;
        }

        const queue = music.player.getQueue(interaction.guild, interaction.channel);
        if (!queue.isReady || interaction.member.voice.channel.id !== queue.voiceChannelId) {
            interaction.reply('You need to join my voice channel first.');

            setTimeout(() => interaction.deleteReply(), 15e3);
            return;
        }

        return {guild: interaction.guild, member: interaction.member, queue};
    }

    @Slash('skip', {description: 'Skip the current song.'})
    async skip(interaction: CommandInteraction): Promise<void> {
        const validate = this.validateInteraction(interaction);
        if (!validate) {
            return;
        }
        const {queue} = validate;

        queue.skip();
        await interaction.reply('Skipped.');
    }

    @Slash('mix', {description: 'Mix the current queue.'})
    mix(interaction: CommandInteraction): void {
        const validate = this.validateInteraction(interaction);
        if (!validate) {
            return;
        }

        const {queue} = validate;

        queue.mix();
        interaction.reply('Mixed queue.');
    }

    @Slash('pause', {description: 'Pause or unpause the music.'})
    async pause(interaction: CommandInteraction): Promise<void> {
        const validate = this.validateInteraction(interaction);
        if (!validate) {
            return;
        }

        const {queue} = validate;

        if (queue.isPause) {
            await interaction.reply('Resumed.');
            queue.resume();
            return;
        }

        queue.pause();
        await interaction.reply('Paused.');
    }

    @Slash('seek', {description: 'Seek to a specific time.'})
    async seek(@SlashOption('time', {
        description: 'The time to seek to in seconds.',
        type: 'INTEGER',
    }) time: number, interaction: CommandInteraction): Promise<void> {
        const validate = this.validateInteraction(interaction);
        if (!validate) {
            return;
        }

        const {queue} = validate;

        if (!queue.isPlaying || !queue.currentTrack) {
            await interaction.reply('Nothing is playing.');
            return;
        }

        const state = queue.seek(time * 1000);
        if (!state) {
            await interaction.reply('Could not seek.');
            return;
        }
        await interaction.reply('Seeked.');
    }

    @Slash('volume', {description: 'Set the volume.'})
    async volume(@SlashOption('volume', {
        description: 'The volume to set.',
        type: 'INTEGER',
    }) volume: number, interaction: CommandInteraction): Promise<void> {
        const validate = this.validateInteraction(interaction);
        if (!validate) {
            return;
        }

        const {queue} = validate;

        if (!queue.isPlaying || !queue.currentTrack) {
            await interaction.reply('Nothing is playing.');
            return;
        }

        const state = queue.setVolume(volume);
        if (!state) {
            await interaction.reply('Could not set volume.');
            return;
        }

        await interaction.reply('Set volume.');
    }

    @Slash('nowplaying', {description: 'Get the current song.'})
    async nowplaying(interaction: CommandInteraction): Promise<void> {
        const validate = this.validateInteraction(interaction);
        if (!validate) {
            return;
        }

        const {queue} = validate;

        if (!queue.isPlaying || !queue.currentTrack) {
            await interaction.reply('Nothing is playing.');
            return;
        }

        const embed = new MessageEmbed();
        embed.setTitle('Now playing');
        embed.setDescription(`Now playing **${queue.currentTrack.metadata.title}**.`);
        await interaction.reply({embeds: [ embed ]});
    }

    @Slash('stop', {description: 'Stop the music.'})
    async stop(interaction: CommandInteraction): Promise<void> {
        const validate = this.validateInteraction(interaction);
        if (!validate) {
            return;
        }

        const {queue} = validate;

        queue.leave();
        await interaction.reply('Stopped.');
    }
}