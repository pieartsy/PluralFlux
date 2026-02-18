jest.mock('@fluxerjs/core', () => jest.fn());
jest.mock('../../src/db.js', () => jest.fn());
jest.mock('sequelize', () => jest.fn());

const {EmbedBuilder} = require("@fluxerjs/core");
const {database} = require('../../src/db.js');
const {enums} = require('../../src/enums.js');
const {EmptyResultError, Op} = require('sequelize');
const {memberHelper} = require("../../src/helpers/memberHelper.js");

describe('MemberHelper', () => {
    const authorId = "0001";
    const authorFull = "author#0001";
    const attachmentUrl = "../oya.png";
    const attachmentExpiration = new Date('2026-01-01T00.00.00.0000Z')


    describe('parseMemberCommand', () => {

        beforeEach(() => {
            jest.resetModules();
            jest.clearAllMocks();
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
        ])('%s returns correct values and calls methods', async (args, expectedResult, method, passedIn) => {
            return memberHelper.parseMemberCommand(authorId, authorFull, args).then((result) => {
                expect(result).toEqual(expectedResult);
                expect(memberHelper[method]).toHaveBeenCalledTimes(1);
                expect(memberHelper[method]).toHaveBeenCalledWith(authorId, passedIn)
            });
        });

        test('["somePerson", "propic"] returns correct values and calls methods', () => {
            // arrange
            const args = ['somePerson', 'propic'];
            // act & assert
            return memberHelper.parseMemberCommand(authorId, authorFull, args, attachmentUrl, attachmentExpiration).then((result) => {
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
            memberHelper.parseMemberCommand(authorId, authorFull, args).then((result) => {
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
            ])('%s returns correct values and calls methods', async (args, expectedError, method, passedIn) => {
                memberHelper.parseMemberCommand(authorId, authorFull, args).catch((result) => {
                    expect(result).toEqual(new Error(expectedError));
                    expect(memberHelper[method]).toHaveBeenCalledTimes(1);
                    expect(memberHelper[method]).toHaveBeenCalledWith(authorId, passedIn)
                });
            });
        })



        afterEach(() => {
            // restore the spy created with spyOn
            jest.restoreAllMocks();
        });
    })
})

