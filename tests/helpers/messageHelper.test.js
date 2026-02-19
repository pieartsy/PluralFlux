const env = require('dotenv');
env.config();

const {memberHelper} = require("../../src/helpers/memberHelper.js");
const {Message} = require("@fluxerjs/core");
const {fs} = require('fs');
const {enums} = require('../../src/enums');
const {tmp, setGracefulCleanup} = require('tmp');

jest.mock('../../src/helpers/memberHelper.js', () => {
    return {memberHelper: {
        getMembersByAuthor: jest.fn()
    }}
})

jest.mock('tmp');
jest.mock('fs');
jest.mock('@fluxerjs/core');

const {messageHelper} = require("../../src/helpers/messageHelper.js");

describe('messageHelper', () => {

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    })

    describe('parseCommandArgs', () => {
        test.each([
            ['pk;member', ['']],
            ['pk;member add somePerson "Some Person"', ['add', 'somePerson', 'Some Person']],
            ['pk;member add \"Some Person\"', ['add', 'Some Person']],
            ['pk;member add somePerson \'Some Person\'', ['add', 'somePerson', 'Some Person']],
            ['pk;member add somePerson \"\'Some\' Person\"', ['add', 'somePerson', 'Some Person']],
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
,           {name: "someOtherPerson", proxy: "?text}"},
            {name: "someLastPerson", proxy: "{text}"},
            {name: "someEmojiPerson", proxy: "⭐text"},
        ]

        const membersFor2 = []

        const membersFor3 = [
            {name: "someOtherThirdPerson", proxy: undefined}
        ]

        const attachmentUrl = "../oya.png"

        beforeEach(() => {
            memberHelper.getMembersByAuthor = jest.fn().mockImplementation((specificAuthorId) => {
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
            ['1', '?hello}', null, {member: membersFor1[3], message: 'hello', hasAttachment: false}],
            ['1', '{hello}', null, {member: membersFor1[4], message: 'hello', hasAttachment: false}],
            ['1', '⭐hello', null, {member: membersFor1[5], message: 'hello', hasAttachment: false}],
            ['2', 'hello', null, undefined],
            ['2', '--hello', null, undefined],
            ['2', 'hello', attachmentUrl, undefined],
            ['2', '--hello', attachmentUrl,undefined],
            ['3', 'hello', null, {}],
            ['3', '--hello', null, {}],
            ['3', 'hello', attachmentUrl, {}],
            ['3', '--hello', attachmentUrl,{}],
        ])('ID %s with string %s returns correct proxy', async(specificAuthorId, content, attachmentUrl, expected) => {
            // Act
            return messageHelper.parseProxyTags(specificAuthorId, content, attachmentUrl).then((res) => {
                // Assert
                expect(res).toEqual(expected);
            })
        });

        test('expect error to be thrown when no message is present', () => {
            // Act
            return messageHelper.parseProxyTags('1', '', null).catch((res) => {
                // Assert
                expect(res).toEqual(new Error(enums.err.NO_MESSAGE_SENT_WITH_PROXY));
            })
        })
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