import { Client, GatewayDispatchEvents } from "@discordjs/core";
import { REST } from "@discordjs/rest";
import { WebSocketManager } from "@discordjs/ws";
import { db } from './sequelize.js';
import { webhookHelper } from "./helpers/webhookHelper.js";
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
    if (data.webhook_id) {
        return;
    }
    else if (data.author.username === plural_flux_name && data.author.discriminator === plural_flux_discriminator) {
        return;
    }
    else if (!data.content.startsWith(messageHelper.prefix)) {
        const proxyMatch = await messageHelper.parse_proxy_tags(data.author.id, data.content);
        if (!proxyMatch.proxy) {
            return;
        }
        const member = await memberHelper.get_member_by_proxy(data.author.id, proxyMatch.proxy);
        await webhookHelper.replace_message(api, data, proxyMatch.message, member);
    }
    else {
        const command_name = data.content.slice(messageHelper.prefix.length).split(" ")[0];
        const args = messageHelper.parse_command_args(data.content, command_name);

        if (command_name === "member" || command_name === "m") {
            const reply = await memberHelper.parse_member_command(data.author.id, args);
            await api.channels.createMessage(data.channel_id, {content: reply});
        }
    }
});

client.on(GatewayDispatchEvents.Ready, async ({data}) => {
    console.log(`Logged in as ${data.user.username}#${data.user.discriminator}`);
    plural_flux_name = data.user.username;
    plural_flux_discriminator = data.user.discriminator;
    await db.check_connection();
});

gateway.connect();