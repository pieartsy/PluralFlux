jest.mock('@fluxerjs/core', () => jest.fn());
jest.mock('../../src/db.js', () => jest.fn());
jest.mock('sequelize', () => jest.fn());
jest.mock('../../src/enums.js', () => ({
    enums: jest.requireActual('../../src/enums.js')
}));

const {enums} = require("../../src/enums.js");
const memberHelper = require("../../src/helpers/memberHelper.js");

describe('parseMemberCommand', () => {
    beforeAll(() => {
        jest.spyOn(memberHelper, 'getMemberInfo').mockReturnValue("member info");
        jest.spyOn(memberHelper, 'addNewMember').mockReturnValue("new member");
        jest.spyOn(memberHelper, 'removeMember').mockReturnValue("remove member");
        jest.spyOn(memberHelper, 'getAllMembersInfo').mockReturnValue("all member info");
        jest.spyOn(memberHelper, 'updateName').mockReturnValue("update name");
        jest.spyOn(memberHelper, 'updateDisplayName').mockReturnValue("update display name");
        jest.spyOn(memberHelper, 'updateProxy').mockReturnValue("update proxy");
        jest.spyOn(memberHelper, 'updatePropic').mockReturnValue("update propic");
    });
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    });


    test.each([
        [['--help'], enums.help.MEMBER],
        [['new'], 'add member'],
        [['remove'], 'remove member'],
        [['name'], enums.help.NAME],
        [['displayname'], enums.help.DISPLAY_NAME],
        [['proxy'], enums.help.PROXY],
        [['propic'], enums.help.PROPIC],
        [['list'], 'all member info'],
        ['', enums.help.MEMBER],
        [['jane', 'new'], enums.help.NEW],
        [['somePerson'] ['name'], 'update name'],
        [['somePerson', 'displayname'], 'update display name'],
        [['somePerson', 'proxy'], 'update proxy'],
        [['somePerson', 'propic'], 'update propic'],
        [['somePerson'], 'member info'],
    ])('returns correct values', async(args, expectedResult) => {
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

