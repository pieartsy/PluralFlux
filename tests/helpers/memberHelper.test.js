const {enums} = require('../../src/enums.js');
const {utils} = require("../../src/helpers/utils.js");

jest.mock('@fluxerjs/core', () => jest.fn());
jest.mock('../../src/database.js', () => {
    return {
        database: {
            members: {
                create: jest.fn().mockResolvedValue(),
                update: jest.fn().mockResolvedValue(),
                destroy: jest.fn().mockResolvedValue(),
                findOne: jest.fn().mockResolvedValue(),
                findAll: jest.fn().mockResolvedValue(),
            }
        }
    }
});

jest.mock("../../src/helpers/utils.js", () => {
    return {
        utils:
            {
                checkImageFormatValidity: jest.fn().mockResolvedValue(),
            }
    }
});

const {Op} = require('sequelize');

const {memberHelper} = require("../../src/helpers/memberHelper.js");
const {database} = require("../../src/database");

describe('MemberHelper', () => {
    const authorId = "0001";
    const authorFull = "author#0001";
    const attachmentUrl = "../oya.png";
    const attachmentExpiration = new Date('2026-01-01').toDateString();
    const mockMember = {
        name: "somePerson",
        displayname: "Some Person",
        proxy: "--text",
        propic: attachmentUrl
    }

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    })

    describe('parseMemberCommand', () => {

        beforeEach(() => {
            jest.spyOn(memberHelper, 'getMemberCommandInfo').mockResolvedValue("member command info");
            jest.spyOn(memberHelper, 'memberArgumentHandler').mockResolvedValue("handled argument");
            jest.spyOn(memberHelper, 'memberCommandHandler').mockResolvedValue("called command");
            jest.spyOn(memberHelper, 'sendCurrentValue').mockResolvedValue("current value");
            jest.spyOn(memberHelper, 'sendHelpEnum').mockResolvedValue("help enum")
        });

        test.each([
            [['--help']],
            [['']],
            [[]]
        ])('%s calls getMemberCommandInfo and returns expected result', async (args) => {
            // Act
            return memberHelper.parseMemberCommand(authorId, authorFull, args).then((result) => {
                // Assert
                expect(result).toEqual("member command info");
                expect(memberHelper.getMemberCommandInfo).toHaveBeenCalledTimes(1);
                expect(memberHelper.getMemberCommandInfo).toHaveBeenCalledWith();
            });
        });

        test.each([
            [[mockMember.name, '--help'], null, null, undefined, true, undefined],
            [['new', '--help'], null, null, 'new', true, '--help'],
            [['remove', '--help'], null, null, 'remove', true, '--help'],
            [['name', '--help'], null, null, 'name', true, '--help'],
            [['list', '--help'], null, null, 'list', true, '--help'],
            [['name', '--help'], null, null, 'name', true, '--help'],
            [['displayname', '--help'], null, null, 'displayname', true, '--help'],
            [['proxy', '--help'], null, null, 'proxy', true, '--help'],
            [['propic', '--help'], null, null, 'propic', true, '--help'],
            [['new'], null, null, 'new', true, undefined],
            [['remove'], null, null, 'remove', true, undefined],
            [['name'], null, null, 'name', true, undefined],
            [['list'], null, null, 'list', false, undefined],
            [['displayname'], null, null, 'displayname', true, undefined],
            [['proxy'], null, null, 'proxy', true, undefined],
            [['propic'], null, null, 'propic', true, undefined],
            [[mockMember.name, 'remove'], null, null, 'remove', false, mockMember.name],
            [[mockMember.name, 'remove', 'test'], null, null, 'remove', false, mockMember.name],
            [[mockMember.name, 'new'], null, null, 'new', false, mockMember.name],
            [[mockMember.name, 'new', mockMember.displayname], null, null, 'new', false, mockMember.name],
            [[mockMember.name, 'new',  mockMember.displayname, mockMember.proxy], null, null, 'new', false, mockMember.name],
            [[mockMember.name, 'new', mockMember.displayname, mockMember.proxy,mockMember.propic], null, null, 'new', false, mockMember.name],
            [[mockMember.name, 'new',mockMember.displayname, mockMember.proxy, null], mockMember.propic, null, 'new', false, mockMember.name],
            [[mockMember.name, 'new', mockMember.displayname, mockMember.proxy, null], mockMember.propic, attachmentExpiration, 'new', false, mockMember.name],
            [[mockMember.name, 'name', mockMember.name], null, null, 'name', false, mockMember.name],
            [[mockMember.name, 'new',  '', mockMember.proxy], null, null, 'new', false, mockMember.name],
            [[mockMember.name, 'new', '', '', mockMember.propic], null, null, 'new', false, mockMember.name],
            [[mockMember.name, 'new', '', '', null], mockMember.propic, null, 'new', false, mockMember.name],
            [[mockMember.name, 'new', '', '', null], mockMember.propic, attachmentExpiration, 'new', false, mockMember.name],
            //
            [[mockMember.name, 'displayname', mockMember.displayname], null, null, 'displayname', false, mockMember.name],
            [[mockMember.name, 'proxy', mockMember.proxy], null, null, 'proxy', false, mockMember.name],
            [[mockMember.name, 'propic', mockMember.propic], null, null, 'propic', false, mockMember.name],
            [[mockMember.name, 'propic', null], mockMember.propic, null, 'propic', false, mockMember.name],
            [[mockMember.name, 'propic', null], mockMember.propic, attachmentExpiration, 'propic', false, mockMember.name],
            [['remove', mockMember.name], null, null, 'remove', false, mockMember.name],
            [['remove', mockMember.name, 'test'], null, null, 'remove', false, mockMember.name],
            [['new', mockMember.name], null, null, 'new', false, mockMember.name],
            [['new', mockMember.name, mockMember.displayname], null, null, 'new', false, mockMember.name],
            [['new', mockMember.name, mockMember.displayname, mockMember.proxy], null, null, 'new', false, mockMember.name],
            [['new', mockMember.name, mockMember.displayname, mockMember.proxy, mockMember.propic], null, null, 'new', false, mockMember.name],
            [['new', mockMember.name, undefined, mockMember.displayname, mockMember.proxy, undefined], mockMember.propic, null, 'new', false, mockMember.name],
            [['new', mockMember.name, undefined, mockMember.displayname, mockMember.proxy, undefined], mockMember.propic, attachmentExpiration, 'new', false, mockMember.name],
            [['new',mockMember.name,  '', mockMember.proxy], null, null, 'new', false, mockMember.name],
            [['new', mockMember.name, '', '', mockMember.propic], null, null, 'new', false, mockMember.name],
            [['new', mockMember.name, '', '', null], mockMember.propic, null, 'new', false, mockMember.name],
            [['new', mockMember.name, '', '', null], mockMember.propic, attachmentExpiration, 'new', false, mockMember.name],
            //
            [['name', mockMember.name, mockMember.name], null, null, 'name', false, mockMember.name],
            [['displayname', mockMember.name, mockMember.name, mockMember.displayname], null, null, 'displayname', false, mockMember.name],
            [['proxy', mockMember.name, mockMember.name, mockMember.displayname, mockMember.proxy], null, null, 'proxy', false, mockMember.name],
            [['propic', mockMember.name, mockMember.name, mockMember.displayname, mockMember.proxy, mockMember.propic], null, null, 'propic', false, mockMember.name],
            [['propic', mockMember.name, undefined, mockMember.name, mockMember.displayname, mockMember.proxy, undefined], mockMember.propic, null, 'propic', false, mockMember.name],
            [['propic', mockMember.name, undefined, mockMember.name, mockMember.displayname, mockMember.proxy, undefined], mockMember.propic, attachmentExpiration, 'propic', false, mockMember.name]
        ])('%s args with attachmentURL %s and attachment expiration %s calls memberCommandHandler with correct values', (args, attachmentUrl, attachmentExpiration, command, isHelp, memberName) => {
            console.log(args, command, isHelp)
            // Act
            return memberHelper.parseMemberCommand(authorId, authorFull, args, attachmentUrl, attachmentExpiration).then((result) => {
                // Assert
                expect(result).toEqual("handled argument");
                expect(memberHelper.memberArgumentHandler).toHaveBeenCalledTimes(1);
                expect(memberHelper.memberArgumentHandler).toHaveBeenCalledWith(authorId, authorFull, isHelp, command, memberName, args, attachmentUrl, attachmentExpiration);
            });
        })
    });

    describe('memberArgumentHandler', () => {
        beforeEach(() => {
            jest.spyOn(memberHelper, 'memberCommandHandler').mockResolvedValue("handled command");
            jest.spyOn(memberHelper, 'getAllMembersInfo').mockResolvedValue("all member info");
            jest.spyOn(memberHelper, 'sendCurrentValue').mockResolvedValue("current value");
            jest.spyOn(memberHelper, 'sendHelpEnum').mockReturnValue("help enum");
        })

        test('when all values are null should return command not recognized enum', () => {
            // Arrange
            return memberHelper.memberArgumentHandler(authorId, authorFull, false, null, null, []).catch((result) => {
                // Assert
                expect(result).toEqual(new Error(enums.err.COMMAND_NOT_RECOGNIZED));
            });
        })

        test.each([
            ['new'],
            ['remove'],
            ['name'],
            ['displayname'],
            ['proxy'],
            ['propic'],
        ])('when %s is present but other values are null, should return no member enum', (command) => {
            // Arrange
            return memberHelper.memberArgumentHandler(authorId, authorFull, false, command, null, []).catch((result) => {
                // Assert
                expect(result).toEqual(new Error(enums.err.NO_MEMBER));
            });
        })


        test.each([
            ['new'],
            ['remove'],
            ['name'],
            ['list'],
            ['displayname'],
            ['proxy'],
            ['propic'],
        ])('%s calls sendHelpEnum', (command) => {
            // Arrange
            return memberHelper.memberArgumentHandler(authorId, authorFull, true, command, mockMember.name, []).then((result) => {
                // Assert
                expect(result).toEqual("help enum");
                expect(memberHelper.sendHelpEnum).toHaveBeenCalledTimes(1);
                expect(memberHelper.sendHelpEnum).toHaveBeenCalledWith(command);
            });
        })

        test('list should call getAllMembersInfo', () => {
            // Arrange
            return memberHelper.memberArgumentHandler(authorId, authorFull, false, 'list', mockMember.name, []).then((result) => {
                // Assert
                expect(result).toEqual("all member info");
                expect(memberHelper.getAllMembersInfo).toHaveBeenCalledTimes(1);
                expect(memberHelper.getAllMembersInfo).toHaveBeenCalledWith(authorId, authorFull);
            });
        })

        test.each([
            [[mockMember.name, 'remove'], null, null, 'remove'],
            [[mockMember.name, 'remove', 'test'], null, null, 'remove'],
            [[mockMember.name, 'new'], null, null, 'new'],
            [[mockMember.name, 'new', mockMember.displayname], null, null, 'new'],
            [[mockMember.name, 'new',  mockMember.displayname, mockMember.proxy], null, null, 'new'],
            [[mockMember.name, 'new', mockMember.displayname, mockMember.proxy,mockMember.propic], null, null, 'new'],
            [[mockMember.name, 'new',mockMember.displayname, mockMember.proxy, null], mockMember.propic, null, 'new'],
            [[mockMember.name, 'new', mockMember.displayname, mockMember.proxy, null], mockMember.propic, attachmentExpiration, 'new'],
            [[mockMember.name, 'name', mockMember.name], null, null, 'name'],
            [[mockMember.name, 'displayname', mockMember.displayname], null, null, 'displayname'],
            [[mockMember.name, 'new', mockMember.displayname], null, null, 'new'],
            [[mockMember.name, 'new',  '', mockMember.proxy], null, null, 'new'],
            [[mockMember.name, 'new', '', '', mockMember.propic], null, null, 'new'],
            [[mockMember.name, 'new', '', '', undefined], mockMember.propic, null, 'new'],
            [[mockMember.name, 'new', '', '', undefined], mockMember.propic, attachmentExpiration, 'new'],
            [[mockMember.name, 'new', '', ''], mockMember.propic, null, 'new'],
            [[mockMember.name, 'new', '', ''], mockMember.propic, attachmentExpiration, 'new'],
            [[mockMember.name, 'proxy', mockMember.proxy], null, null, 'proxy'],
            [[mockMember.name, 'propic', mockMember.propic], null, null, 'propic'],
            [[mockMember.name, 'propic', undefined], mockMember.propic, null, 'propic'],
            [[mockMember.name, 'propic', undefined], mockMember.propic, attachmentExpiration, 'propic'],
            [[mockMember.name, 'propic'], mockMember.propic, null, 'propic'],
            [[mockMember.name, 'propic'], mockMember.propic, attachmentExpiration, 'propic'],
            [['remove', mockMember.name], null, null, 'remove'],
            [['remove', mockMember.name, 'test'], null, null, 'remove'],
            [['new', mockMember.name], null, null, 'new'],
            [['new', mockMember.name, mockMember.displayname], null, null, 'new'],
            [['new', mockMember.name, mockMember.displayname, mockMember.proxy], null, null, 'new'],
            [['new', mockMember.name, mockMember.displayname, mockMember.proxy, mockMember.propic], null, null, 'new'],
            [['new', mockMember.name, undefined, mockMember.displayname, mockMember.proxy, undefined], mockMember.propic, null, 'new'],
            [['new', mockMember.name, undefined, mockMember.displayname, mockMember.proxy, undefined], mockMember.propic, attachmentExpiration, 'new'],
            [['new', mockMember.name,  '', mockMember.proxy], null, null, 'new'],
            [['new', mockMember.name, '', '', mockMember.propic], null, null, 'new'],
            [['new', mockMember.name, '', '', undefined], mockMember.propic, null, 'new'],
            [['new', mockMember.name, '', '', undefined], mockMember.propic, attachmentExpiration, 'new'],
            [['new', mockMember.name, '', ''], mockMember.propic, null, 'new'],
            [['new', mockMember.name, '', ''], mockMember.propic, attachmentExpiration, 'new'],
            [['name', mockMember.name, mockMember.name], null, null, 'name'],
            [['displayname', mockMember.name, mockMember.name, mockMember.displayname], null, null, 'displayname'],
            [['proxy', mockMember.name, mockMember.name, mockMember.displayname, mockMember.proxy], null, null, 'proxy'],
            [['propic', mockMember.name, mockMember.name, mockMember.displayname, mockMember.proxy, mockMember.propic], null, null, 'propic'],
            [['propic', mockMember.name, undefined, mockMember.name, mockMember.displayname, mockMember.proxy, undefined], mockMember.propic, null, 'propic'],
            [['propic', mockMember.name, undefined, mockMember.name, mockMember.displayname, mockMember.proxy, undefined], mockMember.propic, attachmentExpiration, 'propic']
        ])('%s args with attachmentURL %s and attachment expiration %s calls memberCommandHandler', (args, attachmentUrl, attachmentExpiration, command) => {
            // Arrange
            let values = args.slice(2);

            return memberHelper.memberArgumentHandler(authorId, authorFull, false, command, mockMember.name, args, attachmentUrl, attachmentExpiration).then((result) => {
                // Assert
                expect(result).toEqual("handled command");
                expect(memberHelper.memberCommandHandler).toHaveBeenCalledTimes(1);
                expect(memberHelper.memberCommandHandler).toHaveBeenCalledWith(authorId, command, mockMember.name, values, attachmentUrl, attachmentExpiration);
            });
        })

        test.each([
            [null],
            ['name'],
            ['displayname'],
            ['proxy'],
            ['propic'],
        ])('%s calls sendCurrentValue', (command) => {
            return memberHelper.memberArgumentHandler(authorId, authorFull, false, command, mockMember.name, []).then((result) => {
                // Assert
                expect(result).toEqual("current value");
                expect(memberHelper.sendCurrentValue).toHaveBeenCalledTimes(1);
                expect(memberHelper.sendCurrentValue).toHaveBeenCalledWith(authorId,mockMember.name, command);
            });
        })


    });

    describe('sendCurrentValue', () => {

        test.each([
            ['name', `The name of ${mockMember.name} is \"${mockMember.name}\" but you probably already knew that!`],
            ['displayname', `The display name for ${mockMember.name} is \"${mockMember.displayname}\".`],
            ['proxy', `The proxy for ${mockMember.name} is \"${mockMember.proxy}\".`],
            ['propic', `The profile picture for ${mockMember.name} is \"${mockMember.propic}\".`],
        ])('%s calls getMemberByName and returns value', (command, expected) => {
            // Arrange
            jest.spyOn(memberHelper, 'getMemberByName').mockResolvedValue(mockMember);
            // Act
            return memberHelper.sendCurrentValue(authorId, mockMember.name, command).then((result) => {
                // Assert
                expect(result).toEqual(expected);
                expect(memberHelper.getMemberByName).toHaveBeenCalledTimes(1);
                expect(memberHelper.getMemberByName).toHaveBeenCalledWith(authorId,mockMember.name);
            });
        })

        test('returns error if no member found', () => {
            // Arrange
            jest.spyOn(memberHelper, 'getMemberByName').mockResolvedValue(null);
            // Act
            return memberHelper.sendCurrentValue(authorId, mockMember.name, 'name').catch((result) => {
                // Assert
                expect(result).toEqual(new Error(enums.err.NO_MEMBER));
                expect(memberHelper.getMemberByName).toHaveBeenCalledTimes(1);
                expect(memberHelper.getMemberByName).toHaveBeenCalledWith(authorId,mockMember.name);
            });
        })

        test('calls getMemberInfo with member if no command present', () => {
            // Arrange
            jest.spyOn(memberHelper, 'getMemberByName').mockResolvedValue(mockMember);
            jest.spyOn(memberHelper, 'getMemberInfo').mockResolvedValue('member info');
            // Act
            return memberHelper.sendCurrentValue(authorId, mockMember.name, null).then((result) => {
                // Assert
                expect(result).toEqual('member info');
                expect(memberHelper.getMemberInfo).toHaveBeenCalledTimes(1);
                expect(memberHelper.getMemberInfo).toHaveBeenCalledWith(mockMember);
            });
        })

        test.each([
            ['displayname', `Display name ${enums.err.NO_VALUE}`],
            ['proxy', `Proxy ${enums.err.NO_VALUE}`],
            ['propic', `Propic ${enums.err.NO_VALUE}`],
        ])('returns null message if no member found', (command, expected) => {
            // Arrange
            const empty = {name: mockMember.name, displayname: null, proxy: null, propic: null}
            jest.spyOn(memberHelper, 'getMemberByName').mockResolvedValue(empty);
            // Act
            return memberHelper.sendCurrentValue(authorId, mockMember.name, command).then((result) => {
                // Assert
                expect(result).toEqual(expected);
                expect(memberHelper.getMemberByName).toHaveBeenCalledTimes(1);
                expect(memberHelper.getMemberByName).toHaveBeenCalledWith(authorId,mockMember.name);
            });
        })
    })

    describe('addNewMember', () => {
        test('calls addFullMember with correct arguments', async() => {
            // Arrange
            const args = [mockMember.displayname, mockMember.proxy, mockMember.propic];
            jest.spyOn(memberHelper, 'addFullMember').mockResolvedValue(mockMember);
            jest.spyOn(memberHelper, 'getMemberInfo').mockResolvedValue();
            // Act
            return memberHelper.addNewMember(authorId, mockMember.name, args, attachmentUrl, attachmentExpiration).then(() => {
                expect(memberHelper.addFullMember).toHaveBeenCalledTimes(1);
                expect(memberHelper.addFullMember).toHaveBeenCalledWith(authorId, mockMember.name, mockMember.displayname, mockMember.proxy, mockMember.propic, attachmentExpiration);
            })
        })

        test('calls getMemberInfo when successful and returns result', async () => {
            // Arrange
            const args = [mockMember.displayname, mockMember.proxy, mockMember.propic];
            const fullMemberResponse = {member: mockMember, errors: []}
            const expected = {embed: mockMember, errors: [],  success: `${mockMember.name} has been added successfully.`};
            jest.spyOn(memberHelper, 'addFullMember').mockResolvedValue(fullMemberResponse);
            jest.spyOn(memberHelper, 'getMemberInfo').mockReturnValue(mockMember);
            //Act
            return memberHelper.addNewMember(authorId, mockMember.name, args, attachmentUrl, attachmentExpiration).then((result) => {
                // Assert
                expect(result).toEqual(expected);
                expect(memberHelper.getMemberInfo).toHaveBeenCalledTimes(1);
                expect(memberHelper.getMemberInfo).toHaveBeenCalledWith(mockMember);
            })
        })

        test('throws expected error when getMemberInfo throws error', async () => {
            // Arrange
            const args = [];
            const memberObject = {name: args[1]}
            jest.spyOn(memberHelper, 'addFullMember').mockResolvedValue(memberObject);
            jest.spyOn(memberHelper, 'getMemberInfo').mockImplementation(() => {
                throw new Error('getMemberInfo error')
            });
            //Act
            return memberHelper.addNewMember(authorId, mockMember.name, args).catch((result) => {
                // Assert
                expect(result).toEqual(new Error('getMemberInfo error'));
            })
        })

        test('throws expected error when addFullMember throws error', async () => {
            // Arrange
            const args = [];
            const expected = 'add full member error';
            jest.spyOn(memberHelper, 'addFullMember').mockImplementation(() => {
                throw new Error(expected)
            });

            //Act
            return memberHelper.addNewMember(authorId, mockMember.name, args).catch((result) => {
                // Assert
                expect(result).toEqual(new Error(expected));
            })
        })
    })

    describe('updateName', () => {

        test('call updateMemberField with correct arguments when displayname passed in correctly and returns string', async () => {
            // Arrange;
            jest.spyOn(memberHelper, 'updateMemberField').mockResolvedValue("Updated");
            // Act
            return memberHelper.updateName(authorId, mockMember.name, "   somePerson   ").then((result) => {
                // Assert
                expect(result).toEqual("Updated");
                expect(memberHelper.updateMemberField).toHaveBeenCalledTimes(1);
                expect(memberHelper.updateMemberField).toHaveBeenCalledWith(authorId, mockMember.name, "name", "somePerson");
            })
        })

        test('throws error when name is blank', async () => {
            // Arrange;
            jest.spyOn(memberHelper, 'updateMemberField').mockResolvedValue("Updated");
            // Act
            return memberHelper.updateName(authorId, mockMember.name, "        ").catch((result) => {
                // Assert
                expect(result).toEqual(new RangeError("Name " + enums.err.NO_VALUE));
                expect(memberHelper.updateMemberField).not.toHaveBeenCalled();
            })
        })
    })

    describe('updateDisplayName', () => {

        test('throws error when displayname is blank', async () => {
            // Arrange
            jest.spyOn(memberHelper, 'updateMemberField').mockResolvedValue();
            // Act
            return memberHelper.updateDisplayName(authorId, mockMember.name, mockMember.displayname).catch((result) => {
                // Assert
                expect(result).toEqual(new Error(`Display name ${enums.err.NO_VALUE}`));
                expect(memberHelper.updateMemberField).not.toHaveBeenCalled();
            })
        })

        test('Sends error when display name is too long', async () => {
            // Arrange
            const tooLongDisplayName = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
            jest.spyOn(memberHelper, 'updateMemberField').mockResolvedValue();
            // Act
            return memberHelper.updateDisplayName(authorId, mockMember.name, tooLongDisplayName).catch((result) => {
                // Assert
                expect(result).toEqual(new RangeError(enums.err.DISPLAY_NAME_TOO_LONG));
                expect(memberHelper.updateMemberField).not.toHaveBeenCalled();
            })
        })

        test('call updateMemberField with correct arguments when displayname passed in correctly and returns string', async () => {
            // Arrange
            jest.spyOn(memberHelper, 'updateMemberField').mockResolvedValue("Updated");
            // Act
            return memberHelper.updateDisplayName(authorId, mockMember.name, "      Some Person ").then((result) => {
                // Assert
                expect(result).toEqual("Updated");
                expect(memberHelper.updateMemberField).toHaveBeenCalledWith(authorId, mockMember.name, "displayname", mockMember.displayname);
                expect(memberHelper.updateMemberField).toHaveBeenCalledTimes(1);
            })
        })
    })

    describe('updateProxy', () => {
        test('calls checkIfProxyExists and updateMemberField and returns string', async() => {
            // Arrange
            jest.spyOn(memberHelper, 'checkIfProxyExists').mockResolvedValue();
            jest.spyOn(memberHelper, 'updateMemberField').mockResolvedValue("Updated");
            // Act
            return memberHelper.updateProxy(authorId, mockMember.name, "--text").then((result) => {
                expect(result).toEqual("Updated");
                expect(memberHelper.checkIfProxyExists).toHaveBeenCalledTimes(1);
                expect(memberHelper.checkIfProxyExists).toHaveBeenCalledWith(authorId, mockMember.proxy);
                expect(memberHelper.updateMemberField).toHaveBeenCalledTimes(1);
                expect(memberHelper.updateMemberField).toHaveBeenCalledWith(authorId, mockMember.name, "proxy", mockMember.proxy);
            });
        })
    })

    describe('updatePropic', () => {
        test.each([
            [null, attachmentUrl, null, attachmentUrl],
            [mockMember.propic, null, null, mockMember.propic],
            [mockMember.propic, attachmentUrl, null, attachmentUrl],
            [null, attachmentUrl, attachmentExpiration, attachmentUrl]
        ])('calls checkImageFormatValidity and updateMemberField and returns string', async(imgUrl, attachmentUrl, attachmentExpiration, expected) => {
            // Arrange

            jest.spyOn(memberHelper, 'updateMemberField').mockResolvedValue("Updated");
            // Act
            return memberHelper.updatePropic(authorId, mockMember.name, imgUrl, attachmentUrl, attachmentExpiration).then((result) => {
                expect(result).toEqual("Updated");
                expect(utils.checkImageFormatValidity).toHaveBeenCalledTimes(1);
                expect(utils.checkImageFormatValidity).toHaveBeenCalledWith(expected);
                expect(memberHelper.updateMemberField).toHaveBeenCalledTimes(1);
                expect(memberHelper.updateMemberField).toHaveBeenCalledWith(authorId, mockMember.name, "propic", expected, attachmentExpiration);
            });
        })
    })

    describe('addFullMember', () => {
        const { database} = require('../../src/database.js');
        beforeEach(() => {
            jest.spyOn(memberHelper, 'getMemberByName').mockResolvedValue();
        })

        test('calls getMemberByName', async () => {
            // Act
            return await memberHelper.addFullMember(authorId, mockMember.name).then(() => {
                // Assert
                expect(memberHelper.getMemberByName).toHaveBeenCalledWith(authorId, mockMember.name);
                expect(memberHelper.getMemberByName).toHaveBeenCalledTimes(1);
            })
        })

        test('if getMemberByName returns member, throw error', async () => {
            memberHelper.getMemberByName.mockResolvedValue({name: mockMember.name});
            // Act
            return await memberHelper.addFullMember(authorId, mockMember.name).catch((e) => {
                // Assert
                expect(e).toEqual(new Error(`Can't add ${mockMember.name}. ${enums.err.MEMBER_EXISTS}`))
                expect(database.members.create).not.toHaveBeenCalled();
            })
        })


        test('if name is not filled out, throw error', async () => {
            // Act
            return await memberHelper.addFullMember(authorId, "       ").catch((e) => {
                // Assert
                expect(e).toEqual(new Error(`Name ${enums.err.NO_VALUE}. ${enums.err.NAME_REQUIRED}`))
                expect(database.members.create).not.toHaveBeenCalled();
            })
        })

        test('if displayname is over 32 characters, call database.member.create with null value', async () => {
            // Arrange
            memberHelper.getMemberByName.mockResolvedValue();
            const tooLongDisplayName = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
            const expectedMemberArgs = {
                name: mockMember.name,
                userid: authorId,
                displayname: null,
                proxy: null,
                propic: null
            }
            database.members.create = jest.fn().mockResolvedValue(expectedMemberArgs);
            const expectedReturn = {
                member: expectedMemberArgs,
                errors: [`Tried to set displayname to \"${tooLongDisplayName}\". ${enums.err.DISPLAY_NAME_TOO_LONG}. ${enums.err.SET_TO_NULL}`]
            }

            // Act
            return await memberHelper.addFullMember(authorId, mockMember.name, tooLongDisplayName, null, null).then((res) => {
                // Assert
                expect(res).toEqual(expectedReturn);
                expect(database.members.create).toHaveBeenCalledWith(expectedMemberArgs);
                expect(database.members.create).toHaveBeenCalledTimes(1);
            })
        })

        test('if proxy, call checkIfProxyExists', async () => {
            // Arrange
            jest.spyOn(memberHelper, 'checkIfProxyExists').mockResolvedValue();
            const expectedMemberArgs = {
                name: mockMember.name,
                userid: authorId,
                displayname: null,
                proxy: mockMember.proxy,
                propic: null
            }
            database.members.create = jest.fn().mockResolvedValue(expectedMemberArgs);
            const expectedReturn = {member: expectedMemberArgs, errors: []}

            // Act
            return await memberHelper.addFullMember(authorId, mockMember.name, null, mockMember.proxy).then((res) => {
                // Assert
                expect(res).toEqual(expectedReturn);
                expect(memberHelper.checkIfProxyExists).toHaveBeenCalledWith(authorId, mockMember.proxy);
                expect(memberHelper.checkIfProxyExists).toHaveBeenCalledTimes(1);
                expect(database.members.create).toHaveBeenCalledWith(expectedMemberArgs);
                expect(database.members.create).toHaveBeenCalledTimes(1);
            })
        })

        test('if checkProxyExists throws error, call database.member.create with null value', async () => {
            // Arrange
            jest.spyOn(memberHelper, 'checkIfProxyExists').mockImplementation(() => {
                throw new Error('error')
            });
            const expectedMemberArgs = {
                name: mockMember.name,
                userid: authorId,
                displayname: null,
                proxy: null,
                propic: null
            }
            database.members.create = jest.fn().mockResolvedValue(expectedMemberArgs);
            const expectedReturn = {
                member: expectedMemberArgs,
                errors: [`Tried to set proxy to \"${mockMember.proxy}\". error. ${enums.err.SET_TO_NULL}`]
            }

            // Act
            return await memberHelper.addFullMember(authorId, mockMember.name, null, mockMember.proxy, null).then((res) => {
                // Assert
                expect(res).toEqual(expectedReturn);
                expect(database.members.create).toHaveBeenCalledWith(expectedMemberArgs);
                expect(database.members.create).toHaveBeenCalledTimes(1);
            })
        })

        test('if propic, call checkImageFormatValidity', async () => {
            // Arrange
            const expectedMemberArgs = {
                name: mockMember.name,
                userid: authorId,
                displayname: null,
                proxy: null,
                propic: mockMember.propic
            }
            database.members.create = jest.fn().mockResolvedValue(expectedMemberArgs);
            const expectedReturn = {member: expectedMemberArgs, errors: []}
            // Act
            return await memberHelper.addFullMember(authorId, mockMember.name, null, null, mockMember.propic).then((res) => {
                // Assert
                expect(res).toEqual(expectedReturn);
                expect(utils.checkImageFormatValidity).toHaveBeenCalledWith(mockMember.propic);
                expect(utils.checkImageFormatValidity).toHaveBeenCalledTimes(1);
                expect(database.members.create).toHaveBeenCalledWith(expectedMemberArgs);
                expect(database.members.create).toHaveBeenCalledTimes(1);
            })
        })

        test('if checkImageFormatValidity throws error, call database.member.create with null value', async () => {
            // Arrange
            utils.checkImageFormatValidity = jest.fn().mockImplementation(() => {throw new Error("error")})
            const expectedMemberArgs = {
                name: mockMember.name,
                userid: authorId,
                displayname: null,
                proxy: null,
                propic: null
            }
            database.members.create = jest.fn().mockResolvedValue(expectedMemberArgs);
            const expectedReturn = {
                member: expectedMemberArgs,
                errors: [`Tried to set profile picture to \"${mockMember.propic}\". error. ${enums.err.SET_TO_NULL}`]
            }
            // Act
            return await memberHelper.addFullMember(authorId, mockMember.name, null, null, mockMember.propic).then((res) => {
                // Assert
                expect(res).toEqual(expectedReturn);
                expect(database.members.create).toHaveBeenCalledWith(expectedMemberArgs);
                expect(database.members.create).toHaveBeenCalledTimes(1);
            })
        })

        test('if all values are valid, call database.members.create', async () => {
            // Arrange
            jest.spyOn(memberHelper, 'checkIfProxyExists').mockResolvedValue();
            const expectedMemberArgs = {
                name: mockMember.name,
                userid: authorId,
                displayname: mockMember.displayname,
                proxy: mockMember.proxy,
                propic: mockMember.propic
            }
            database.members.create = jest.fn().mockResolvedValue(expectedMemberArgs);
            utils.checkImageFormatValidity = jest.fn().mockResolvedValue();
            const expectedReturn = {member: expectedMemberArgs, errors: []}
            // Act
            return await memberHelper.addFullMember(authorId, mockMember.name, mockMember.displayname, mockMember.proxy, mockMember.propic).then((res) => {
                // Assert
                expect(res).toEqual(expectedReturn);
                expect(database.members.create).toHaveBeenCalledWith(expectedMemberArgs);
                expect(database.members.create).toHaveBeenCalledTimes(1);
            })
        })

    })

    describe('updateMemberField', () => {
        const {database} = require('../../src/database.js');
        beforeEach(() => {
            jest.spyOn(memberHelper, "setExpirationWarning").mockReturnValue(' warning');
            database.members = {
                update: jest.fn().mockResolvedValue([1])
            };
        })

        test('calls setExpirationWarning if attachmentExpiration', async () => {
            return memberHelper.updateMemberField(authorId, mockMember.name, "propic", mockMember.propic, attachmentExpiration).then((res) => {
                expect(memberHelper.setExpirationWarning).toHaveBeenCalledTimes(1);
                expect(memberHelper.setExpirationWarning).toHaveBeenCalledWith(mockMember.propic);
            })
        })

        test.each([
            ['name', mockMember.name, null, `Updated name for ${mockMember.name} to ${mockMember.name}`],
            ['displayname', mockMember.displayname, null, `Updated name for ${mockMember.name} to ${mockMember.displayname}`],
            ['proxy', mockMember.proxy, null, `Updated name for ${mockMember.name} to ${mockMember.proxy}`],
            ['propic', mockMember.propic, null, `Updated name for ${mockMember.name} to ${mockMember.propic}`],
            ['propic', mockMember.propic, attachmentExpiration, `Updated name for ${mockMember.name} to ${mockMember.propic} warning}`]
        ])('calls database.members.update with correct column and value and return string', async (columnName, value, attachmentExpiration) => {
            // Arrange
            return memberHelper.updateMemberField(authorId, mockMember.name, columnName, value, attachmentExpiration).then((res) => {
                // Act
                expect(database.members.update).toHaveBeenCalledTimes(1);
                expect(database.members.update).toHaveBeenCalledWith({[columnName]: value}, {
                    where: {
                        name: {[Op.iLike]: mockMember.name},
                        userid: authorId
                    }
                })
            })
        })

        test('if database.members.update returns 0 rows changed, throw error', () => {
            // Arrange
            database.members = {
                update: jest.fn().mockResolvedValue([0])
            };
            // Act
            return memberHelper.updateMemberField(authorId, mockMember.name, "displayname", mockMember.displayname).catch((res) => {
                expect(res).toEqual(new Error(`Can't update ${mockMember.name}. ${enums.err.NO_MEMBER}.`))
            })
        })
    })

    describe('checkIfProxyExists', () => {

        beforeEach(() => {
            jest.spyOn(memberHelper, "getMembersByAuthor").mockResolvedValue([mockMember]);
        })

        test.each([
            ['!text'],
            ['! text'],
            ['⭐text'],
            ['⭐ text'],
            ['⭐ text ⭐'],
            ['--text--'],
            ['!text ?'],
            ['SP: text'],
            ['text --SP'],
        ])('%s should call getMembersByAuthor and return false', async (proxy) => {
            return memberHelper.checkIfProxyExists(authorId, proxy).then((res) => {
                expect(res).toEqual(false)
                expect(memberHelper.getMembersByAuthor).toHaveBeenCalledTimes(1);
                expect(memberHelper.getMembersByAuthor).toHaveBeenCalledWith(authorId);
            })
        })

        test.each([
            ['--', enums.err.NO_TEXT_FOR_PROXY, false],
            ['      ', enums.err.NO_TEXT_FOR_PROXY, false],
            ['text', enums.err.NO_PROXY_WRAPPER, false],
            ['--text', enums.err.PROXY_EXISTS, true]
        ])('%s returns correct error and calls getMembersByAuthor if appropriate', async (proxy, error, shouldCall) => {
            return memberHelper.checkIfProxyExists(authorId, proxy).catch((res) => {
                expect(res).toEqual(new Error(error))
                if (shouldCall) {
                    expect(memberHelper.getMembersByAuthor).toHaveBeenCalledTimes(1);
                    expect(memberHelper.getMembersByAuthor).toHaveBeenCalledWith(authorId);
                }
                else {
                    expect(memberHelper.getMembersByAuthor).not.toHaveBeenCalled();
                }
            })
        })


    })

    afterEach(() => {
        // restore the spy created with spyOn
        jest.restoreAllMocks();
    });
})

