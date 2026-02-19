jest.mock('../../src/helpers/messageHelper.js')

const {messageHelper} = require("../../src/helpers/messageHelper.js");

jest.mock('../../src/helpers/messageHelper.js', () => {
    return {messageHelper: {
            parseProxyTags: jest.fn(),
            returnBuffer: jest.fn(),
            returnBufferFromText: jest.fn(),
        }}
})

const {webhookHelper} = require("../../src/helpers/webhookHelper.js");
const {enums} = require("../../src/enums");

describe('webhookHelper', () => {

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    })

    describe(`sendMessageAsMember`, () => {
        const client = {};
        const content = "hi"
        const attachments = {
            size: 0,
            first: () => {},
            foreach: jest.fn()
        }
        const message = {
            client,
            content: content,
            attachments: attachments,
            author: {
                id: '123'
            },
            guild: {
                guildId: '123'
            },
            reply: jest.fn()
        }
        const member = {proxy: "--text", name: 'somePerson', displayname: "Some Person"};
        const proxyMessage = {message: content, member: member}
        beforeEach(() => {
            jest.spyOn(webhookHelper, 'replaceMessage');

        })

        test('calls parseProxyTags and returns if proxyMatch is empty object', async() => {
            // Arrange
            messageHelper.parseProxyTags.mockResolvedValue({});
            // Act
            return webhookHelper.sendMessageAsMember(client, message).then((res) => {
                expect(res).toBeUndefined();
                expect(messageHelper.parseProxyTags).toHaveBeenCalledTimes(1);
                expect(messageHelper.parseProxyTags).toHaveBeenCalledWith(message.author.id, content, null);
                expect(webhookHelper.replaceMessage).not.toHaveBeenCalled();
            })
        })

        test('calls parseProxyTags and returns if proxyMatch is undefined', async() => {
            // Arrange
            messageHelper.parseProxyTags.mockResolvedValue(undefined);
            // Act
            return webhookHelper.sendMessageAsMember(client, message).then((res) => {
                // Assert
                expect(res).toBeUndefined();
                expect(messageHelper.parseProxyTags).toHaveBeenCalledTimes(1);
                expect(messageHelper.parseProxyTags).toHaveBeenCalledWith(message.author.id, content, null);
                expect(webhookHelper.replaceMessage).not.toHaveBeenCalled();
            })
        })

        test('calls parseProxyTags with attachmentUrl', async() => {
            // Arrange
            message.attachments = {
                size: 1,
                first: () => {
                    return {url: 'oya.png'}
                }
            }
            // message.attachments.set('attachment', {url: 'oya.png'})
            // message.attachments.set('first', () => {return {url: 'oya.png'}})
            messageHelper.parseProxyTags.mockResolvedValue(undefined);
            // Act
            return webhookHelper.sendMessageAsMember(client, message).then((res) => {
                // Assert
                expect(res).toBeUndefined();
                expect(messageHelper.parseProxyTags).toHaveBeenCalledTimes(1);
                expect(messageHelper.parseProxyTags).toHaveBeenCalledWith(message.author.id, content, 'oya.png');
            })
        })

        test('if message matches member proxy but is not sent from a guild, throw an error', async() => {
            // Arrange
            messageHelper.parseProxyTags.mockResolvedValue(proxyMessage);
            // Act
            return webhookHelper.sendMessageAsMember(client, message).catch((res) => {
                // Assert
                expect(res).toEqual(new Error(enums.err.NOT_IN_SERVER));
                expect(webhookHelper.replaceMessage).not.toHaveBeenCalled();
            })
        })

        test('if message matches member proxy and sent in a guild and has an attachment, reply to message with ping', async() => {
            // Arrange
            message.guildId = '123'
            proxyMessage.hasAttachment = true;
            messageHelper.parseProxyTags.mockResolvedValue(proxyMessage);
            const expected = `${enums.misc.ATTACHMENT_SENT_BY} ${proxyMessage.member.displayname}`
            // Act
            return webhookHelper.sendMessageAsMember(client, message).then((res) => {
                // Assert
                expect(message.reply).toHaveBeenCalledTimes(1);
                expect(message.reply).toHaveBeenCalledWith(expected);
                expect(webhookHelper.replaceMessage).not.toHaveBeenCalled();
            })
        })

        test('if message matches member proxy and sent in a guild channel and no attachment, calls replace message', async() => {
            // Arrange
            message.guildId = '123';
            proxyMessage.hasAttachment = false;
            messageHelper.parseProxyTags.mockResolvedValue(proxyMessage);
            jest.spyOn(webhookHelper,  'replaceMessage').mockResolvedValue();
            // Act
            return webhookHelper.sendMessageAsMember(client, message).then((res) => {
                // Assert
                expect(message.reply).not.toHaveBeenCalled();
                expect(webhookHelper.replaceMessage).toHaveBeenCalledTimes(1);
                expect(webhookHelper.replaceMessage).toHaveBeenCalledWith(client, message, proxyMessage.message, proxyMessage.member);
            })
        })

        test('if replace message throws error, throw same error', async() => {
            // Arrange
            message.guildId = '123';
            messageHelper.parseProxyTags.mockResolvedValue(proxyMessage);
            jest.spyOn(webhookHelper,  'replaceMessage').mockImplementation(() => {throw new Error("error")});
            // Act
            return webhookHelper.sendMessageAsMember(client, message).catch((res) => {
                // Assert
                expect(message.reply).not.toHaveBeenCalled();
                expect(webhookHelper.replaceMessage).toHaveBeenCalledTimes(1);
                expect(webhookHelper.replaceMessage).toHaveBeenCalledWith(client, message, proxyMessage.message, proxyMessage.member);
                expect(res).toEqual(new Error('error'));
            })
        })
    })

    describe(`replaceMessage`, () => {
        const channelId = '123';
        const authorId = '456';
        const guildId = '789';
        const text = "hello";
        const client = {
            channels: {
                get: jest.fn().mockReturnValue(channelId)
            }
        }
        const member = {proxy: "--text", name: 'somePerson', displayname: "Some Person", propic: 'oya.png'};
        const attachments= {
            size: 1,
            first: () => {return channelId;}
        };
        const message = {
            client,
            channelId: channelId,
            content: text,
            attachments: attachments,
            author: {
                id: authorId
            },
            guild: {
                guildId: guildId
            },
            reply: jest.fn(),
            delete: jest.fn()
        }

        const webhook = {
            send: async() => jest.fn().mockResolvedValue()
        }

        test('does not call anything if text is 0 or message has no attachments', async() => {
            // Arrange
            const emptyText = ''
            const noAttachments = {
                size: 0,
                first: () => {}
            }
            message.attachments = noAttachments;
            jest.spyOn(webhookHelper, 'getOrCreateWebhook').mockResolvedValue(webhook);
            // Act
            return webhookHelper.replaceMessage(client, message, emptyText, member).then(() => {
                expect(webhookHelper.getOrCreateWebhook).not.toHaveBeenCalled();
                expect(message.delete).not.toHaveBeenCalled();
            })
        })

        test('calls getOrCreateWebhook and message.delete with correct arguments if text >= 0', async() => {
            // Arrange
            message.attachments = {
                size: 0,
                first: () => {
                }
            };
            jest.spyOn(webhookHelper, 'getOrCreateWebhook').mockResolvedValue(webhook);
            // Act
            return webhookHelper.replaceMessage(client, message, text, member).then((res) => {
                // Assert
                expect(webhookHelper.getOrCreateWebhook).toHaveBeenCalledTimes(1);
                expect(webhookHelper.getOrCreateWebhook).toHaveBeenCalledWith(client, channelId);
                expect(message.delete).toHaveBeenCalledTimes(1);
                expect(message.delete).toHaveBeenCalledWith();
            })
        })

        // TODO: flaky for some reason
        test('calls getOrCreateWebhook and message.delete with correct arguments if attachments exist', async() => {
            // Arrange
            const emptyText = ''
            jest.spyOn(webhookHelper, 'getOrCreateWebhook').mockResolvedValue(webhook);
            // Act
            return webhookHelper.replaceMessage(client, message, emptyText, member).then((res) => {
                // Assert
                expect(webhookHelper.getOrCreateWebhook).toHaveBeenCalledTimes(1);
                expect(webhookHelper.getOrCreateWebhook).toHaveBeenCalledWith(client, channelId);
                expect(message.delete).toHaveBeenCalledTimes(1);
                expect(message.delete).toHaveBeenCalledWith();
            })
        })

        test('calls returnBufferFromText and console error if webhook.send returns error', async() => {
            // Arrange
            const file = Buffer.from(text, 'utf-8');
            const returnedBuffer = {text: text, file: file};
            const expected2ndSend = {content: returnedBuffer.text, username: member.displayname, avatar_url: member.propic, files: [{name: 'text.txt', data: returnedBuffer.file}]};
            jest.mock('console', () => ({error: jest.fn()}));
            jest.spyOn(webhookHelper, 'getOrCreateWebhook').mockResolvedValue(webhook);
            webhook.send = jest.fn().mockImplementationOnce(async() => {throw new Error('error')});
            messageHelper.returnBufferFromText = jest.fn().mockResolvedValue(returnedBuffer);
            // Act
            return webhookHelper.replaceMessage(client, message, text, member).catch((res) => {
                // Assert
                expect(messageHelper.returnBufferFromText).toHaveBeenCalledTimes(1);
                expect(messageHelper.returnBufferFromText).toHaveBeenCalledWith(text);
                expect(webhook.send).toHaveBeenCalledTimes(2);
                expect(webhook.send).toHaveBeenNthCalledWith(2, expected2ndSend);
                expect(console.error).toHaveBeenCalledTimes(1);
                expect(console.error).toHaveBeenCalledWith(new Error('error'));
            })
        })
    })

    describe(`getOrCreateWebhook`, () => {

    })

    describe(`getWebhook`, () => {

    })


    afterEach(() => {
        // restore the spy created with spyOn
        jest.restoreAllMocks();
    });
})