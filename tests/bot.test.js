const env = require('dotenv');
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
            get: jest.fn()
        }
    }
})


const {Client, Events} = require('@fluxerjs/core');
const {messageHelper} = require("../src/helpers/messageHelper.js");

const {commands} = require("../src/commands.js");
const {webhookHelper} = require("../src/helpers/webhookHelper.js");

const {utils} = require("../src/helpers/utils.js");
let {handleMessageCreate, client, debounceLogin} = require("../src/bot.js");

env.config();

describe('bot', () => {

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    })

    describe('handleMessageCreate', () => {

        test('on message creation, if message is from bot, return', () => {
            // Arrange
            const message = {
                author: {
                    bot: true
                }
            }
            // Act
            return handleMessageCreate(message).then((res) => {
                expect(res).toBe(undefined);
            });
        })

        test('on message creation, if message is empty, return', () => {
            // Arrange
            const message = {
                content: "            ",
                author: {
                    bot: false
                }
            }
            // Act
            return handleMessageCreate(message).then((res) => {
                // Assert
                expect(res).toBe(undefined);
            });
        })

        test("if message doesn't start with bot prefix, call sendMessageAsMember", () => {
            // Arrange
            webhookHelper.sendMessageAsMember.mockResolvedValue();
            const message = {
                content: "hello",
                author: {
                    bot: false
                }
            }
            // Act
            return handleMessageCreate(message).then(() => {
                // Assert
                expect(webhookHelper.sendMessageAsMember).toHaveBeenCalledTimes(1);
                expect(webhookHelper.sendMessageAsMember).toHaveBeenCalledWith(client, message)
            });
        })

        test("if sendMessageAsMember returns error, log error", () => {
            // Arrange
            webhookHelper.sendMessageAsMember.mockImplementation(() => {
                throw Error("error")
            });
            const message = {
                content: "hello",
                author: {
                    bot: false
                }
            }
            jest.mock('console', () => {
                return {error: jest.fn()}
            })
            // Act
            return handleMessageCreate(message).catch(() => {
                // Assert
                expect(webhookHelper.sendMessageAsMember).toHaveBeenCalledTimes(1);
                expect(webhookHelper.sendMessageAsMember).toHaveBeenCalledWith(client, message)
                expect(console.error).toHaveBeenCalledTimes(1);
                expect(console.error).toHaveBeenCalledWith(new Error('error'))
            });
        })

        test("if no command after prefix, return correct enum", () => {
            // Arrange
            const message = {
                content: "pf;",
                author: {
                    bot: false
                },
                reply: jest.fn()
            }
            // Act
            return handleMessageCreate(message).then(() => {
                // Assert
                expect(message.reply).toHaveBeenCalledTimes(1);
                expect(message.reply).toHaveBeenCalledWith(enums.help.SHORT_DESC_PLURALFLUX);
                expect(webhookHelper.sendMessageAsMember).not.toHaveBeenCalled();
            });
        })

        test("if command after prefix, call parseCommandArgs and commands.get", () => {
            // Arrange
            const message = {
                content: "pf;help",
                author: {
                    bot: false
                },
                reply: jest.fn()
            }
            // Act
            return handleMessageCreate(message).then(() => {
                // Assert
                expect(messageHelper.parseCommandArgs).toHaveBeenCalledTimes(1);
                expect(messageHelper.parseCommandArgs).toHaveBeenCalledWith('pf;help', 'help');
                expect(commands.get).toHaveBeenCalledTimes(1);
                expect(commands.get).toHaveBeenCalledWith('help');
                expect(webhookHelper.sendMessageAsMember).not.toHaveBeenCalled();
            });
        })

        test("if command exists, call command.execute", () => {
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
            commands.get = jest.fn().mockReturnValue(command);
            command.execute = jest.fn().mockResolvedValue();

            // Act
            return handleMessageCreate(message).then(() => {
                // Assert
                expect(command.execute).toHaveBeenCalledTimes(1);
                expect(command.execute).toHaveBeenCalledWith(message, client, ['test']);
                expect(webhookHelper.sendMessageAsMember).not.toHaveBeenCalled();
            });
        })

        test("if command.execute returns error, log error", () => {
            // Arrange
            const command = {
                execute: jest.fn()
            }
            commands.get = jest.fn().mockReturnValue(command);
            command.execute.mockImplementation(() => {
                throw Error("error")
            });
            // Arrange
            const message = {
                content: "pf;member test",
                author: {
                    bot: false
                },
                reply: jest.fn()
            }
            jest.mock('console', () => {
                return {error: jest.fn()}
            })
            // Act
            return handleMessageCreate(message).catch(() => {
                // Assert
                expect(console.error).toHaveBeenCalledTimes(1);
                expect(console.error).toHaveBeenCalledWith(new Error('error'))
            });
        })

        test("if command does not exist, return correct enum", () => {
            // Arrange
            commands.get = jest.fn().mockReturnValue();
            const message = {
                content: "pf;asdfjlas",
                author: {
                    bot: false
                },
                reply: jest.fn()
            }
            // Act
            return handleMessageCreate(message).then(() => {
                // Assert
                expect(message.reply).toHaveBeenCalledWith(enums.err.COMMAND_NOT_RECOGNIZED);
                expect(message.reply).toHaveBeenCalledTimes(1);
            });
        })
    })

    test('calls client.login with correct argument', () => {
        // Act
        client.login = jest.fn().mockResolvedValue();
        // Assert
        expect(client.login).toHaveBeenCalledTimes(1);
        expect(client.login).toHaveBeenCalledWith(process.env.FLUXER_BOT_TOKEN)
    })

    afterEach(() => {
        // restore the spy created with spyOn
        jest.restoreAllMocks();
    });
})