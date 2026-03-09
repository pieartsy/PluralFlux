const env = require('dotenv');
env.config();


jest.mock('../../src/repositories/memberRepo.js', () => {
    return {
        memberRepo: {
            getMembersByAuthor: jest.fn()
        }
    }
})

const {messageHelper} = require("../../src/helpers/messageHelper.js");
const {memberRepo} = require("../../src/repositories/memberRepo");

describe('messageHelper', () => {

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    })

    describe('parseCommandArgs', () => {
        test.each([
            ['pf;member', ['']],
            ['pf;member add somePerson "Some Person"', ['add', 'somePerson', 'Some Person']],
            ['pf;member add \"Some Person\"', ['add', 'Some Person']],
            ['pf;member add somePerson \'Some Person\'', ['add', 'somePerson', 'Some Person']],
            ['pf;member add somePerson \"\'Some\' Person\"', ['add', 'somePerson', 'Some Person']],
        ])('%s returns correct arguments', (content, expected) => {
            // Arrange
            const command = "member";
            const result = messageHelper.parseCommandArgs(content, command);
            expect(result).toEqual(expected);
        })
    })

    describe(`parseProxyTags`, () => {
        const membersFor1 = [
            {name: "somePerson", proxy: "--text"},
            {name: "someSecondPerson", proxy: undefined},
            {name: "someOtherPerson", proxy: "?text}"},
            {name: "someLastPerson", proxy: "{text}"},
            {name: "someEmojiPerson", proxy: "⭐text"},
            {name: "someSpacePerson", proxy: "! text"},
        ]

        const membersFor2 = []

        const membersFor3 = [
            {name: "someOtherThirdPerson", proxy: undefined}
        ]

        const attachmentUrl = "../oya.png"

        beforeEach(() => {
            memberRepo.getMembersByAuthor = jest.fn().mockImplementation((specificAuthorId) => {
                if (specificAuthorId === "1") return membersFor1;
                if (specificAuthorId === "2") return membersFor2;
                if (specificAuthorId === "3") return membersFor3;
            })
        });

        test.each([
            ['1', 'hello', null, {}],
            ['1', '--hello', null, {member: membersFor1[0], message: 'hello', hasAttachment: false}],
            ['1', 'hello', attachmentUrl, {}],
            ['1', '--hello', attachmentUrl, {member: membersFor1[0], message: 'hello', hasAttachment: true}],
            ['1', '--', attachmentUrl, {member: membersFor1[0], message: '', hasAttachment: true}],
            ['1', '?hello}', null, {member: membersFor1[2], message: 'hello', hasAttachment: false}],
            ['1', '{hello}', null, {member: membersFor1[3], message: 'hello', hasAttachment: false}],
            ['1', '⭐hello', null, {member: membersFor1[4], message: 'hello', hasAttachment: false}],
            ['1', '! hello', null, {member: membersFor1[5], message: 'hello', hasAttachment: false}],
            ['2', 'hello', null, undefined],
            ['2', '--hello', null, undefined],
            ['2', 'hello', attachmentUrl, undefined],
            ['2', '--hello', attachmentUrl, undefined],
            ['3', 'hello', null, {}],
            ['3', '--hello', null, {}],
            ['3', 'hello', attachmentUrl, {}],
            ['3', '--hello', attachmentUrl, {}],
        ])('ID %s with string %s returns correct proxy', async (specificAuthorId, content, attachmentUrl, expected) => {
            // Act
            const res = await messageHelper.parseProxyTags(specificAuthorId, content, attachmentUrl);
            // Assert
            expect(res).toEqual(expected);
        });
    })

    describe('returnBufferFromText', () => {
        const charas2000 = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

        test('returns truncated text and buffer file when text is more than 2000 characters', () => {
            // Arrange

            const charasOver2000 = "bbbbb"
            const expectedBuffer = Buffer.from(charasOver2000, 'utf-8');
            const expected = {text: charas2000, file: expectedBuffer};

            // Act
            const result = messageHelper.returnBufferFromText(`${charas2000}${charasOver2000}`);

            // Assert
            expect(result).toEqual(expected);
        })

        test('returns text when text is 2000 characters or less', () => {
            // Arrange
            const expected = {text: charas2000, file: undefined};
            // Act
            const result = messageHelper.returnBufferFromText(`${charas2000}`);
            // Assert
            expect(result).toEqual(expected);
        })
    })

    afterEach(() => {
        // restore the spy created with spyOn
        jest.restoreAllMocks();
    });
})