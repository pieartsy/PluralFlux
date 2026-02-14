const wh = {};

/**
 * Gets or creates a webhook.
 *
 * @param api - The discord.js API.
 * @param {string} channelId - The channel the message was sent in.
 * @returns {Object} A webhook object.
 */
wh.getOrCreateWebhook = async function (api, channelId) {
    const name = 'PluralFlux Proxy Webhook';
    let webhook = await getWebhook(api, channelId, name);
    if (!webhook) {
        webhook = await api.channels.createWebhook(channelId, {name: name});
    }
    return webhook;
}

/**
 * Gets an existing webhook.
 *
 * @param api - The discord.js API.
 * @param {string} channelId - The channel the message was sent in.
 * @param {string} name - The name of the webhook.
 * @returns {Object} A webhook object.
 */
async function getWebhook(api, channelId, name) {
    const allWebhooks = await api.channels.getWebhooks(channelId);
    if (allWebhooks.length === 0) {
        return;
    }
    let pf_webhook;
    allWebhooks.forEach((webhook) => {
        if (webhook.name === name) {
            pf_webhook = webhook;
        }
    })
    return pf_webhook;
}

/**
 * Replaces a proxied message with a webhook using the member information.
 *
 * @param api - The discord.js API.
 * @param data - The discord.js data.
 * @param {string} text - The text to send via the webhook.
 * @param {Object} member - A member object from the database.
 */
wh.replaceMessage = async function (api, data, text, member) {
    if (text.length > 0) {
        const webhook = await wh.getOrCreateWebhook(api, data.channel_id);
        await api.webhooks.execute(webhook.id, webhook.token, {content: text, username: member.displayname ?? member.name, avatar_url: member.propic});
        await api.channels.deleteMessage(data.channel_id, data.id);
    }
    else {
        await api.channels.createMessage(data.channel_id, {content: '(Please input a message!)'});
    }
}

export const webhookHelper = wh;