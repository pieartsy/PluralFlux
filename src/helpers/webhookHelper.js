const {messageHelper} = require("./messageHelper.js");
const {Webhook, Channel, Message, Client} = require('@fluxerjs/core');
const {enums} = require("../enums.js");

const webhookHelper = {};

const name = 'PluralFlux Proxy Webhook';

/**
 * Replaces a proxied message with a webhook using the member information.
 * @async
 * @param {Client} client - The fluxer.js client.
 * @param {Message} message - The full message object.
 * @throws {Error} When the proxy message is not in a server.
 */
webhookHelper.sendMessageAsMember = async function(client, message) {
    const attachmentUrl = message.attachments.size > 0 ? message.attachments.first().url : null;
    const proxyMatch = await messageHelper.parseProxyTags(message.author.id, message.content, attachmentUrl);
    // If the message doesn't match a proxy, just return.
    if (!proxyMatch || !proxyMatch.member || (proxyMatch.message.length === 0 && !proxyMatch.hasAttachment) ) {
        return;
    }
    // If the message does match a proxy but is not in a guild server (ex: in the Bot's DMs)
    if (!message.guildId) {
        throw new Error(enums.err.NOT_IN_SERVER);
    }
    if (proxyMatch.hasAttachment) {
        return await message.reply(`${enums.misc.ATTACHMENT_SENT_BY} ${proxyMatch.member.displayname ?? proxyMatch.member.name}`)
    }
    await webhookHelper.replaceMessage(client, message, proxyMatch.message, proxyMatch.member);
}

/**
 * Replaces a proxied message with a webhook using the member information.
 * @async
 * @param {Client} client - The fluxer.js client.
 * @param {Message} message - The message to be deleted.
 * @param {string} text - The text to send via the webhook.
 * @param {model} member - A member object from the database.
 * @throws {Error} When there's no message to send.
 */
webhookHelper.replaceMessage = async function(client, message, text, member) {
    // attachment logic is not relevant yet, text length will always be over 0 right now
    if (text.length > 0 || message.attachments.size > 0) {
        const channel = client.channels.get(message.channelId);
        const webhook = await webhookHelper.getOrCreateWebhook(client, channel);
        const username = member.displayname ?? member.name;
        if (text.length <= 2000) {
            await webhook.send({content: text, username: username, avatar_url: member.propic})
        }
        else if (text.length > 2000) {
            const returnedBuffer = messageHelper.returnBufferFromText(text);
            await webhook.send({content: returnedBuffer.text, username: username, avatar_url: member.propic, files: [{ name: 'text.txt', data: returnedBuffer.file }]
            })
        }
        if (message.attachments.size > 0) {
            // Not implemented yet
        }
        await message.delete();
    }
}

/**
 * Gets or creates a webhook.
 * @async
 * @param {Client} client - The fluxer.js client.
 * @param {Channel} channel - The channel the message was sent in.
 * @returns {Webhook} A webhook object.
 * @throws {Error} When no webhooks are allowed in the channel.
 */
webhookHelper.getOrCreateWebhook = async function(client, channel) {
    // If channel doesn't allow webhooks
    if (!channel?.createWebhook) throw new Error(enums.err.NO_WEBHOOKS_ALLOWED);
    let webhook = await webhookHelper.getWebhook(client, channel)
    if (!webhook) {
        webhook = await channel.createWebhook({name: name});
    }
    return webhook;
}

/**
 * Gets an existing webhook.
 * @async
 * @param {Client} client - The fluxer.js client.
 * @param {Channel} channel - The channel the message was sent in.
 * @returns {Webhook} A webhook object.
 */
webhookHelper.getWebhook = async function(client, channel) {
    const channelWebhooks = await channel?.fetchWebhooks() ?? [];
    if (channelWebhooks.length === 0) {
        return;
    }
    return channelWebhooks.find((webhook) => webhook.name === name);
}

module.exports.webhookHelper = webhookHelper;