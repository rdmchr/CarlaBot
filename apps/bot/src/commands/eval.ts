import { Discord, Slash, SlashOption } from 'discordx';
import {
    ApplicationCommandOptionChoiceData,
    AutocompleteInteraction,
    CommandInteraction,
    MessageEmbed,
} from 'discord.js';
import axios from 'axios';

@Discord()
export class evalCmd {
    languages = [ 'bash', 'csharp', 'elm', 'go', 'java', 'javascript', 'kotlin', 'php', 'python', 'ruby', 'rust', 'typescript' ];

    generateAutocomplete(text: string | number): ApplicationCommandOptionChoiceData[] {
        return this.languages.filter((lang) => lang.startsWith(text.toString().toLowerCase())).map((language) => {
            return {
                name: language,
                value: language,
            };
        });
    }

    @Slash('eval')
    async evalCmd(@SlashOption('language', {
                      autocomplete: function (this: evalCmd, interaction: AutocompleteInteraction) {
                          const focusedOption = interaction.options.getFocused(true);
                          interaction.respond(this.generateAutocomplete(focusedOption.value));
                      },
                      type: 'STRING',
                      description: 'The language you want to use.',
                  }) language: string,
                  @SlashOption('expression', {
                      autocomplete: false,
                      description: 'The expression you want to evaluate',
                      type: 'STRING',
                  }) expression: string,
                  interaction: CommandInteraction | AutocompleteInteraction) {
        if (interaction.isAutocomplete()) {
            const focusedOption = interaction.options.getFocused(true);
            await interaction.respond(this.generateAutocomplete(focusedOption.value));
            return;
        }
        await interaction.deferReply();
        const embed = await evalCmd.evalExpr(language, expression);
        await interaction.editReply({embeds: [embed]});
    }

    static async evalExpr(language: string, expression: string): Promise<MessageEmbed> {
        const res = await axios.post(`https://glot.io/api/run/${language}/latest`, {
                files: [ {
                    name: `tmp.${language}`,
                    content: expression,
                } ],
            }, {
                headers: {
                    'Authorization': `Token ${process.env.GLOT_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            },
        );

        const data = res.data;

        if (!data.stdout && !data.error && !data.stderr) {
            const embed = new MessageEmbed();
            embed.setTitle('Internal error.');
            embed.setDescription('Something went wrong while evaluating your expression. Please try again later.');
            return embed;
        }

        const embed = new MessageEmbed();
        embed.setTitle('Evaluation result');
        if (data.stdout) {
            embed.addField('stdout', '```' + data.stdout + '```');
        }
        if (data.stderr) {
            embed.addField('stderr', '```' + data.stderr + '```');
        }
        if (data.error) {
            embed.addField('error', '```' + data.error + '```');
        }
        return embed;
    }
}