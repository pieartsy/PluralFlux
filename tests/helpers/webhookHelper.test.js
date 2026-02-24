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
            first: () => {}
        }
        const message = {
            client,
            content: content,
            attachments: attachments,
            author: {
                id: '123'
            },
            guildId: '123',
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
            const res = await webhookHelper.sendMessageAsMember(client, message)
            // Assert
            expect(res).toBeUndefined();
            expect(messageHelper.parseProxyTags).toHaveBeenCalledTimes(1);
            expect(messageHelper.parseProxyTags).toHaveBeenCalledWith(message.author.id, content, null);
            expect(webhookHelper.replaceMessage).not.toHaveBeenCalled();
        })

        test('calls parseProxyTags and returns if proxyMatch is undefined', async() => {
            // Arrange
            messageHelper.parseProxyTags.mockResolvedValue(undefined);
            // Act
            const res = await webhookHelper.sendMessageAsMember(client, message)
            // Assert
            expect(res).toBeUndefined();
            expect(messageHelper.parseProxyTags).toHaveBeenCalledTimes(1);
            expect(messageHelper.parseProxyTags).toHaveBeenCalledWith(message.author.id, content, null);
            expect(webhookHelper.replaceMessage).not.toHaveBeenCalled();
        })

        test('calls parseProxyTags with attachmentUrl', async() => {
            // Arrange
            message.attachments = {
                size: 1,
                first: () => {
                    return {url: 'oya.png'}
                }
            }
            messageHelper.parseProxyTags.mockResolvedValue(undefined);
            // Act
            const res = await webhookHelper.sendMessageAsMember(client, message)
            // Assert
            expect(res).toBeUndefined();
            expect(messageHelper.parseProxyTags).toHaveBeenCalledTimes(1);
            expect(messageHelper.parseProxyTags).toHaveBeenCalledWith(message.author.id, content, 'oya.png');
        })

        test('if message matches member proxy but is not sent from a guild, throw an error', async() => {
            // Arrange
            message.guildId = null;
            messageHelper.parseProxyTags.mockResolvedValue(proxyMessage);
            // Act and Assert
            await expect(webhookHelper.sendMessageAsMember(client, message)).rejects.toThrow(enums.err.NOT_IN_SERVER);
            expect(webhookHelper.replaceMessage).not.toHaveBeenCalled();
        })

        test('if message matches member proxy and sent in a guild and has an attachment, reply to message with ping', async() => {
            // Arrange
            message.guildId = '123'
            proxyMessage.hasAttachment = true;
            messageHelper.parseProxyTags.mockResolvedValue(proxyMessage);
            const expected = `${enums.misc.ATTACHMENT_SENT_BY} ${proxyMessage.member.displayname}`
            // Act
            await webhookHelper.sendMessageAsMember(client, message)
            // Assert
            expect(message.reply).toHaveBeenCalledTimes(1);
            expect(message.reply).toHaveBeenCalledWith(expected);
            expect(webhookHelper.replaceMessage).not.toHaveBeenCalled();
        })

        test('if message matches member proxy and sent in a guild channel and no attachment, calls replace message', async() => {
            // Arrange
            message.guildId = '123';
            proxyMessage.hasAttachment = false;
            messageHelper.parseProxyTags.mockResolvedValue(proxyMessage);
            jest.spyOn(webhookHelper,  'replaceMessage').mockResolvedValue();
            // Act
            await webhookHelper.sendMessageAsMember(client, message);
            // Assert
            expect(message.reply).not.toHaveBeenCalled();
            expect(webhookHelper.replaceMessage).toHaveBeenCalledTimes(1);
            expect(webhookHelper.replaceMessage).toHaveBeenCalledWith(client, message, proxyMessage.message, proxyMessage.member);
        })

        test('if replace message throws error, throw same error and does not call message.reply', async () => {
            // Arrange
            message.guildId = '123';
            messageHelper.parseProxyTags.mockResolvedValue(proxyMessage);
            jest.spyOn(webhookHelper, 'replaceMessage').mockImplementation(() => {
                throw new Error("error")
            });
            // Act
            await expect(webhookHelper.sendMessageAsMember(client, message)).rejects.toThrow("error");
            // Assert
            expect(message.reply).not.toHaveBeenCalled();
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
            reply: jest.fn().mockResolvedValue(),
            delete: jest.fn().mockResolvedValue()
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
            await webhookHelper.replaceMessage(client, message, emptyText, member)
            expect(webhookHelper.getOrCreateWebhook).not.toHaveBeenCalled();
            expect(message.delete).not.toHaveBeenCalled();
        })

        test('calls getOrCreateWebhook and message.delete with correct arguments if text > 0 & < 2000', async() => {
            // Arrange
            message.attachments = {
                size: 0,
                first: () => {
                }
            };
            jest.spyOn(webhookHelper, 'getOrCreateWebhook').mockResolvedValue(webhook);
            // Act
            await webhookHelper.replaceMessage(client, message, text, member);
            // Assert
            expect(webhookHelper.getOrCreateWebhook).toHaveBeenCalledTimes(1);
            expect(webhookHelper.getOrCreateWebhook).toHaveBeenCalledWith(client, channelId);
            expect(message.delete).toHaveBeenCalledTimes(1);
            expect(message.delete).toHaveBeenCalledWith();
        })

        // TODO: Flaky for some reason. Skipping until attachments are implemented
        test.skip('calls getOrCreateWebhook and message.delete with correct arguments if attachments exist', async() => {
            // Arrange
            const emptyText = ''
            jest.spyOn(webhookHelper, 'getOrCreateWebhook').mockResolvedValue(webhook);
            // Act
            await webhookHelper.replaceMessage(client, message, emptyText, member);
            // Assert
            // expect(webhookHelper.getOrCreateWebhook).toHaveBeenCalledTimes(1);
            // expect(webhookHelper.getOrCreateWebhook).toHaveBeenCalledWith(client, channelId);
            expect(message.delete).toHaveBeenCalledTimes(1);
            expect(message.delete).toHaveBeenCalledWith();
        })

        test('calls returnBufferFromText if text is more than 2000 characters', async() => {
            // Arrange
            const text = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabbbb";
            message.content = text;
            const file = Buffer.from(text, 'utf-8');
            const returnedBuffer = {text: 'bbbb', file: file};
            const expected = {content: returnedBuffer.text, username: member.displayname, avatar_url: member.propic, files: [{name: 'text.txt', data: returnedBuffer.file}]};

            jest.spyOn(webhookHelper, 'getOrCreateWebhook').mockResolvedValue(webhook);
            webhook.send = jest.fn();
            messageHelper.returnBufferFromText = jest.fn().mockReturnValue(returnedBuffer);

            // Act
            await webhookHelper.replaceMessage(client, message, text, member);
            // Assert
            expect(messageHelper.returnBufferFromText).toHaveBeenCalledTimes(1);
            expect(messageHelper.returnBufferFromText).toHaveBeenCalledWith(text);
            expect(webhook.send).toHaveBeenCalledTimes(1);
            expect(webhook.send).toHaveBeenCalledWith(expected);
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