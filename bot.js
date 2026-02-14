import { Client, GatewayDispatchEvents } from "@discordjs/core";
import { REST } from "@discordjs/rest";
import { WebSocketManager } from "@discordjs/ws";
import { db } from './sequelize.js';
import { webhookHelper } from "./helpers/webhookHelper.js";
import { messageHelper } from "./helpers/messageHelper.js";
import { memberHelper } from "./helpers/memberHelper.js";
import {enums} from "./enums.js";

const token = process.env.FLUXER_BOT_TOKEN;

if (!token) {
    console.error("Missing FLUXER_BOT_TOKEN environment variable.");
    process.exit(1);
}

const rest = new REST({
    api: "https://api.fluxer.app",
    version: "1",
}).setToken(token);

const gateway = new WebSocketManager({
    token,
    intents: 0, // Fluxer has no intents yet
    rest,
    version: "1",
});

export const client = new Client({ rest, gateway });

let pluralFluxName = "PluralFlux";
let pluralFluxDiscriminator = "8677";

client.on(GatewayDispatchEvents.MessageCreate, async ({ api, data }) => {
    try {
        if (data.webhook_id) {
            return;
        } else if (data.author.username === pluralFluxName && data.author.discriminator === pluralFluxDiscriminator) {
            return;
        } else if (data.content.startsWith(messageHelper.prefix)) {

            const commandName = data.content.slice(messageHelper.prefix.length).split(" ")[0];
            const args = messageHelper.parseCommandArgs(data.content, commandName);
            if (!commandName) {
                return await api.channels.createMessage(data.channel_id, {content: enums.help.PLURALFLUX});
            }
            switch (commandName) {
                case 'm':
                case 'member':
                    const attachment = data.attachments[0] ?? null;
                    const reply = await memberHelper.parseMemberCommand(data.author.id, args, attachment);
                    return await api.channels.createMessage(data.channel_id, {content: reply});
                case 'help':
                    return await api.channels.createMessage(data.channel_id, {content: enums.help.PLURALFLUX});
                default:
                    return await api.channels.createMessage(data.channel_id, {content: enums.err.NO_SUCH_COMMAND});
            }
            const proxyMatch = await messageHelper.parseProxyTags(data.author.id, data.content);
            if (!proxyMatch.proxy) {
                return;
            }
            const member = await memberHelper.getMemberByProxy(data.author.id, proxyMatch.proxy);
            await webhookHelper.replaceMessage(api, data, proxyMatch.message, member);
        }
    }
    catch(error) {
        return await api.channels.createMessage(data.channel_id, {content: error});
    }
});

client.on(GatewayDispatchEvents.Ready, async ({data}) => {
    console.log(`Logged in as ${data.user.username}#${data.user.discriminator}`);
    pluralFluxName = data.user.username;
    pluralFluxDiscriminator = data.user.discriminator;
    await db.check_connection();
});

await gateway.connect();