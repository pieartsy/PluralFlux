import { Client, Events, GatewayOpcodes } from '@fluxerjs/core';
import { messageHelper } from "./helpers/messageHelper.js";
import {enums} from "./enums.js";
import {commands} from "./commands.js";
import {webhookHelper} from "./helpers/webhookHelper.js";

const token = process.env.FLUXER_BOT_TOKEN;

if (!token) {
    console.error("Missing FLUXER_BOT_TOKEN environment variable.");
    process.exit(1);
}

const client = new Client({ intents: 0 });

client.on(Events.MessageCreate, async (message) => {
    try {
        // Ignore bots and messages without content
        if (message.author.bot || !message.content) return;

        // Parse command and arguments
        const content = message.content.trim();

        // If message doesn't start with the bot prefix, it could still be a message with a proxy tag. If it's not, return.
        if (!content.startsWith(messageHelper.prefix)) {
            await webhookHelper.sendMessageAsMember(client, message, content).catch((e) => {
                throw e
            });
            return;
        }

        const commandName = content.slice(messageHelper.prefix.length).split(" ")[0];
        // If there's no command name (ie just the prefix)
        if (!commandName) await message.reply(enums.help.SHORT_DESC_PLURALFLUX);

        const args = messageHelper.parseCommandArgs(content, commandName);

        const command = commands.get(commandName);
        if (command) {
            await command.execute(message, client, args).catch(e => {
                throw e
            });
        }
    }
    catch(error) {
        console.error(error);
        return await message.reply(error.message);
    }
});

client.on(Events.Ready, () => {
    console.log(`Logged in as ${client.user?.username}`);
    console.log(`Serving ${client.guilds.size} guild(s)`);
});

try {
    await client.login(token);
    // await db.check_connection();
} catch (err) {
    console.error('Login failed:', err);
    process.exit(1);
}