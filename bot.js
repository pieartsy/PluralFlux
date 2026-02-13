import { Client, GatewayDispatchEvents } from "@discordjs/core";
import { REST } from "@discordjs/rest";
import { WebSocketManager } from "@discordjs/ws";

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

const prefix = "pf;"
let plural_flux_name = "";
let plural_flux_discriminator = "";

client.on(GatewayDispatchEvents.MessageCreate, async ({ api, data }) => {
    if (!data.content.startsWith(prefix)) {
        return;
    }
    else if (data.author.username === plural_flux_name && data.author.discriminator === plural_flux_discriminator) {
        return;
    }
    // else if (data.webhooks) {
    //     return;
    // }
    const command_name = data.content.slice(prefix.length).split(" ")[0];
    if (command_name === "ping") {
        await ping(api, data)
    }
    if (command_name === "echo") {
        await echo(api, data, command_name);
    }
});

client.on(GatewayDispatchEvents.Ready, ({ data }) => {
    console.log(`Logged in as ${data.user.username}#${data.user.discriminator}`);
    plural_flux_name = data.user.username;
    plural_flux_discriminator = data.user.discriminator;
});

gateway.connect();

async function ping(api, data) {
    await api.channels.createMessage(data.channel_id, {content: "pong"});
}

async function echo(api, data, command_name) {
    const message = data.content.slice(prefix.length + command_name.length).trim();
    if (message.length > 0) {
        await api.channels.createMessage(data.channel_id, {content: message});
    }
    else {
        await api.channels.createMessage(data.channel_id, {content: '(Please input a message!)'});
    }
}