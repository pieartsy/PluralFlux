import {messageHelper} from "./helpers/messageHelper.js";
import {enums} from "./enums.js";
import {memberHelper} from "./helpers/memberHelper.js";
import {EmbedBuilder} from "@fluxerjs/core";

const cmds = new Map();

cmds.set('member', {
    description: enums.help.SHORT_DESC_MEMBER,
    async execute(message, client, args) {
        const reply = await memberHelper.parseMemberCommand(message.author.id, args, message.attachments[0] ?? null).catch(async (e) => {
            return await message.reply(e);
        });
        return await message.reply(reply);
    }
})

cmds.set('help', {
    description: enums.help.SHORT_DESC_HELP,
    async execute(message) {
        const fields = [...cmds.entries()].map(([name, cmd]) => ({
            name: `${messageHelper.prefix}${name}`,
            value: cmd.description,
            inline: true,
        }));

        const embed = new EmbedBuilder()
            .setTitle('Commands')
            .setDescription(enums.help.PLURALFLUX)
            .addFields(...fields)
            .setFooter({ text: `Prefix: ${messageHelper.prefix}` })
            .setTimestamp();

        await message.reply({ embeds: [embed.toJSON()] });
    },
})

export const commands = cmds;