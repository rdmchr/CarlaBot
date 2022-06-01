import { Discord, Slash, SlashOption } from 'discordx';
import { CommandInteraction, MessageEmbed } from 'discord.js';
import fetch from 'node-fetch-native';
import { base64Encode } from '../utils/utils.js';
import { getEnvValue } from '@carla/variable-provider';

@Discord()
export class whoIs {


    @Slash('whois', {description: 'Run a who is lookup on a given domain.'})
    async whois(@SlashOption('domain', {description: 'Domain name to lookup.'}) domain: string, interaction: CommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply('This command can only be used in a guild.');
            return;
        }
        const jwaID = getEnvValue("JWA_ID");
        const jwaSecret = getEnvValue("JWA_SECRET");

        if (!jwaID || !jwaSecret) {
            await interaction.reply('You need to set the JWA_ID and JWA_SECRET environment variables.');
            return;
        }

        await interaction.deferReply();

        const res = await fetch(` https://jsonwhoisapi.com/api/v1/whois?identifier=${domain}`, {
            headers: {
                'Authorization': `Basic ${base64Encode(`${jwaID}:${jwaSecret}`)}`,
            },
        });
        const result = await res.json();
        const embed = new MessageEmbed();
        embed.setTitle('Whois Lookup Result');
        embed.setDescription(`Domain: ${result.name}`);
        embed.addField('Registrar', result.registrar.name ?? 'N/A');
        embed.addField('Status', result.status ?? 'N/A');
        embed.addField('Expires', result.expires ?? 'N/A');
        embed.addField('Changed', result.changed ?? 'N/A');
        embed.color = 11342935;
        await interaction.editReply({embeds: [ embed ]});
    }
}