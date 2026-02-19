jest.mock('../../src/helpers/messageHelper.js')

const {messageHelper} = require("../../src/helpers/messageHelper.js");

jest.mock('../../src/helpers/messageHelper.js', () => {
    return {messageHelper: {
            parseProxyTags: jest.fn(),
            returnBuffer: jest.fn()
        }}
})

const {webhookHelper} = require("../../src/helpers/webhookHelper.js");
const {enums} = require("../../src/enums");

describe('webhookHelper', () => {

    const client = {};

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    })

    describe(`sendMessageAsMember`, () => {
        const content = "hi"
        const attachments = new Map();
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


    })

    describe(`replaceMessage`, () => {

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