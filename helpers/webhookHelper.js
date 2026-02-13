const wh = {};

wh.get_or_create_webhook = async function (api, channel_id) {
    const name = 'PluralFlux Proxy Webhook';
    let webhook = await get_webhook(api, channel_id, name);
    if (webhook === undefined) {
        webhook = await api.channels.createWebhook(channel_id, {name: name});
    }
    return webhook;
}

async function get_webhook(api, channel_id, name) {
    const all_webhooks = await api.channels.getWebhooks(channel_id);
    if (all_webhooks.length === 0) {
        return;
    }
    let pf_webhook;
    all_webhooks.forEach((webhook) => {
        if (webhook.name === name) {
            pf_webhook = webhook;
        }
    })
    return pf_webhook;
}

wh.replace_message = async function (api, channel_id, text, member) {
    if (text.length > 0) {
        const webhook = await wh.get_or_create_webhook(api, channel_id);
        await api.webhooks.execute(webhook.id, webhook.token, {content: text, username: member.displayname ?? member.name, propic: member.propic});
        await api.channels.deleteMessage(channel_id, data.id);
    }
    else {
        await api.channels.createMessage(channel_id, {content: '(Please input a message!)'});
    }
}

export const webhookHelper = wh;