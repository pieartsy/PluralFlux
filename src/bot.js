import { Client, Events, Message } from '@fluxerjs/core';
import { messageHelper } from "./helpers/messageHelper.js";
import {enums} from "./enums.js";
import {commands} from "./commands.js";
import {webhookHelper} from "./helpers/webhookHelper.js";
import env from 'dotenv';
import {utils} from "./helpers/utils.js";

env.config({path: './.env'});

export const token = process.env.FLUXER_BOT_TOKEN;

if (!token) {
    console.error("Missing FLUXER_BOT_TOKEN environment variable.");
    process.exit(1);
}

export const client = new Client({ intents: 0 });

client.on(Events.MessageCreate, async (message) => {
    await handleMessageCreate(message);
});

/**
 * Calls functions based off the contents of a message object.
 *
 * @async
 * @param {Message} message - The message object
 *
 **/
export const handleMessageCreate = async function(message) {
    try {
        // Parse command and arguments
        const content = message.content.trim();
        // Ignore bots and messages without content
        if (message.author.bot || content.length === 0) return;

        // If message doesn't start with the bot prefix, it could still be a message with a proxy tag. If it's not, return.
        if (!content.startsWith(messageHelper.prefix)) {
            return await webhookHelper.sendMessageAsMember(client, message);
        }

        const commandName = content.slice(messageHelper.prefix.length).split(" ")[0];

        // If there's no command name (ie just the prefix)
        if (!commandName) return await message.reply(enums.help.SHORT_DESC_PLURALFLUX);

        const args = messageHelper.parseCommandArgs(content, commandName);

        let command = commands.commandsMap.get(commandName)
        if (!command) {
            const commandFromAlias = commands.aliasesMap.get(commandName);
            command = commandFromAlias ? commands.commandsMap.get(commandFromAlias.command) : null;
        }

        if (command) {
            await command.execute(message, args);
        }
        else {
            await message.reply(enums.err.COMMAND_NOT_RECOGNIZED);
        }
    }
    catch(error) {
        console.error(error);
    }
}

client.on(Events.Ready, () => {
    console.log(`Logged in as ${client.user?.username}`);
});

let guildCount = 0;
client.on(Events.GuildCreate, () => {
    guildCount++;
    debouncePrintGuilds();
});

function printGuilds() {
    console.log(`Serving ${client.guilds.size} guild(s)`);
}

const debouncePrintGuilds  = utils.debounce(printGuilds, 2000);
export const debounceLogin  = utils.debounce(client.login, 60000);

(async () => {
    try {
        await client.login(token);
        // await db.check_connection();
    } catch (err) {
        console.error('Login failed:', err);
        process.exit(1);
    }
})();