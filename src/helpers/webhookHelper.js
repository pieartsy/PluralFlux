import {messageHelper} from "./messageHelper.js";
import {memberHelper} from "./memberHelper.js";
import {Webhook, Channel, Message, EmbedBuilder} from '@fluxerjs/core';
import {enums} from "../enums.js";

const wh = {};

const name = 'PluralFlux Proxy Webhook';

/**
 * Replaces a proxied message with a webhook using the member information.
 * @param {Client} client - The fluxer.js client.
 * @param {Message} message - The full message object.
 * @throws {Error} When the proxy message is not in a server.
 */
wh.sendMessageAsMember = async function(client, message) {
    const attachmentUrl = message.attachments.size > 0 ? message.attachments.first().url : null;
    const proxyMatch = await messageHelper.parseProxyTags(message.author.id, message.content, attachmentUrl).catch(e =>{throw e});
    // If the message doesn't match a proxy, just return.
    if (!proxyMatch || !proxyMatch.proxy) {
        return;
    }
    // If the message does match a proxy but is in a guild server
    if (!message.guildId) {
        throw new Error(enums.err.NOT_IN_SERVER);
    }
    const member = await memberHelper.getMemberByProxy(message.author.id, proxyMatch.proxy);
    if (member) {
        await replaceMessage(client, message, proxyMatch.message, member).catch(e =>{throw e});
    }
}

/**
 * Replaces a proxied message with a webhook using the member information.
 * @param {Client} client - The fluxer.js client.
 * @param {Message} message - The message to be deleted.
 * @param {string} text - The text to send via the webhook.
 * @param {model} member - A member object from the database.
 * @throws {Error} When there's no message to send.
 */
async function replaceMessage(client, message, text, member) {
    if (text.length > 0 || message.attachments.size > 0) {
        const channel = client.channels.get(message.channelId);
        const webhook = await getOrCreateWebhook(client, channel).catch((e) =>{throw e});
        const username = member.displayname ?? member.name;
        await webhook.send({content: text, username: username, avatar_url: member.propic});
        await message.delete();
    }
    else {
        throw new Error(enums.err.NO_MESSAGE_SENT_WITH_PROXY);
    }
}

/**
 * Creates attachment embeds for the webhook since right now sending images is not supported.
 *
 * @param {Object[]} attachments - The attachments.
 * @returns {Object[]} A series of embeds.
 */
function createAttachmentEmbedsForWebhook(attachments) {
    let embeds = [];
    attachments.forEach(attachment => {
        const embed = new EmbedBuilder()
            .setTitle(attachment.filename)
            .setImage(attachment.url).toJSON()
        embeds.push(embed);
    });
    return embeds;
}


/**
 * Gets or creates a webhook.
 *
 * @param {Client} client - The fluxer.js client.
 * @param {Channel} channel - The channel the message was sent in.
 * @returns {Webhook} A webhook object.
 * @throws {Error} When no webhooks are allowed in the channel.
 */
async function getOrCreateWebhook(client, channel) {
    // If channel doesn't allow webhooks
    if (!channel?.createWebhook) throw new Error(enums.err.NO_WEBHOOKS_ALLOWED);
    let webhook = await getWebhook(client, channel).catch((e) =>{throw e});
    if (!webhook) {
        webhook = await channel.createWebhook({name: name});
    }
    return webhook;
}

/**
 * Gets an existing webhook.
 *
 * @param {Client} client - The fluxer.js client.
 * @param {Channel} channel - The channel the message was sent in.
 * @returns {Webhook} A webhook object.
 */
async function getWebhook(client, channel) {
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