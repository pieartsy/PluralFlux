const {messageHelper} = require("./helpers/messageHelper.js");
const {enums} = require("./enums.js");
const {memberHelper} = require("./helpers/memberHelper.js");
const {EmbedBuilder} = require("@fluxerjs/core");
const {importHelper} = require("./helpers/importHelper.js");

const commands = {
    commandsMap: new Map(),
    aliasesMap: new Map()
};

commands.aliasesMap.set('m', {command: 'member'})

commands.commandsMap.set('member', {
    description: enums.help.SHORT_DESC_MEMBER,
    async execute(message, args) {
        await commands.memberCommand(message, args)
    }
})

/**
 * Calls the member-related functions.
 *
 * @async
 * @param {Message} message - The message object
 * @param {string[]} args - The parsed arguments
 *
 **/
commands.memberCommand = async function (message, args) {
    const authorFull = `${message.author.username}#${message.author.discriminator}`
    const attachmentUrl = message.attachments.size > 0 ? message.attachments.first().url : null;
    const attachmentExpires = message.attachments.size > 0 ? message.attachments.first().expires_at : null;
    let reply;
    try {
        reply = await memberHelper.parseMemberCommand(message.author.id, authorFull, args, attachmentUrl, attachmentExpires)
    } catch (e) {
        return await message.reply(e.message);
    }

    if (typeof reply === 'string') {
        await message.reply(reply);
    } else if (reply instanceof EmbedBuilder) {
        await message.reply({embeds: [reply]})
    } else if (typeof reply === 'object') {
        // The little dash is so that the errors print out in bullet points in Fluxer
        const errorsText = reply.errors.length > 0 ? '- ' + reply.errors.join('\n- ') : null;
        return await message.reply({
            content: `${reply.success} ${errorsText ? `\n\n${enums.err.ERRORS_OCCURRED}\n` + errorsText : ""}`,
            embeds: [reply.embed]
        })
    }

}


commands.commandsMap.set('help', {
    description: enums.help.SHORT_DESC_HELP,
    async execute(message) {
        const fields = [...commands.commandsMap.entries()].map(([name, cmd]) => ({
            name: `${messageHelper.prefix}${name}`,
            value: cmd.description,
            inline: true,
        }));

        const embed = new EmbedBuilder()
            .setTitle('Commands')
            .setDescription(enums.help.PLURALFLUX)
            .addFields(...fields)
            .setFooter({text: `Prefix: ${messageHelper.prefix}`})
            .setTimestamp();

        await message.reply({embeds: [embed]});
    },
})

commands.commandsMap.set('import', {
    description: enums.help.SHORT_DESC_IMPORT,
    async execute(message, args) {
        await commands.importCommand(message, args);
    }
})

/**
 * Calls the import-related functions.
 *
 * @async
 * @param {Message} message - The message object
 * @param {string[]} args - The parsed arguments
 *
 **/
commands.importCommand = async function (message, args) {
    const attachmentUrl = message.attachments.size > 0 ? message.attachments.first().url : null;
    if ((message.content.includes('--help') || (args[0] === '' && args.length === 1)) && !attachmentUrl) {
        return await message.reply(enums.help.IMPORT);
    }
    let errorsText;
    try {
        const successfullyAdded = await importHelper.pluralKitImport(message.author.id, attachmentUrl)
        return await message.reply(successfullyAdded);
    } catch (error) {
        if (error instanceof AggregateError) {
            // errors.message can be a list of successfully added members, or say that none were successful.
            errorsText = `${error.message}.\n\n${enums.err.ERRORS_OCCURRED}\n\n${error.errors.join('\n')}`;
        }
        // If just one error was returned.
        else {
            console.error(error);
            errorsText = error.message;
        }
    }
    if (errorsText.length > 2000) {
        const returnedBuffer = messageHelper.returnBufferFromText(errorsText);
        await message.reply({
            content: returnedBuffer.text, files: [{name: 'text.txt', data: returnedBuffer.file}]
        })
    } else {
        await message.reply(errorsText)
    }

}

module.exports.commands = commands;