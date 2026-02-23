import {enums} from "../src/enums.js";

jest.mock("../src/helpers/messageHelper.js", () => {
    return {
        messageHelper: {
            returnBufferFromText: jest.fn(),
            prefix: 'pf;'
        }
    }
})

jest.mock('../src/helpers/memberHelper.js', () => {
    return {
        memberHelper: {
            parseMemberCommand: jest.fn()
        }
    }
})

jest.mock('../src/helpers/importHelper.js', () => {
    return {
        importHelper: {
            pluralKitImport: jest.fn()
        }
    }
})
jest.mock('console', () => {
    return {error: jest.fn()}
})

import {messageHelper, prefix} from "../src/helpers/messageHelper.js";

import {memberHelper} from "../src/helpers/memberHelper.js";
import {EmbedBuilder} from "@fluxerjs/core";
import {importHelper} from "../src/helpers/importHelper.js";
import {commands} from "../src/commands.js";


describe('commands', () => {
    const authorId = '123';
    const discriminator = '123';
    const username = 'somePerson'

    beforeEach(() => {

        jest.resetModules();
        jest.clearAllMocks();
    })

    describe('memberCommand', () => {
        const attachmentUrl = 'oya.png';
        const attachmentExpiration = new Date('2026-01-01').toDateString();
        const message = {
            author: {
                username: username,
                id: authorId,
                discriminator: discriminator,
            },
            attachments: {
                size: 1,
                first: jest.fn().mockImplementation(() => ({
                    expires_at: attachmentExpiration,
                    url: attachmentUrl
                }))
            },
            reply: jest.fn().mockResolvedValue()
        }
        const args = ['new']

        test('calls parseMemberCommand with the correct arguments', () => {
            // Arrange
            memberHelper.parseMemberCommand = jest.fn().mockResolvedValue("parsed command");
            // Act
            return commands.memberCommand(message, args).then(() => {
                expect(memberHelper.parseMemberCommand).toHaveBeenCalledTimes(1);
                expect(memberHelper.parseMemberCommand).toHaveBeenCalledWith(authorId, `${username}#${discriminator}`, args, attachmentUrl, attachmentExpiration);
            });
        })

        test('if parseMemberCommand returns error, log error and reply with error', () => {
            // Arrange
            memberHelper.parseMemberCommand = jest.fn().mockImplementation(() => {throw new Error('error')});
            // Act
            return commands.memberCommand(message, args).catch(() => {
                expect(message.reply).toHaveBeenCalledTimes(1);
                expect(message.reply).toHaveBeenCalledWith('error');
                expect(console.error).toHaveBeenCalledWith(new Error('error'));
            });
        })

        test('if parseMemberCommand returns embed, reply with embed', () => {
            // Arrange
            const embed = new EmbedBuilder();
            memberHelper.parseMemberCommand = jest.fn().mockResolvedValue();
            // Act
            return commands.memberCommand(message, args).catch(() => {
                // Assert
                expect(message.reply).toHaveBeenCalledTimes(1);
                expect(message.reply).toHaveBeenCalledWith({embeds: [embed]})
            });
        })



    })



    afterEach(() => {
        // restore the spy created with spyOn
        jest.restoreAllMocks();
    });
})