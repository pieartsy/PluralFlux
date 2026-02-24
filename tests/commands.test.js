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
        reply: jest.fn().mockResolvedValue(),
    }
    const args = ['new']

    beforeEach(() => {

        jest.resetModules();
        jest.clearAllMocks();
    })

    describe('memberCommand', () => {


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

        test('if parseMemberCommand returns object, reply with embed and content', () => {
            // Arrange
            const reply = {
                errors: ['error', 'error2'],
                success: 'success',
                embed: {}
            }
            memberHelper.parseMemberCommand = jest.fn().mockResolvedValue(reply);
            // Act
            return commands.memberCommand(message, args).catch(() => {
                // Assert
                expect(message.reply).toHaveBeenCalledTimes(1);
                expect(message.reply).toHaveBeenCalledWith({content: `success\n\n${enums.err.ERRORS_OCCURRED}\n\nerror\nerror2}`, embeds: [reply.embed]})
            });
        })
    })

    describe('importCommand', () => {
        test('if message includes --help and no attachmentURL, return help message', () => {
            const args = ["--help"];
            message.content = "pf;import --help";
            message.attachments.size = 0;
            return commands.importCommand(message, args).then(() => {
                expect(message.reply).toHaveBeenCalledTimes(1);
                expect(message.reply).toHaveBeenCalledWith(enums.help.IMPORT);
                expect(importHelper.pluralKitImport).not.toHaveBeenCalled();
            })
        })

        test('if no args and no attachmentURL, return help message', () => {
            const args = [""];
            message.content = 'pf;import'
            message.attachments.size = 0;
            return commands.importCommand(message, args).then(() => {
                expect(message.reply).toHaveBeenCalledTimes(1);
                expect(message.reply).toHaveBeenCalledWith(enums.help.IMPORT);
                expect(importHelper.pluralKitImport).not.toHaveBeenCalled();
            })
        })

        test('if attachment URL, call pluralKitImport with correct arguments', () => {
            const args = [""];
            message.content = 'pf;import'
            importHelper.pluralKitImport = jest.fn().mockResolvedValue('success');
            return commands.importCommand(message, args).then(() => {
                expect(message.reply).toHaveBeenCalledTimes(1);
                expect(message.reply).toHaveBeenCalledWith('success');
                expect(importHelper.pluralKitImport).toHaveBeenCalledTimes(1);
                expect(importHelper.pluralKitImport).toHaveBeenCalledWith(authorId, attachmentUrl);
            })
        })

        test('if pluralKitImport returns aggregate errors, send errors.', () => {
            const args = [""];
            message.content = 'pf;import'
            importHelper.pluralKitImport = jest.fn().mockImplementation(() => {throw new AggregateError(['error1', 'error2'], 'errors')});
            return commands.importCommand(message, args).catch(() => {
                expect(message.reply).toHaveBeenCalledTimes(1);
                expect(message.reply).toHaveBeenCalledWith(`errors. \n\n${enums.err.ERRORS_OCCURRED}\n\nerror1\nerror2`);
            })
        })

        test('if message.reply throws error, call returnBufferFromText and message.reply again.', () => {
            // Arrange
            const args = [""];
            message.content = 'pf;import'
            message.reply = jest.fn().mockImplementationOnce(() => {throw e})
            messageHelper.returnBufferFromText = jest.fn().mockResolvedValue({file: 'test.txt', text: 'normal content'});
            return commands.importCommand(message, args).catch(() => {
                expect(message.reply).toHaveBeenCalledTimes(2);
                expect(message.reply).toHaveBeenNthCalledWith(1, {content: 'normal content', files: [{name: 'test.txt', data: 'test.txt' }],});
            })
        })
    })

    afterEach(() => {
        // restore the spy created with spyOn
        jest.restoreAllMocks();
    });
})