import 'reflect-metadata';

import { Client } from 'discordx';
import { Intents, Interaction } from 'discord.js';
import { dirname, importx } from '@discordx/importer';
import { VERSION } from './constants.js';
import * as Tracing from '@sentry/tracing';
import * as Sentry from '@sentry/node';
import { start } from './webhook.js';
import { MyPlayer } from './audio/audio.js';
import { getENVValue } from '@carla/variable_provider';


export class Main {
    private static _client: Client;
    private static player: MyPlayer;

    static get Client(): Client {
        return this._client;
    }

    static get Player(): MyPlayer {
        return this.player;
    }

    static async start() {
        this.player = new MyPlayer();
        this._client = new Client({
            botGuilds: [ (client) => client.guilds.cache.map((guild) => guild.id) ],
            intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
                Intents.FLAGS.GUILD_MESSAGE_TYPING,
                Intents.FLAGS.GUILD_MEMBERS,
                Intents.FLAGS.GUILD_VOICE_STATES,
            ],
            silent: false,
            presence: {
                activities: [
                    {
                        name: `you. Version ${VERSION}`,
                        type: 'WATCHING',
                    },
                ],
                status: 'online',
            },
        });

        this._client.once('ready', async () => {
            // clear all commands
            /*await this._client.clearApplicationCommands(
                ...this._client.guilds.cache.map((g) => g.id)
            );*/

            await this._client.guilds.fetch();

            await this._client.initApplicationCommands({
                global: {log: true},
                guild: {log: true},
            });
            await this._client.initApplicationPermissions(true);

            console.log('Ready!');
        });

        this._client.on('interactionCreate', (interaction: Interaction) => {
            this._client.executeInteraction(interaction);
        });

        this._client.on('messageCreate', (message) => {
            this._client.executeCommand(message);
        });

        await importx(dirname(import.meta.url) + '/{events,commands}/**/*.{js,ts}');

        if (!getENVValue("DISCORD_TOKEN")) {
            throw Error('Could not find DISCORD_TOKEN in your environment');
        }
        await this._client.login(getENVValue("DISCORD_TOKEN") as string);
    }
}

// initialize Sentry
Sentry.init({
    dsn: 'https://9ab08f77140a43f88c450313ff315cfb@o1247746.ingest.sentry.io/6407743',

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 0.2,
});

Main.start();
start();