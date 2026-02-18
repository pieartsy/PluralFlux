jest.mock('@fluxerjs/core', () => jest.fn());
jest.mock('../../src/database.js', () => jest.fn());
jest.mock('sequelize', () => jest.fn());

const {EmbedBuilder} = require("@fluxerjs/core");
const {database} = require('../../src/database.js');
const {enums} = require('../../src/enums.js');
const {EmptyResultError, Op} = require('sequelize');
const {memberHelper} = require("../../src/helpers/memberHelper.js");

describe('MemberHelper', () => {
    const authorId = "0001";
    const authorFull = "author#0001";
    const attachmentUrl = "../oya.png";
    const attachmentExpiration = new Date('2026-01-01T00.00.00.0000Z')

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    })

    describe('parseMemberCommand', () => {

        beforeEach(() => {
            jest.spyOn(memberHelper, 'getMemberInfo').mockResolvedValue("member info");
            jest.spyOn(memberHelper, 'addNewMember').mockResolvedValue("new member");
            jest.spyOn(memberHelper, 'removeMember').mockResolvedValue("remove member");
            jest.spyOn(memberHelper, 'getAllMembersInfo').mockResolvedValue("all member info");
            jest.spyOn(memberHelper, 'updateName').mockResolvedValue("update name");
            jest.spyOn(memberHelper, 'updateDisplayName').mockResolvedValue("update display name");
            jest.spyOn(memberHelper, 'updateProxy').mockResolvedValue("update proxy");
            jest.spyOn(memberHelper, 'updatePropic').mockResolvedValue("update propic");
            jest.spyOn(memberHelper, 'getProxyByMember').mockResolvedValue("get proxy");
        });

        test.each([
            [['new'], 'new member', 'addNewMember', ['new']],
            [['remove'], 'remove member', 'removeMember', ['remove']],
            [['list'], 'all member info', 'getAllMembersInfo', authorFull],
            [['somePerson', 'name'], 'update name', 'updateName', ['somePerson', 'name']],
            [['somePerson', 'displayname'], 'update display name', 'updateDisplayName', ['somePerson', 'displayname']],
            [['somePerson', 'proxy'], 'get proxy', 'getProxyByMember', 'somePerson'],
            [['somePerson', 'proxy', 'test'], 'update proxy', 'updateProxy', ['somePerson', 'proxy', 'test']],
            [['somePerson'], 'member info', 'getMemberInfo', 'somePerson'],
        ])('%s calls methods and returns correct values', async (args, expectedResult, method, passedIn) => {
            // Act
            return memberHelper.parseMemberCommand(authorId, authorFull, args).then((result) => {
                // Assert
                expect(result).toEqual(expectedResult);
                expect(memberHelper[method]).toHaveBeenCalledTimes(1);
                expect(memberHelper[method]).toHaveBeenCalledWith(authorId, passedIn)
            });
        });

        test('["somePerson", "propic"] returns correct values and calls methods', () => {
            // Arrange
            const args = ['somePerson', 'propic'];
            // Act
            return memberHelper.parseMemberCommand(authorId, authorFull, args, attachmentUrl, attachmentExpiration).then((result) => {
                // Assert
                expect(result).toEqual("update propic");
                expect(memberHelper['updatePropic']).toHaveBeenCalledTimes(1);
                expect(memberHelper['updatePropic']).toHaveBeenCalledWith(authorId, args, attachmentUrl, attachmentExpiration)
            });
        })

        test.each([
            [['--help'], enums.help.MEMBER],
            [['name'], enums.help.NAME],
            [['displayname'], enums.help.DISPLAY_NAME],
            [['proxy'], enums.help.PROXY],
            [['propic'], enums.help.PROPIC],
            [['list', '--help'], enums.help.LIST],
            [[''], enums.help.MEMBER],
        ])('%s returns correct enums', async (args, expectedResult) => {
            // Arrange
            const authorId = '1';
            const authorFull = 'somePerson#0001';
            // Act
            return memberHelper.parseMemberCommand(authorId, authorFull, args).then((result) => {

                expect(result).toEqual(expectedResult);
            });
        });

        describe('errors', () => {
            beforeEach(() => {
                jest.resetModules();
                jest.clearAllMocks();
                jest.spyOn(memberHelper, 'getMemberInfo').mockImplementation(() => { throw new Error('member info error')});
                jest.spyOn(memberHelper, 'addNewMember').mockImplementation(() => { throw new Error('new member error')});
                jest.spyOn(memberHelper, 'removeMember').mockImplementation(() => { throw new Error('remove member error')});
                jest.spyOn(memberHelper, 'getAllMembersInfo').mockImplementation(() => { throw new Error('all member info error')});
                jest.spyOn(memberHelper, 'updateName').mockImplementation(() => { throw new Error('update name error')});
                jest.spyOn(memberHelper, 'updateDisplayName').mockImplementation(() => { throw new Error('update display name error')});
                jest.spyOn(memberHelper, 'updateProxy').mockImplementation(() => { throw new Error('update proxy error')});
                jest.spyOn(memberHelper, 'updatePropic').mockImplementation(() => { throw new Error('update propic error')});
                jest.spyOn(memberHelper, 'getProxyByMember').mockImplementation(() => { throw new Error('get proxy error')});
            })
            test.each([
                [['new'], 'new member error', 'addNewMember', ['new']],
                [['remove'], 'remove member error', 'removeMember', ['remove']],
                [['list'], 'all member info error', 'getAllMembersInfo', authorFull],
                [['somePerson', 'name'], 'update name error', 'updateName', ['somePerson', 'name']],
                [['somePerson', 'displayname'], 'update display name error', 'updateDisplayName', ['somePerson', 'displayname']],
                [['somePerson', 'proxy'], 'get proxy error', 'getProxyByMember', 'somePerson'],
                [['somePerson', 'proxy', 'test'], 'update proxy error', 'updateProxy', ['somePerson', 'proxy', 'test']],
                [['somePerson'], 'member info error', 'getMemberInfo', 'somePerson'],
            ])('%s calls methods and throws correct values', async (args, expectedError, method, passedIn) => {
                // Act
            return memberHelper.parseMemberCommand(authorId, authorFull, args).catch((result) => {
                    // Assert
                    expect(result).toEqual(new Error(expectedError));
                    expect(memberHelper[method]).toHaveBeenCalledTimes(1);
                    expect(memberHelper[method]).toHaveBeenCalledWith(authorId, passedIn)
                });
            });
        })
    })

    describe('addNewMember', () => {

        test('returns help if --help passed in', async() => {
            // Arrange
            const args = ['new', '--help'];
            const expected = enums.help.NEW;
            //Act
            return memberHelper.addNewMember(authorId, args).then((result) => {
                // Assert
                expect(result).toEqual(expected);
            })
        })

        test('returns member without display name when name passed in',  async () => {
            // Arrange
            const args = ['new', 'some person'];
            const memberObject = { name: args[1] }
            const expected = "Member was successfully added.\nName: " + args[1];
            jest.spyOn(memberHelper, 'addFullMember').mockResolvedValue(memberObject);
            //Act
            return memberHelper.addNewMember(authorId, args).then((result) => {
                // Assert
                expect(result).toEqual(expected);
            })
        })

        test('returns member with display name when name and display name passed in',  async () => {
            // Arrange
            const args = ['new', 'some person', 'Some person Full Name'];
            const memberObject = { name: args[1], displayname: args[2] }
            const expected = "Member was successfully added.\nName: " + args[1] + "\nDisplay name: " + args[2];
            jest.spyOn(memberHelper, 'addFullMember').mockResolvedValue(memberObject);
            //Act
            return memberHelper.addNewMember(authorId, args).then((result) => {
                // Assert
                expect(result).toEqual(expected);
            })
        })

        test('throws expected error when addFullMember throws error',  async () => {
            // Arrange
            const args = ['new', 'somePerson'];
            const expected = 'add full member error';
            jest.spyOn(memberHelper, 'addFullMember').mockImplementation(() => { throw new Error(expected)});

            //Act
            return memberHelper.addNewMember(authorId, args).catch((result) => {
                // Assert
                expect(result).toEqual(new Error(expected));
            })
        })
    })

    describe('updateName', () => {

        test('sends help message when --help parameter passed in', async () => {
            // Arrange
            const args = ['somePerson', 'name', '--help'];

            // Act
            return memberHelper.updateName(authorId, args).then((result) => {
                // Assert
                expect(result).toEqual(enums.help.NAME);
            })
        })

        test('Sends string when no name', async () => {
            // Arrange
            const args = ['somePerson', 'name'];
            const expected = `The name for ${args[0]} is ${args[0]}, but you probably knew that!`;

            // Act
            return memberHelper.updateName(authorId, args).then((result) => {
                expect(result).toEqual(expected);
            })
        })

        test('throws error when name is empty', async () => {
            // Arrange
            const args = ['somePerson', 'name', "     "];

            // Act
            return memberHelper.updateName(authorId, args).catch((result) => {
                // Assert
                expect(result).toEqual(new RangeError("Name " + enums.err.NO_VALUE));
            })
        })

        test('throws error when updateMemberField returns error', async () => {
            // Arrange
            const expected = 'update error';
            const args = ['somePerson', "name", "someNewPerson"];
            jest.spyOn(memberHelper, 'updateMemberField').mockImplementation(() => {
                throw new Error(expected)
            });
            // Act
            return memberHelper.updateName(authorId, args).catch((result) => {
                // Assert
                expect(result).toEqual(new Error(expected));
            })
        });

        test('sends string when updateMemberField returns successfully', async () => {
            // Arrange
            const args = ['somePerson', 'name', 'someNewPerson'];
            jest.spyOn(memberHelper, 'updateMemberField').mockResolvedValue("Updated");

            // Act
            return memberHelper.updateName(authorId, args).then((result) => {
                // Assert
                expect(result).toEqual("Updated");
            })
        })
    })

    describe('updateDisplayName', () => {

        test('sends help message when --help parameter passed in', async () => {
            // Arrange
            const args = ['somePerson', 'displayname', '--help'];

            // Act
            return memberHelper.updateDisplayName(authorId, args).then((result) => {
                // Assert
                expect(result).toEqual(enums.help.DISPLAY_NAME);
            })
        })

        test('Sends string of current displayname when no displayname passed in', async () => {
            // Arrange
            const args = ['somePerson', 'displayname'];
            const displayname = "Some Person";
            const member = {
                displayname: displayname,
            }
            jest.spyOn(memberHelper, 'getMemberByName').mockResolvedValue(member);

            // Act
            return memberHelper.updateDisplayName(authorId, args).then((result) => {
                // Assert
                expect(result).toEqual(`Display name for ${args[0]} is: "${member.displayname}".`);
            })
        })
    })

    afterEach(() => {
        // restore the spy created with spyOn
        jest.restoreAllMocks();
    });
})

