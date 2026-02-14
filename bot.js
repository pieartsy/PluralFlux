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

const BOT_STATUS = process.env.FLUXER_BOT_STATUS ?? 'online';
const client = new Client({ intents: 0 });

client.on(Events.MessageCreate, async (message) => {
    try {
        // Ignore bots and messages without content
        if (message.author.bot || !message.content) return;

        // Parse command and arguments
        const content = message.content.trim();

        // If message doesn't start with the bot prefix, it could still be a message with a proxy tag. If it's not, return.
        if (!content.startsWith(messageHelper.prefix)) {
            await webhookHelper.sendMessageAsMember(client, message, content);
            return;
        }

        const commandName = content.slice(messageHelper.prefix.length).split(" ")[0];
        // If there's no command name (ie just the prefix)
        if (!commandName) await message.reply(enums.help.SHORT_DESC_PLURALFLUX);

        const args = messageHelper.parseCommandArgs(content, commandName);

        const command = commands.get(commandName);
        if (command) {
            await command.execute(message, client, args).catch(async (e) => {
                throw new Error(`Error executing ${commandName}: ${e.message}`);
            });
        }
    }
    catch(error) {
        return await message.reply(error.message);
    }
});

client.on(Events.Ready, () => {
    console.log(`Logged in as ${client.user?.username}`);
    console.log(`Serving ${client.guilds.size} guild(s)`);
    const status = ['online', 'idle', 'dnd', 'invisible'].includes(BOT_STATUS) ? BOT_STATUS : 'online';
    client.sendToGateway(0, {
        op: GatewayOpcodes.PresenceUpdate,
        d: { status },
    });
});

try {
    await client.login(token);
    console.log('Gateway connected');
} catch (err) {
    console.error('Login failed:', err);
    process.exit(1);
}