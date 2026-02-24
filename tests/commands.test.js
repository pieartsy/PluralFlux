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

import {messageHelper} from "../src/helpers/messageHelper.js";

import {memberHelper} from "../src/helpers/memberHelper.js";
import {EmbedBuilder} from "@fluxerjs/core";
import {importHelper} from "../src/helpers/importHelper.js";
import {commands} from "../src/commands.js";


describe('commands', () => {
    const authorId = '123';
    const discriminator = '123';
    const username = 'somePerson'
    const attachmentUrl = 'oya.json';
    const attachmentExpiration = new Date('2026-01-01').toDateString();
    let message;
    const args = ['new']

    beforeEach(() => {

        jest.resetModules();
        jest.clearAllMocks();
        message = {
            author: {
                username: username,
                id: authorId,
                discriminator: discriminator,
            },
            attachments: {
                size: 1,
                first: jest.fn().mockImplementation(() => {
                    return {
                        url: attachmentUrl,
                        expires_at: attachmentExpiration
                    }
                })
            },
            reply: jest.fn().mockResolvedValue(),
            content: 'pf;import'
        }
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
            memberHelper.parseMemberCommand = jest.fn().mockImplementation(() => {
                throw new Error('error')
            });
            // Act
            return commands.memberCommand(message, args).catch(() => {
                expect(message.reply).toHaveBeenCalledTimes(1);
                expect(message.reply).toHaveBeenCalledWith('error');
                expect(console.error).toHaveBeenCalledWith(new Error('error'));
            });
        })

        test('if parseMemberCommand returns embed, reply with embed', async () => {
            // Arrange
            const embed = new EmbedBuilder();
            memberHelper.parseMemberCommand = jest.fn().mockResolvedValue(embed);
            // Act
            await commands.memberCommand(message, args);
            expect(message.reply).toHaveBeenCalledTimes(1);
            expect(message.reply).toHaveBeenCalledWith({embeds: [embed]})
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
                expect(message.reply).toHaveBeenCalledWith({
                    content: `success\n\n${enums.err.ERRORS_OCCURRED}\n\nerror\nerror2}`,
                    embeds: [reply.embed]
                })
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

        test('if attachment URL, call pluralKitImport with correct arguments', async () => {
            // Arrange
            const args = [""];
            message.content = 'pf;import';
            importHelper.pluralKitImport = jest.fn().mockResolvedValue('success');
            // Act
            await commands.importCommand(message, args);
            // Assert
            expect(message.reply).toHaveBeenCalledTimes(1);
            expect(message.reply).toHaveBeenCalledWith('success');
            expect(importHelper.pluralKitImport).toHaveBeenCalledTimes(1);
            expect(importHelper.pluralKitImport).toHaveBeenCalledWith(authorId, attachmentUrl);
        })

        test('if pluralKitImport returns aggregate errors with length <= 2000, send errors.', async () => {
            // Arrange
            const args = [""];
            message.content = 'pf;import'
            importHelper.pluralKitImport = jest.fn().mockImplementation(() => {
                throw new AggregateError(['error1', 'error2'], 'errors')
            });
            // Act
            await commands.importCommand(message, args);
            // Assert
            expect(message.reply).toHaveBeenCalledTimes(1);
            expect(message.reply).toHaveBeenCalledWith(`errors.\n\n${enums.err.ERRORS_OCCURRED}\n\nerror1\nerror2`);
        })

        test('if pluralKitImport returns aggregate errors with length > 2000, call returnBufferFromText and message.reply.', async () => {
            // Arrange
            const args = [""];
            const text = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabbb";
            const file = Buffer.from(text, 'utf-8');
            const returnedBuffer = {text: 'bbbb', file: file};
            const expected = {content: returnedBuffer.text, files: [{name: 'text.txt', data: returnedBuffer.file}]};

            importHelper.pluralKitImport = jest.fn().mockImplementation(() => {
                throw new AggregateError([text, 'error2'], 'errors')
            });
            messageHelper.returnBufferFromText = jest.fn().mockReturnValue(returnedBuffer);
            // Act
            await commands.importCommand(message, args);
            // Assert
            expect(message.reply).toHaveBeenCalledTimes(1);
            expect(message.reply).toHaveBeenCalledWith(expected);
        })

        test('if pluralKitImport returns one error, reply with error', async() => {
            // Arrange
            importHelper.pluralKitImport = jest.fn().mockImplementation(() => {
                throw new Error('error');
            });
            // Act
            await commands.importCommand(message, args);
            expect(message.reply).toHaveBeenCalledTimes(1);
            expect(message.reply).toHaveBeenCalledWith('error');
        })
    })

    afterEach(() => {
        // restore the spy created with spyOn
        jest.restoreAllMocks();
    });
})