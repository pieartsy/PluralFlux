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
    // let memberHelper = {}
    const authorId = "0001";
    const authorFull = "author#0001";
    const attachmentUrl = "../oya.png";
    const attachmentExpiration = new Date('2026-01-01T00.00.00.0000Z')

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    })

    describe(`parseProxyTags`, () => {
        const membersFor1 = [
            {name: "somePerson", proxy: "--text"},
            {name: "someSecondPerson", proxy: undefined}
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
            ['1', '--hello', null, {member: membersFor1[0], message: 'hello'}],
            ['1', 'hello', attachmentUrl, {}],
            ['1', '--hello', attachmentUrl, {member: membersFor1[0], message: 'hello', hasAttachment: true}],
            ['1', '--', attachmentUrl, {member: membersFor1[0], message: '', hasAttachment: true}],
            ['2', 'hello', null, undefined],
            ['2', '--hello', null, undefined],
            ['2', 'hello', attachmentUrl, undefined],
            ['2', '--hello', attachmentUrl,undefined],
            ['3', 'hello', null, {}],
            ['3', '--hello', null, {}],
            ['3', 'hello', attachmentUrl, {}],
            ['3', '--hello', attachmentUrl,{}],
        ])('Member %s returns correct proxy', (specificAuthorId, content, attachmentUrl, expected) => {
            messageHelper.parseProxyTags(specificAuthorId, content, attachmentUrl).then((res) => {
                expect(res).toEqual(expected);
            })
        });


    })

    describe('parseCommandArgs', () => {

    })

    afterEach(() => {
        // restore the spy created with spyOn
        jest.restoreAllMocks();
    });
})