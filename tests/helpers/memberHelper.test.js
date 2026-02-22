const {EmbedBuilder} = require("@fluxerjs/core");
const {database} = require('../../src/database.js');
const {enums} = require('../../src/enums.js');
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
            jest.spyOn(memberHelper, 'getMemberByName').mockResolvedValue(mockMember);
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
            [['new', 'somePerson'], attachmentUrl],
            [['new', 'somePerson'], null,]
        ])('%s calls addNewMember and returns correct values', async(args, attachmentUrl) => {
            // Act
            return memberHelper.parseMemberCommand(authorId, authorFull, args, attachmentUrl).then((result) => {
                // Assert
                expect(result).toEqual("new member");
                expect(memberHelper.addNewMember).toHaveBeenCalledTimes(1);
                expect(memberHelper.addNewMember).toHaveBeenCalledWith(authorId, args, attachmentUrl);
            });
        })

        test('["remove", "somePerson"] calls removeMember with authorId and "somePerson" and returns expected result', async() => {
            // Act
            return memberHelper.parseMemberCommand(authorId, authorFull, ["remove", "somePerson"]).then((result) => {
                // Assert
                expect(result).toEqual("remove member");
                expect(memberHelper.removeMember).toHaveBeenCalledTimes(1);
                expect(memberHelper.removeMember).toHaveBeenCalledWith(authorId, "somePerson");
            });
        });

        test('["list"] calls getAllMembersInfo and returns expected result', async () => {
            // Act
            return memberHelper.parseMemberCommand(authorId, authorFull, ["list"]).then((result) => {
                // Assert
                expect(result).toEqual("all member info");
                expect(memberHelper.getAllMembersInfo).toHaveBeenCalledTimes(1);
                expect(memberHelper.getAllMembersInfo).toHaveBeenCalledWith(authorId, authorFull);
            });
        });

        test.each([
            [['--help']],
            [['']],
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
            [['somePerson', 'name', 'newPerson'], "updateName", "update name"],
            [['somePerson', 'displayname', 'Some Person'], "updateDisplayName", "update display name"],
            [['somePerson', 'proxy', '--text'], "updateProxy", "update proxy"],
        ])('%s calls %s returns expected result %s', async (args, method, expectedResult) => {
            // Act
            return memberHelper.parseMemberCommand(authorId, authorFull, args).then((result) => {
                // Assert
                expect(result).toEqual(expectedResult);
                expect(memberHelper[method]).toHaveBeenCalledTimes(1);
                expect(memberHelper[method]).toHaveBeenCalledWith(authorId, args[0], args[2]);
            });
        });

        test.each([
            [["somePerson", "propic", attachmentUrl], null, null],
            [["somePerson", "propic", null], 'ono.png', attachmentExpiration],
        ])('%s calls updatePropic and returns expected values', async (args, attachmentUrl, attachmentExpiration) => {
            // Act
            return memberHelper.parseMemberCommand(authorId, authorFull, args, attachmentUrl, attachmentExpiration).then((result) => {
                // Assert
                expect(result).toEqual("update propic");
                expect(memberHelper['updatePropic']).toHaveBeenCalledTimes(1);
                expect(memberHelper['updatePropic']).toHaveBeenCalledWith(authorId, args[0], args[2], attachmentUrl, attachmentExpiration)
            });
        })

        test('any non-command returns getMemberInfo', async() => {
            // Act
            return memberHelper.parseMemberCommand(authorId, authorFull, ['somePerson']).then(() => {
                // Assert
                expect(memberHelper['getMemberInfo']).toHaveBeenCalledTimes(1);
                expect(memberHelper['getMemberInfo']).toHaveBeenCalledWith(authorId, mockMember);
            })
        })

        test.each([
            [['new'], "addNewMember", enums.help.NEW],
            [['new', '--help'], "addNewMember", enums.help.NEW],
            [['remove'], "removeMember", enums.help.REMOVE],
            [['remove', '--help'], "removeMember", enums.help.REMOVE],
            [['name'], "updateName", enums.help.NAME],
            [['name', '--help'], "updateName", enums.help.NAME],
            [['somePerson', 'name'], "updateName", mockMember.name],
            [['displayname'], "updateDisplayName", enums.help.DISPLAY_NAME],
            [['displayname', '--help'], "updateDisplayName", enums.help.DISPLAY_NAME],
            [['somePerson', 'displayname'], "updateDisplayName", mockMember.displayname],
            [['proxy'], "updateProxy", enums.help.PROXY],
            [['proxy', '--help'], "updateProxy", enums.help.PROXY],
            [['somePerson', 'proxy'], "updateProxy", mockMember.proxy],
            [['propic'], "updatePropic", enums.help.PROPIC],
            [['propic', '--help'], "updatePropic", enums.help.PROPIC],
            [['somePerson', 'propic'], "updatePropic", mockMember.propic],
            [['list', '--help'], "getAllMembersInfo", enums.help.LIST],
        ])('%s shall not call %s and returns correct string', async (args, method, expectedResult) => {
            // Act
            return memberHelper.parseMemberCommand(authorId, authorFull, args).then((result) => {
                // Assert
                expect(result).toEqual(expectedResult);
                expect(memberHelper[method]).not.toHaveBeenCalled();
            });
        });

        test.each([
            [['somePerson', 'displayname'], "updateDisplayName", "Display name"],
            [['somePerson', 'proxy'], "updateProxy", "Proxy"],
            [['somePerson', 'propic'], "updatePropic", "Profile picture"],
        ])('if value not set, %s shall not call %s and returns value error', async (args, method, expectedResult) => {
            // Arrange
            const mockEmptyMember = {
                name: "somePerson",
                displayname: null,
                proxy: null,
                propic: null,
            }
            jest.spyOn(memberHelper, 'getMemberByName').mockResolvedValue(mockEmptyMember);
            // Act
            return memberHelper.parseMemberCommand(authorId, authorFull, args).then((result) => {
                // Assert
                expect(result).toEqual(`${expectedResult} ${enums.err.NO_VALUE}`);
                expect(memberHelper[method]).not.toHaveBeenCalled();
            });
        });
    })

    describe('addNewMember', () => {

        test('returns help if --help passed in', async () => {
            // Arrange
            const args = ['new', '--help'];
            const expected = enums.help.NEW;
            //Act
            return memberHelper.addNewMember(authorId, args).then((result) => {
                // Assert
                expect(result).toEqual(expected);
            })
        })

        test('calls getMemberInfo when successful and returns result', async () => {
            // Arrange
            const args = ['new', 'some person'];
            const memberObject = {name: args[1]}
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

        test('throws expected error when getMemberInfo throws error', async () => {
            // Arrange
            const args = ['new', 'some person'];
            const memberObject = {name: args[1]}
            jest.spyOn(memberHelper, 'addFullMember').mockResolvedValue(memberObject);
            jest.spyOn(memberHelper, 'getMemberInfo').mockImplementation(() => {
                throw new Error('getMemberInfo error')
            });
            //Act
            return memberHelper.addNewMember(authorId, args).catch((result) => {
                // Assert
                expect(result).toEqual(new Error('getMemberInfo error'));
            })
        })

        test('throws expected error when addFullMember throws error', async () => {
            // Arrange
            const args = ['new', 'somePerson'];
            const expected = 'add full member error';
            jest.spyOn(memberHelper, 'addFullMember').mockImplementation(() => {
                throw new Error(expected)
            });

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

        test('call updateMemberField with correct arguments when displayname passed in correctly', async () => {
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
        beforeEach(() => {
            database.members.create = jest.fn().mockResolvedValue();
            jest.spyOn(memberHelper, 'getMemberByName').mockResolvedValue();
        })

        test('calls getMemberByName', async () => {
            // Act
            return await memberHelper.addFullMember(authorId, memberName).then(() => {
                // Assert
                expect(memberHelper.getMemberByName).toHaveBeenCalledWith(authorId, memberName);
                expect(memberHelper.getMemberByName).toHaveBeenCalledTimes(1);
            })
        })

        test('if getMemberByName returns member, throw error', async () => {
            memberHelper.getMemberByName.mockResolvedValue({name: memberName});
            // Act
            return await memberHelper.addFullMember(authorId, memberName).catch((e) => {
                // Assert
                expect(e).toEqual(new Error(`Can't add ${memberName}. ${enums.err.MEMBER_EXISTS}`))
                expect(database.members.create).not.toHaveBeenCalled();
            })
        })

        test('if displayname is over 32 characters, call database.member.create with null value', async () => {
            // Arrange
            const displayName = "Some person with a very very very long name that can't be processed";
            const expectedMemberArgs = {
                name: memberName,
                userid: authorId,
                displayname: null,
                proxy: null,
                propic: null
            }
            database.members.create = jest.fn().mockResolvedValue(expectedMemberArgs);
            const expectedReturn = {
                member: expectedMemberArgs,
                errors: [`Tried to set displayname to \"${displayName}\". ${enums.err.DISPLAY_NAME_TOO_LONG}. ${enums.err.SET_TO_NULL}`]
            }

            // Act
            return await memberHelper.addFullMember(authorId, memberName, displayName, null, null).then((res) => {
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
                name: memberName,
                userid: authorId,
                displayname: null,
                proxy: proxy,
                propic: null
            }
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

        test('if checkProxyExists throws error, call database.member.create with null value', async () => {
            // Arrange
            jest.spyOn(memberHelper, 'checkIfProxyExists').mockImplementation(() => {
                throw new Error('error')
            });
            const expectedMemberArgs = {
                name: memberName,
                userid: authorId,
                displayname: null,
                proxy: null,
                propic: null
            }
            database.members.create = jest.fn().mockResolvedValue(expectedMemberArgs);
            const expectedReturn = {
                member: expectedMemberArgs,
                errors: [`Tried to set proxy to \"${proxy}\". error. ${enums.err.SET_TO_NULL}`]
            }

            // Act
            return await memberHelper.addFullMember(authorId, memberName, null, proxy, null).then((res) => {
                // Assert
                expect(res).toEqual(expectedReturn);
                expect(database.members.create).toHaveBeenCalledWith(expectedMemberArgs);
                expect(database.members.create).toHaveBeenCalledTimes(1);
            })
        })

        test('if propic, call checkImageFormatValidity', async () => {
            // Arrange
            jest.spyOn(memberHelper, 'checkImageFormatValidity').mockResolvedValue();
            const expectedMemberArgs = {
                name: memberName,
                userid: authorId,
                displayname: null,
                proxy: null,
                propic: propic
            }
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

        test('if checkImageFormatValidity throws error, call database.member.create with null value', async () => {
            // Arrange
            jest.spyOn(memberHelper, 'checkImageFormatValidity').mockImplementation(() => {
                throw new Error('error')
            });
            const expectedMemberArgs = {
                name: memberName,
                userid: authorId,
                displayname: null,
                proxy: null,
                propic: null
            }
            database.members.create = jest.fn().mockResolvedValue(expectedMemberArgs);
            const expectedReturn = {
                member: expectedMemberArgs,
                errors: [`Tried to set profile picture to \"${propic}\". error. ${enums.err.SET_TO_NULL}`]
            }
            // Act
            return await memberHelper.addFullMember(authorId, memberName, null, null, propic).then((res) => {
                // Assert
                expect(res).toEqual(expectedReturn);
                expect(database.members.create).toHaveBeenCalledWith(expectedMemberArgs);
                expect(database.members.create).toHaveBeenCalledTimes(1);
            })
        })

        test('if all values are valid, call database.members.create', async () => {
            // Arrange
            jest.spyOn(memberHelper, 'checkIfProxyExists').mockResolvedValue();
            jest.spyOn(memberHelper, 'checkImageFormatValidity').mockResolvedValue();
            const expectedMemberArgs = {
                name: memberName,
                userid: authorId,
                displayname: displayName,
                proxy: proxy,
                propic: propic
            }
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

