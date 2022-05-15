import {Discord, Slash, SlashOption} from "discordx";
import {CommandInteraction, User} from "discord.js";

@Discord()
export class verify {

    @Slash("verify", {description: "Verify a new user."})
    async verify(@SlashOption("user", {type: "USER"}) user: User, interaction: CommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply("This command can only be used in a guild.");
            return;
        }
        const member = await interaction.guild.members.resolve(user);
        if (!member) {
            await interaction.reply("That user is not in this guild.");
            return;
        }
        if (interaction.guild.roles.cache.has('575046309967298580')) {
            await member.roles.add('575046309967298580');
            await interaction.reply("Verified user.");
        } else {
            await interaction.reply("There is no role to verify users with.");
        }
    }
}