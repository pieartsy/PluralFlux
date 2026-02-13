
const ph = {}


ph.replaceMessage = async function (api, data, command_name) {
    const message = data.content.slice(prefix.length + command_name.length).trim();
    if (message.length > 0) {
        const webhook = await getOrCreateWebhook(api, data);
        await api.webhooks.execute(webhook.id, webhook.token, {content: message, username: data.author.global_name});
        await api.channels.deleteMessage(data.channel_id, data.id);
    }
    else {
        await api.channels.createMessage(data.channel_id, {content: '(Please input a message!)'});
    }
}

export const proxyHelper = ph;