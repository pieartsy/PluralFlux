const wh = {};

wh.getOrCreateWebhook = async function (api, channelId) {
    const name = 'PluralFlux Proxy Webhook';
    let webhook = await getWebhook(api, channelId, name);
    if (webhook === undefined) {
        webhook = await api.channels.createWebhook(channelId, {name: name});
    }
    return webhook;
}

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

wh.replaceMessage = async function (api, data, text, member) {
    if (text.length > 0) {
        const webhook = await wh.getOrCreateWebhook(api, data.channel_id);
        await api.webhooks.execute(webhook.id, webhook.token, {content: text, username: member.displayname ?? member.name, propic: member.propic});
        await api.channels.deleteMessage(data.channel_id, data.id);
    }
    else {
        await api.channels.createMessage(data.channel_id, {content: '(Please input a message!)'});
    }
}

export const webhookHelper = wh;