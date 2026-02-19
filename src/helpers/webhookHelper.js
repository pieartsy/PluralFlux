import {messageHelper} from "./messageHelper.js";
import {Webhook, Channel, Message, Client} from '@fluxerjs/core';
import {enums} from "../enums.js";

const wh = {};

const name = 'PluralFlux Proxy Webhook';

/**
 * Replaces a proxied message with a webhook using the member information.
 * @async
 * @param {Client} client - The fluxer.js client.
 * @param {Message} message - The full message object.
 * @throws {Error} When the proxy message is not in a server.
 */
wh.sendMessageAsMember = async function(client, message) {
    const attachmentUrl = message.attachments.size > 0 ? message.attachments.first().url : null;
    const proxyMatch = await messageHelper.parseProxyTags(message.author.id, message.content, attachmentUrl).catch(e =>{throw e});
    // If the message doesn't match a proxy, just return.
    if (!proxyMatch || !proxyMatch.member || (proxyMatch.message.length === 0 && !proxyMatch.hasAttachment) ) {
        return;
    }
    // If the message does match a proxy but is not in a guild server (ex: in the Bot's DMs)
    if (!message.guildId) {
        throw new Error(enums.err.NOT_IN_SERVER);
    }
    const attachments = await messageHelper.createFileObjectFromAttachments(message.attachments);
    await wh.replaceMessage(client, message, proxyMatch.message, proxyMatch.member, attachments).catch(e =>{throw e});
}

/**
 * Replaces a proxied message with a webhook using the member information.
 * @async
 * @param {Client} client - The fluxer.js client.
 * @param {Message} message - The message to be deleted.
 * @param {string} text - The text to send via the webhook.
 * @param {model} member - A member object from the database.
 * @param {[{string, ArrayBuffer}]} attachments - Attachments file objects, if any.
 * @throws {Error} When there's no message to send.
 */
wh.replaceMessage = async function (client, message, text, member, attachments) {
    if (text.length === 0 && attachments.length === 0) {
        return;
    }
    const channel = client.channels.get(message.channelId);
    const webhook = await wh.getOrCreateWebhook(client, channel).catch((e) => {
        throw e
    });
    const username = member.displayname ?? member.name;
    if (text.length > 0) {
        if (text.length > 2000) {
            const returnedBuffer = messageHelper.returnBufferFromText(text);
            await webhook.send({content: returnedBuffer.text, username: username, avatar_url: member.propic, files: [{ name: 'text.txt', data: returnedBuffer.file }]
            })
            attachments.push(returnedBuffer);
        }
        await webhook.send({content: text, username: username, avatar_url: member.propic, files: attachments}).catch(async (e) => {
            console.error(e);
        });
    }
    else {
        await webhook.send({username: username, avatar_url: member.propic, files: attachments}).catch(async (e) => {
            console.error(e);
        });
    }
    await message.delete();
}

/**
 * Gets or creates a webhook.
 * @async
 * @param {Client} client - The fluxer.js client.
 * @param {Channel} channel - The channel the message was sent in.
 * @returns {Webhook} A webhook object.
 * @throws {Error} When no webhooks are allowed in the channel.
 */
wh.getOrCreateWebhook = async function(client, channel) {
    // If channel doesn't allow webhooks
    if (!channel?.createWebhook) throw new Error(enums.err.NO_WEBHOOKS_ALLOWED);
    let webhook = await wh.getWebhook(client, channel).catch((e) =>{throw e});
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
wh.getWebhook = async function(client, channel) {
    const channelWebhooks = await channel?.fetchWebhooks() ?? [];
    if (channelWebhooks.length === 0) {
        return;
    }
    let pf_webhook;
    channelWebhooks.forEach((webhook) => {
        if (webhook.name === name) {
            pf_webhook = webhook;
        }
    })
    return pf_webhook;
}

export const webhookHelper = wh;