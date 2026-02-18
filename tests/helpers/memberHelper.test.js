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


        test.skip.each([
            [['new'], 'new member', memberHelper.addNewMember, [authorId, ['new']]],
            [['remove'], 'remove member', memberHelper.removeMember, [authorId, ['remove']]],
            [['list'], 'all member info', memberHelper.getAllMembersInfo, [authorId, ['list']]],
            [['somePerson', 'name'], 'update name', memberHelper.updateName, [authorId, ['somePerson', 'name']]],
            [['somePerson', 'displayname'], 'update display name', memberHelper.updateDisplayName, [authorId, ['somePerson', 'displayname']]],
            [['somePerson', 'proxy'], 'get proxy', memberHelper.getProxyByMember, [authorId, 'somePerson']],
            [['somePerson', 'proxy', 'test'], 'update proxy', memberHelper.updateProxy, [authorId, ['somePerson', 'proxy', 'test']]],
            [['somePerson', 'propic'], 'update propic', memberHelper.updatePropic, [authorId, ['somePerson', 'propic']]],
            [['somePerson'], 'member info', getMemberInfoMock, [authorId, 'somePerson']],
        ])('%s returns correct values', async (args, expectedResult, method, passedIn) => {
            // Arrange
            console.log(method)
            // Act
            return memberHelper.parseMemberCommand(authorId, authorFull, args).then((result) => {
                expect(result).toEqual(expectedResult);
                expect(method).toHaveBeenCalledTimes(1);
                expect(method).toHaveBeenCalledWith(passedIn)
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

