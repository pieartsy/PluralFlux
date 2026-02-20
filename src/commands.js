import {messageHelper} from "./helpers/messageHelper.js";
import {enums} from "./enums.js";
import {memberHelper} from "./helpers/memberHelper.js";
import {EmbedBuilder} from "@fluxerjs/core";
import {importHelper} from "./helpers/importHelper.js";

const cmds = new Map();

cmds.set('member', {
    description: enums.help.SHORT_DESC_MEMBER,
    async execute(message, client, args) {
        const authorFull = `${message.author.username}#${message.author.discriminator}`
        const attachmentUrl = message.attachments.size > 0 ? message.attachments.first().url : null;
        const attachmentExpires = message.attachments.size > 0 ? message.attachments.first().expires_at : null;
        const reply = await memberHelper.parseMemberCommand(message.author.id, authorFull, args, attachmentUrl, attachmentExpires).catch(async (e) =>{await message.reply(e.message);});
        if (typeof reply === 'string') {
            return await message.reply(reply);
        }
        else if (reply instanceof EmbedBuilder) {
            await message.reply({embeds: [reply.toJSON()]})
        }
        else if (typeof reply === 'object') {
            const errorsText = reply.errors.length > 0 ? reply.errors.join('\n- ') : null;
            return await message.reply({content: `${reply.success} ${errorsText ? "\nThese errors occurred:\n" + errorsText : ""}`, embeds: [reply.embed.toJSON()]})
        }

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

cmds.set('import', {
    description: enums.help.SHORT_DESC_IMPORT,
    async execute(message, client, args) {
        const attachmentUrl = message.attachments.size > 0 ? message.attachments.first().url : null;
        if ((message.content.includes('--help') || (args[0] === '' && args.length === 1)) && !attachmentUrl ) {
            return await message.reply(enums.help.IMPORT);
        }
        return await importHelper.pluralKitImport(message.author.id, attachmentUrl).then(async (successfullyAdded) => {
            await message.reply(successfullyAdded);
        }).catch(async (error) => {
            if (error instanceof AggregateError) {
                // errors.message can be a list of successfully added members, or say that none were successful.
                let errorsText = `${error.message}.\nThese errors occurred:\n${error.errors.join('\n')}`;

                await message.reply(errorsText).catch(async () => {
                    const returnedBuffer = messageHelper.returnBufferFromText(errorsText);
                    await message.reply({content: returnedBuffer.text, files: [{ name: 'text.pdf', data: returnedBuffer.file }]
                    })
                });
            }
            // If just one error was returned.
            else {
                return await message.reply(error.message);
            }
        })
    }
})

export const commands = cmds;