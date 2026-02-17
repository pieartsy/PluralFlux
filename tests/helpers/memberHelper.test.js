import {jest} from "@jest/globals";

jest.unstable_mockModule('@fluxerjs/core', () => jest.fn());
jest.unstable_mockModule('../../src/db.js', () => jest.fn());
jest.unstable_mockModule('sequelize', () => jest.fn());

const { EmbedBuilder } = await import ("@fluxerjs/core");
const { database } = await import('../../src/db.js');
const { EmptyResultError, Op } = await import ('sequelize');
import { enums } from "../../src/enums.js";
import { memberHelper } from "../../src/helpers/memberHelper.js";

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
        jest.spyOn(memberHelper, 'getProxyByMember').mockResolvedValue("update proxy");
    });


    test.each([
        [['--help'], enums.help.MEMBER],
        [['new'], 'new member'],
        [['remove'], 'remove member'],
        [['name'], enums.help.NAME],
        [['displayname'], enums.help.DISPLAY_NAME],
        [['proxy'], enums.help.PROXY],
        [['propic'], enums.help.PROPIC],
        [['list'], 'all member info'],
        [[''], enums.help.MEMBER],
        [['somePerson', 'new'], enums.help.NEW],
        [['somePerson', 'name'], 'update name'],
        [['somePerson', 'displayname'], 'update display name'],
        [['somePerson', 'proxy'], 'update proxy'],
        [['somePerson', 'propic'], 'update propic'],
        [['somePerson'], 'member info'],
    ])('%s returns correct values', async(args, expectedResult) => {
        // Arrange
        const authorId = '1';
        const authorFull = 'somePerson#0001';
        // Act
        const result = await memberHelper.parseMemberCommand(authorId, authorFull, args);
        //
        expect(result).toEqual(expectedResult);
    });

    afterEach(() => {
        // restore the spy created with spyOn
        jest.restoreAllMocks();
    });
})

