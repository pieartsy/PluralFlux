const wh = {};

wh.get_or_create_webhook = async function (api, data) {
    const name = 'PluralFlux Proxy Webhook';
    let webhook = await get_webhook(api, data, name);
    if (webhook === undefined) {
        webhook = await api.channels.createWebhook(data.channel_id, {name: name});
    }
    return webhook;
}

async function get_webhook(api, data, name) {
    const all_webhooks = await api.channels.getWebhooks(data.channel_id);
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

export const webhookHelper = wh;