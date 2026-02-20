const {EmbedBuilder} = require("@fluxerjs/core");
const {database} = require('../../src/database.js');
const {enums} = require('../../src/enums.js');
const {EmptyResultError, Op} = require('sequelize');
const {memberHelper} = require("../../src/helpers/memberHelper.js");

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

jest.mock('sequelize', () => jest.fn());

describe('MemberHelper', () => {
    const authorId = "0001";
    const authorFull = "author#0001";
    const attachmentUrl = "../oya.png";
    const attachmentExpiration = new Date('2026-01-01T00.00.00.0000Z')
    const member = {
        name: "somePerson",
        displayname: "Some Person",
        proxy: "--text",
        propic: "oya.png"
    }
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        jest.spyOn(memberHelper, 'getMemberByName').mockResolvedValue(member);
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

            jest.spyOn(memberHelper, 'getMemberCommandInfo').mockResolvedValue("member command info");
        });

        test.each([
            [['remove'], 'remove member', 'removeMember', ['remove']],
            [['list'], 'all member info', 'getAllMembersInfo', authorFull],
            [['somePerson', 'name'], 'update name', 'updateName', ['somePerson', 'name']],
            [['somePerson', 'displayname'], 'update display name', 'updateDisplayName', ['somePerson', 'displayname']],
            [['somePerson', 'proxy'], 'get proxy', 'getProxyByMember', 'somePerson'],
            [['somePerson', 'proxy', 'test'], 'update proxy', 'updateProxy', ['somePerson', 'proxy', 'test']],
            [['somePerson'], 'member info', 'getMemberInfo', 'somePerson'],
        ])('%s calls %s and returns correct values', async (args, expectedResult, method, passedIn) => {
            // Act
            return memberHelper.parseMemberCommand(authorId, authorFull, args).then((result) => {
                // Assert
                expect(result).toEqual(expectedResult);
                expect(memberHelper[method]).toHaveBeenCalledTimes(1);
                expect(memberHelper[method]).toHaveBeenCalledWith(authorId, passedIn)
            });
        });


        test.each([
            [['new'], attachmentUrl],
            [['new'], null,]
        ])('%s returns correct values and calls addNewMember', (args, attachmentUrl) => {
            // Act
            return memberHelper.parseMemberCommand(authorId, authorFull, args, attachmentUrl).then((result) => {
                // Assert
                expect(result).toEqual("new member");
                expect(memberHelper.addNewMember).toHaveBeenCalledTimes(1);
                expect(memberHelper.addNewMember).toHaveBeenCalledWith(authorId, args, attachmentUrl);
            });
        })

        test('["somePerson", "propic"] returns correct values and updatePropic', () => {
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

            test.each([
                [['new'], attachmentUrl],
                [['new'], null,]
            ])('%s throws correct error when addNewMember returns error', (args, attachmentUrl) => {
                // Act
                return memberHelper.parseMemberCommand(authorId, authorFull, args, attachmentUrl).catch((result) => {
                    // Assert
                    expect(result).toEqual(new Error("new member error"));
                    expect(memberHelper.addNewMember).toHaveBeenCalledTimes(1);
                    expect(memberHelper.addNewMember).toHaveBeenCalledWith(authorId, args, attachmentUrl);
                });
            })

            test('["somePerson", "propic"] throws correct error when updatePropic returns error', () => {
                // Arrange
                const args = ['somePerson', 'propic'];
                // Act
                return memberHelper.parseMemberCommand(authorId, authorFull, args, attachmentUrl, attachmentExpiration).catch((result) => {
                    // Assert
                    expect(result).toEqual(new Error("update propic error"));
                    expect(memberHelper['updatePropic']).toHaveBeenCalledTimes(1);
                    expect(memberHelper['updatePropic']).toHaveBeenCalledWith(authorId, args, attachmentUrl, attachmentExpiration)
                });
            })
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

        test('calls getMemberInfo when successful and returns result',  async () => {
            // Arrange
            const args = ['new', 'some person'];
            const memberObject = { name: args[1] }
            jest.spyOn(memberHelper, 'addFullMember').mockResolvedValue(memberObject);
            jest.spyOn(memberHelper, 'getMemberInfo').mockResolvedValue(memberObject);
            //Act
            return memberHelper.addNewMember(authorId, args).then((result) => {
                // Assert
                expect(result).toEqual(memberObject);
                expect(memberHelper.getMemberInfo).toHaveBeenCalledTimes(1);
                expect(memberHelper.getMemberInfo).toHaveBeenCalledWith(authorId, args[1]);
            })
        })

        test('throws expected error when getMemberInfo throws error',  async () => {
            // Arrange
            const args = ['new', 'some person'];
            const memberObject = { name: args[1] }
            jest.spyOn(memberHelper, 'addFullMember').mockResolvedValue(memberObject);
            jest.spyOn(memberHelper, 'getMemberInfo').mockImplementation(() => { throw new Error('getMemberInfo error') });
            //Act
            return memberHelper.addNewMember(authorId, args).catch((result) => {
                // Assert
                expect(result).toEqual(new Error('getMemberInfo error'));
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
            jest.spyOn(memberHelper, 'updateMemberField').mockResolvedValue();
            // Act
            return memberHelper.updateDisplayName(authorId, args).then((result) => {
                // Assert
                expect(result).toEqual(enums.help.DISPLAY_NAME);
                expect(memberHelper.updateMemberField).not.toHaveBeenCalled();
            })
        })

        test('Sends string of current displayname when it exists and no displayname passed in', async () => {
            // Arrange
            const args = ['somePerson', 'displayname'];
            const displayname = "Some Person";
            const member = {
                displayname: displayname,
            }
            jest.spyOn(memberHelper, 'getMemberByName').mockResolvedValue(member);
            jest.spyOn(memberHelper, 'updateMemberField').mockResolvedValue();
            // Act
            return memberHelper.updateDisplayName(authorId, args).then((result) => {
                // Assert
                expect(result).toEqual(`Display name for ${args[0]} is: "${member.displayname}".`);
                expect(memberHelper.updateMemberField).not.toHaveBeenCalled();
            })
        })

        test('Sends error when no displayname passed in', async () => {
            // Arrange
            const args = ['somePerson', 'displayname'];
            const member = {}
            jest.spyOn(memberHelper, 'getMemberByName').mockResolvedValue(member);
            jest.spyOn(memberHelper, 'updateMemberField').mockResolvedValue();
            // Act
            return memberHelper.updateDisplayName(authorId, args).catch((result) => {
                // Assert
                expect(result).toEqual(new Error(`Display name ${enums.err.NO_VALUE}`));
                expect(memberHelper.updateMemberField).not.toHaveBeenCalled();
            })
        })

        test('Sends error when display name is too long', async () => {
            // Arrange
            const displayname = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
            const args = ['somePerson', 'displayname', displayname];
            const member = {};
            jest.spyOn(memberHelper, 'getMemberByName').mockResolvedValue(member);
            jest.spyOn(memberHelper, 'updateMemberField').mockResolvedValue();
            // Act
            return memberHelper.updateDisplayName(authorId, args).catch((result) => {
                // Assert
                expect(result).toEqual(new RangeError(enums.err.DISPLAY_NAME_TOO_LONG));
                expect(memberHelper.updateMemberField).not.toHaveBeenCalled();
            })
        })

        test('Sends error when display name is blank', async () => {
            // Arrange
            const displayname = "                  ";
            const args = ['somePerson', 'displayname', displayname];
            const member = {};
            jest.spyOn(memberHelper, 'getMemberByName').mockResolvedValue(member);
            jest.spyOn(memberHelper, 'updateMemberField').mockResolvedValue();
            // Act
            return memberHelper.updateDisplayName(authorId, args).catch((result) => {
                // Assert
                expect(result).toEqual(new Error(`Display name ${enums.err.NO_VALUE}`));
                expect(memberHelper.updateMemberField).not.toHaveBeenCalled();
            })
        })

        test('call updateMemberField with correct arguments when displayname passed in correctly', async() => {
            // Arrange
            const args = ['somePerson', 'displayname', "Some Person"];
            const member = {};
            jest.spyOn(memberHelper, 'updateMemberField').mockResolvedValue(member);
            // Act
            return memberHelper.updateDisplayName(authorId, args).then((result) => {
                // Assert
                expect(memberHelper.updateMemberField).toHaveBeenCalledWith(authorId, args);
                expect(memberHelper.updateMemberField).toHaveBeenCalledTimes(1);
            })
        })
    })

    describe('addFullMember', () => {
        const memberName = "somePerson";
        const displayName = "Some Person";
        const proxy = "--text";
        const propic = "oya.png";
        beforeEach(() => {
            database.members.create = jest.fn().mockResolvedValue();
            jest.spyOn(memberHelper, 'getMemberByName').mockResolvedValue();
        })

        test('calls getMemberByName', async() => {
            // Act
            return await memberHelper.addFullMember(authorId, memberName).then(() => {
                // Assert
                expect(memberHelper.getMemberByName).toHaveBeenCalledWith(authorId, memberName);
                expect(memberHelper.getMemberByName).toHaveBeenCalledTimes(1);
            })
        })

        test('if getMemberByName returns member, throw error', async() => {
            memberHelper.getMemberByName.mockResolvedValue({name: memberName});
            // Act
            return await memberHelper.addFullMember(authorId, memberName).catch((e) => {
                // Assert
                expect(e).toEqual(new Error(`Can't add ${memberName}. ${enums.err.MEMBER_EXISTS}`))
                expect(database.members.create).not.toHaveBeenCalled();
            })
        })

        test('if displayname is over 32 characters, call database.member.create with null value', async() => {
            // Arrange
            const displayName = "Some person with a very very very long name that can't be processed";
            const expectedMemberArgs = {name: memberName, userid: authorId, displayname: null, proxy: null, propic: null}
            database.members.create = jest.fn().mockResolvedValue(expectedMemberArgs);
            const expectedReturn = {member: expectedMemberArgs, errors: [`Tried to set displayname to \"${displayName}\". ${enums.err.DISPLAY_NAME_TOO_LONG}. ${enums.err.SET_TO_NULL}`]}

            // Act
            return await memberHelper.addFullMember(authorId, memberName, displayName, null, null).then((res) => {
                // Assert
                expect(res).toEqual(expectedReturn);
                expect(database.members.create).toHaveBeenCalledWith(expectedMemberArgs);
                expect(database.members.create).toHaveBeenCalledTimes(1);
            })
        })

        test('if proxy, call checkIfProxyExists', async() => {
            // Arrange
            jest.spyOn(memberHelper, 'checkIfProxyExists').mockResolvedValue();
            const expectedMemberArgs = {name: memberName, userid: authorId, displayname: null, proxy: proxy, propic: null}
            database.members.create = jest.fn().mockResolvedValue(expectedMemberArgs);
            const expectedReturn = {member: expectedMemberArgs, errors: []}

            // Act
            return await memberHelper.addFullMember(authorId, memberName, null, proxy).then((res) => {
                // Assert
                expect(res).toEqual(expectedReturn);
                expect(memberHelper.checkIfProxyExists).toHaveBeenCalledWith(authorId, proxy);
                expect(memberHelper.checkIfProxyExists).toHaveBeenCalledTimes(1);
                expect(database.members.create).toHaveBeenCalledWith(expectedMemberArgs);
                expect(database.members.create).toHaveBeenCalledTimes(1);
            })
        })

        test('if checkProxyExists throws error, call database.member.create with null value', async() => {
            // Arrange
            jest.spyOn(memberHelper, 'checkIfProxyExists').mockImplementation(() => {throw new Error('error')});
            const expectedMemberArgs = {name: memberName, userid: authorId, displayname: null, proxy: null, propic: null}
            database.members.create = jest.fn().mockResolvedValue(expectedMemberArgs);
            const expectedReturn = {member: expectedMemberArgs, errors: [`Tried to set proxy to \"${proxy}\". error. ${enums.err.SET_TO_NULL}`]}

            // Act
            return await memberHelper.addFullMember(authorId, memberName, null, proxy, null).then((res) => {
                // Assert
                expect(res).toEqual(expectedReturn);
                expect(database.members.create).toHaveBeenCalledWith(expectedMemberArgs);
                expect(database.members.create).toHaveBeenCalledTimes(1);
            })
        })

        test('if propic, call checkImageFormatValidity', async() => {
            // Arrange
            jest.spyOn(memberHelper, 'checkImageFormatValidity').mockResolvedValue();
            const expectedMemberArgs = {name: memberName, userid: authorId, displayname: null, proxy: null, propic: propic}
            database.members.create = jest.fn().mockResolvedValue(expectedMemberArgs);
            const expectedReturn = {member: expectedMemberArgs, errors: []}
            // Act
            return await memberHelper.addFullMember(authorId, memberName, null, null, propic).then((res) => {
                // Assert
                expect(res).toEqual(expectedReturn);
                expect(memberHelper.checkImageFormatValidity).toHaveBeenCalledWith(propic);
                expect(memberHelper.checkImageFormatValidity).toHaveBeenCalledTimes(1);
                expect(database.members.create).toHaveBeenCalledWith(expectedMemberArgs);
                expect(database.members.create).toHaveBeenCalledTimes(1);
            })
        })

        test('if checkImageFormatValidity throws error, call database.member.create with null value', async() => {
            // Arrange
            jest.spyOn(memberHelper, 'checkImageFormatValidity').mockImplementation(() => {throw new Error('error')});
            const expectedMemberArgs = {name: memberName, userid: authorId, displayname: null, proxy: null, propic: null}
            database.members.create = jest.fn().mockResolvedValue(expectedMemberArgs);
            const expectedReturn = {member: expectedMemberArgs, errors: [`Tried to set profile picture to \"${propic}\". error. ${enums.err.SET_TO_NULL}`]}
            // Act
            return await memberHelper.addFullMember(authorId, memberName, null, null, propic).then((res) => {
                // Assert
                expect(res).toEqual(expectedReturn);
                expect(database.members.create).toHaveBeenCalledWith(expectedMemberArgs);
                expect(database.members.create).toHaveBeenCalledTimes(1);
            })
        })

        test('if all values are valid, call database.members.create', async() => {
            // Arrange
            jest.spyOn(memberHelper, 'checkIfProxyExists').mockResolvedValue();
            jest.spyOn(memberHelper, 'checkImageFormatValidity').mockResolvedValue();
            const expectedMemberArgs = {name: memberName, userid: authorId, displayname: displayName, proxy: proxy, propic: propic}
            database.members.create = jest.fn().mockResolvedValue(expectedMemberArgs);
            const expectedReturn = {member: expectedMemberArgs, errors: []}
            // Act
            // Act
            return await memberHelper.addFullMember(authorId, memberName, displayName, proxy, propic).then((res) => {
                // Assert
                expect(res).toEqual(expectedReturn);
                expect(database.members.create).toHaveBeenCalledWith(expectedMemberArgs);
                expect(database.members.create).toHaveBeenCalledTimes(1);
            })
        })

    })

    afterEach(() => {
        // restore the spy created with spyOn
        jest.restoreAllMocks();
    });
})

