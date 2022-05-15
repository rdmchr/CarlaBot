import {Discord, Slash, SlashOption} from "discordx";
import {CommandInteraction} from "discord.js";
import {exec} from 'child_process';

@Discord()
export class ping {

    @Slash("ping", {description: "Ping a domain name."})
    async ping(@SlashOption("domain", {description: "Domain name to ping."}) domain: string, @SlashOption("pings", {type: "INTEGER", required: false}) pings: number , interaction: CommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply("This command can only be used in a guild.");
            return;
        }
        if (pings == undefined || pings < 1) {
            pings = 1;
        }
        if (pings > 10){
            await interaction.reply("You can't ping more than 10 times.");

            setTimeout(() => interaction.deleteReply(), 15e3);
            return;
        }
        await interaction.deferReply();
        exec(`ping -c ${pings} ${domain}`, (err, stdout, stderr) => {
            if (err) {
                interaction.editReply(`Error: ${err}`);
                return;
            }
            interaction.editReply('```' + stdout + '```');
        });
    }
}
