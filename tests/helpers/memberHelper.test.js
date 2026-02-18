import {jest} from "@jest/globals";

jest.mock('@fluxerjs/core', () => jest.fn());
jest.mock('../../src/db.js', () => jest.fn());
jest.mock('sequelize', () => jest.fn());

const {EmbedBuilder} = await import ("@fluxerjs/core");
const {database} = await import('../../src/db.js');
const {EmptyResultError, Op} = await import ('sequelize');
import {enums} from "../../src/enums.js";
import {memberHelper} from "../../src/helpers/memberHelper.js";

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
            [['list'], 'all member info', 'getAllMembersInfo', ['list']],
            [['somePerson', 'name'], 'update name', 'updateName', ['somePerson', 'name']],
            [['somePerson', 'displayname'], 'update display name', 'updateDisplayName', ['somePerson', 'displayname']],
            [['somePerson', 'proxy'], 'get proxy', 'getProxyByMember', ['somePerson']],
            [['somePerson', 'proxy', 'test'], 'update proxy', 'updateProxy', ['somePerson', 'proxy', 'test']],
            [['somePerson', 'propic'], 'update propic', 'updatePropic', ['somePerson', 'propic']],
            [['somePerson'], 'member info', 'getMemberInfo', 'somePerson'],
        ])('%s returns correct values and calls methods', async (args, expectedResult, method, passedIn) => {
            return memberHelper.parseMemberCommand(authorId, authorFull, args).then((result) => {
                expect(result).toEqual(expectedResult);
                expect(memberHelper[method]).toHaveBeenCalledTimes(1);
                expect(memberHelper[method]).toHaveBeenCalledWith(authorId, passedIn)
            });
        });

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


        afterEach(() => {
            // restore the spy created with spyOn
            jest.restoreAllMocks();
        });
    })
})

