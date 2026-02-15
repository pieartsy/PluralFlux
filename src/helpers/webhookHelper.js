import {messageHelper} from "./messageHelper.js";
import {memberHelper} from "./memberHelper.js";
import { Webhook, Channel, Message } from '@fluxerjs/core';
import {enums} from "../enums.js";

const wh = {};

const name = 'PluralFlux Proxy Webhook';

/**
 * Replaces a proxied message with a webhook using the member information.
 * @param {Client} client - The fluxer.js client.
 * @param {Message} message - The full message object.
 * @param {string} content - The full content of the message.
 * @throws {Error} When the proxy message is not in a server.
 */
wh.sendMessageAsMember = async function(client, message, content) {
    const proxyMatch = await messageHelper.parseProxyTags(message.author.id, message.attachments[0] ?? null, content).catch(e =>{throw e});
    // If the message doesn't match a proxy, just return.
    if (!proxyMatch.proxy) {
        return;
    }
    // If the message does match a proxy but is in a guild server
    if (!message.guildId) {
        throw new Error(enums.err.NOT_IN_SERVER);
    }
    const member = await memberHelper.getMemberByProxy(message.author.id, proxyMatch.proxy).catch(e =>{throw e});
    await replaceMessage(client, message, message.channelId, proxyMatch.message, member).catch(e =>{throw e});
}

/**
 * Replaces a proxied message with a webhook using the member information.
 * @param {Client} client - The fluxer.js client.
 * @param {Message} message - The message to be deleted.
 * @param {string} channelId - The channel id to send the webhook message in.
 * @param {string} text - The text to send via the webhook.
 * @param {model} member - A member object from the database.
 * @throws {Error} When there's no message to send.
 */
async function replaceMessage(client, message, channelId, text, member) {
    if (text.length > 0) {
        const channel = client.channels.get(channelId);
        const webhook = await getOrCreateWebhook(client, channel).catch((e) =>{throw e});
        const username = member.displayname ?? member.name;
        await webhook.send({content: text, username: username, avatar_url: member.propic});
        await message.delete();
    }
    else {
        throw new Error(enums.err.NO_MESSAGE_SENT_WITH_PROXY);
    }
}

// /**
//  * Fluxer collapses same-name messages, so if two would be sent by different users, break them up with a tiny space. (Inspired by Tupperbox)
//  * @param {string} channelId - The channel id to send the webhook message in.
//  * @param {string} username - The text to send via the webhook.
//  */
//
// function preventSameNameCollapse(channelId, username) {
//
//     if(bot.recent[msg.channel.id] && msg.author.id !== bot.recent[msg.channel.id][0].user_id && un === bot.recent[msg.channel.id][0].name) {
//         username = un.substring(0,1) + "\u200a" + un.substring(1);
//     }
// }

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