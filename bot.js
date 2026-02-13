import { Client, GatewayDispatchEvents } from "@discordjs/core";
import { REST } from "@discordjs/rest";
import { WebSocketManager } from "@discordjs/ws";
import { db } from './sequelize.js';
import { webhookHelper } from "./helpers/webhookHelper.js";
import { proxyHelper } from "./helpers/proxyHelper.js";
import { messageHelper } from "./helpers/messageHelper.js";
import { memberHelper } from "./helpers/memberHelper.js";

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

let plural_flux_name = "";
let plural_flux_discriminator = "";

client.on(GatewayDispatchEvents.MessageCreate, async ({ api, data }) => {
    if (!data.content.startsWith(messageHelper.prefix)) {
        return;
    }
    else if (data.author.username === plural_flux_name && data.author.discriminator === plural_flux_discriminator) {
        return;
    }
    else if (data.webhook_id) {
        return;
    }
    const command_name = data.content.slice(messageHelper.prefix.length).split(" ")[0];
    const args = messageHelper.parse_message_args(data.content, command_name);

    if (command_name === "echo") {
        await echo(api, data, command_name);
    }
    else if (command_name === "webhook") {
        await webhookHelper.get_or_create_webhook(api, data);
    }
    else if (command_name === "member") {
        const reply = await memberHelper.parse_member_command(data.author.id, args);
        await api.channels.createMessage(data.channel_id, {content: reply});

    }
});

client.on(GatewayDispatchEvents.Ready, async ({data}) => {
    console.log(`Logged in as ${data.user.username}#${data.user.discriminator}`);
    plural_flux_name = data.user.username;
    plural_flux_discriminator = data.user.discriminator;
    await db.check_connection();
});

gateway.connect();

async function echo(api, data, command_name) {
    await proxyHelper.replaceMessage(api, data, command_name);
}