const env = require('dotenv').config({path: './.env.jest'})
const {enums} = require("../src/enums.js");

jest.mock('@fluxerjs/core', () => {
    return {
        Events: {
            MessageCreate: jest.fn(),
            Ready: jest.fn(),
            GuildCreate: jest.fn(),
        },
        Client: jest.fn().mockImplementation(() => {
            return {
                on: jest.fn(),
                intents: 0,
                login: jest.fn()
            }
        }),
        Message: jest.fn()
    };
});

jest.mock("../src/helpers/messageHelper.js", () => {
    return {
        messageHelper: {
            parseCommandArgs: jest.fn(),
            prefix: "pf;"
        }
    }
});

jest.mock("../src/helpers/webhookHelper.js", () => {
    return {
        webhookHelper: {
            sendMessageAsMember: jest.fn()
        }
    }
})
jest.mock("../src/helpers/utils.js", () => {
    return {
        utils: {
            debounce: jest.fn()
        }
    }
})

jest.mock("../src/commands.js", () => {
    return {
        commands: {
            commandsMap: {
                get: jest.fn(),
            },
            aliasesMap: {
                get: jest.fn()
            }
        }
    }
})

jest.mock('../database/data-source.ts', () => {
    return {
        AppDataSource: {
            IsInitialized: false,
            initialize: jest.fn().mockResolvedValue()
        }
    }
})


const {Client, Events} = require('@fluxerjs/core');
const {messageHelper} = require("../src/helpers/messageHelper.js");

const {commands} = require("../src/commands.js");
const {webhookHelper} = require("../src/helpers/webhookHelper.js");

const {utils} = require("../src/helpers/utils.js");
let {handleMessageCreate, client} = require("../src/bot.js");
const {login} = require("../src/bot");

describe('bot', () => {
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    })

    describe('handleMessageCreate', () => {

        test('on message creation, if message is from bot, return', async () => {
            // Arrange
            const message = {
                author: {
                    bot: true
                }
            }
            // Act
            const res = await handleMessageCreate(message);
            expect(res).toBeUndefined();
        })

        test("if message doesn't start with bot prefix, call sendMessageAsMember", async () => {
            // Arrange
            webhookHelper.sendMessageAsMember.mockResolvedValue();
            const message = {
                content: "hello",
                author: {
                    bot: false
                }
            }
            // Act
            const res = await handleMessageCreate(message);
            // Assert
            expect(webhookHelper.sendMessageAsMember).toHaveBeenCalledTimes(1);
            expect(webhookHelper.sendMessageAsMember).toHaveBeenCalledWith(client, message)
        })

        test("if sendMessageAsMember returns error, catch and log error", async () => {
            // Arrange
            webhookHelper.sendMessageAsMember.mockRejectedValue(new Error("error"));
            const message = {
                content: "hello",
                author: {
                    bot: false
                }
            }
            jest.spyOn(global.console, 'error').mockImplementation(() => {});
            // Act
            await handleMessageCreate(message);
            // Assert
            expect(webhookHelper.sendMessageAsMember).toHaveBeenCalledTimes(1);
            expect(webhookHelper.sendMessageAsMember).toHaveBeenCalledWith(client, message)
            expect(console.error).toHaveBeenCalledTimes(1);
            expect(console.error).toHaveBeenCalledWith(new Error('error'));
        })

        test("if no command after prefix, return correct enum", async () => {
            // Arrange
            const message = {
                content: "pf;",
                author: {
                    bot: false
                },
                reply: jest.fn()
            }
            // Act
            await handleMessageCreate(message);
            // Assert
            expect(message.reply).toHaveBeenCalledTimes(1);
            expect(message.reply).toHaveBeenCalledWith(enums.help.SHORT_DESC_PLURALFLUX);
            expect(webhookHelper.sendMessageAsMember).not.toHaveBeenCalled();
        })

        test("if command after prefix, call parseCommandArgs and commandsMap.get", async () => {
            // Arrange
            const message = {
                content: "pf;help",
                author: {
                    bot: false
                },
                reply: jest.fn()
            }
            const command = {
                execute: jest.fn().mockResolvedValue(),
            }
            commands.commandsMap.get = jest.fn().mockReturnValue(command);
            // Act
            await handleMessageCreate(message);
            // Assert
            expect(messageHelper.parseCommandArgs).toHaveBeenCalledTimes(1);
            expect(messageHelper.parseCommandArgs).toHaveBeenCalledWith('pf;help', 'help');
            expect(commands.commandsMap.get).toHaveBeenCalledTimes(1);
            expect(commands.commandsMap.get).toHaveBeenCalledWith('help');
            expect(webhookHelper.sendMessageAsMember).not.toHaveBeenCalled();
        })

        test('if commands.commandsMap.get returns undefined, call aliasesMap.get and commandsMap.get again with that value', async () => {
            // Arrange
            const message = {
                content: "pf;m",
                author: {
                    bot: false
                },
                reply: jest.fn()
            }
            const mockAlias = {
                command: 'member'
            }
            commands.commandsMap.get = jest.fn().mockReturnValueOnce();
            commands.aliasesMap.get = jest.fn().mockReturnValueOnce(mockAlias);
            // Act
            await handleMessageCreate(message);
            // Assert
            expect(commands.commandsMap.get).toHaveBeenCalledTimes(2);
            expect(commands.commandsMap.get).toHaveBeenNthCalledWith(1, 'm');
            expect(commands.commandsMap.get).toHaveBeenNthCalledWith(2, 'member');
            expect(commands.aliasesMap.get).toHaveBeenCalledTimes(1);
            expect(commands.aliasesMap.get).toHaveBeenCalledWith('m');
        })


        test('if aliasesMap.get returns undefined, do not call commandsMap again', async () => {
            // Arrange
            const message = {
                content: "pf;m",
                author: {
                    bot: false
                },
                reply: jest.fn()
            }
            const mockAlias = {
                command: 'member'
            }
            commands.commandsMap.get = jest.fn().mockReturnValueOnce();
            commands.aliasesMap.get = jest.fn().mockReturnValueOnce();
            // Act
            await handleMessageCreate(message);
            // Assert
            expect(commands.aliasesMap.get).toHaveBeenCalledTimes(1);
            expect(commands.aliasesMap.get).toHaveBeenCalledWith('m');
        })

        test("if command exists, call command.execute", async () => {
            // Arrange
            const message = {
                content: "pf;member test",
                author: {
                    bot: false
                },
                reply: jest.fn()
            }
            const command = {
                execute: jest.fn()
            }
            messageHelper.parseCommandArgs = jest.fn().mockReturnValue(['test']);
            commands.commandsMap.get = jest.fn().mockReturnValue(command);
            command.execute = jest.fn().mockResolvedValue();

            // Act
            await handleMessageCreate(message)
            // Assert
            expect(command.execute).toHaveBeenCalledTimes(1);
            expect(command.execute).toHaveBeenCalledWith(message, ['test']);
            expect(webhookHelper.sendMessageAsMember).not.toHaveBeenCalled();
        });
    })

    test("if command.execute returns error, log error", async () => {
        // Arrange
        const command = {
            execute: jest.fn()
        }
        commands.commandsMap.get = jest.fn().mockReturnValue(command);
        command.execute.mockRejectedValue(new Error("error"));
        const message = {
            content: "pf;member test",
            author: {
                bot: false
            },
            reply: jest.fn()
        }
        jest.spyOn(global.console, 'error').mockImplementation(() => {
        })
        // Act
        await handleMessageCreate(message);
        // Assert
        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalledWith(new Error('error'))
    })

    test("if command does not exist, return correct enum", async () => {
        // Arrange
        commands.commandsMap.get = jest.fn().mockReturnValue();
        commands.aliasesMap.get = jest.fn().mockReturnValue();
        const message = {
            content: "pf;asdfjlas",
            author: {
                bot: false
            },
            reply: jest.fn()
        }
        // Act
        await handleMessageCreate(message);
        // Assert
        expect(message.reply).toHaveBeenCalledWith(enums.err.COMMAND_NOT_RECOGNIZED);
        expect(message.reply).toHaveBeenCalledTimes(1);
    })

    test('login calls client.login with correct argument', async () => {
        // Arrange
        client.login = jest.fn().mockResolvedValue();
        // Act
        await login();
        // Assert
        expect(client.login).toHaveBeenCalledTimes(1);
        expect(client.login).toHaveBeenCalledWith(process.env.FLUXER_BOT_TOKEN)
    })

    afterEach(() => {
        // restore the spy created with spyOn
        jest.restoreAllMocks();
    });
})