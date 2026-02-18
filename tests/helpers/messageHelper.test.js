jest.mock('../../src/helpers/memberHelper.js')
jest.mock('tmp');
jest.mock('fs');
jest.mock('@fluxerjs/core', () => jest.fn());

const {memberHelper} = require("../../src/helpers/memberHelper.js");
const {Message} = require("@fluxerjs/core");
const {fs} = require('fs');
const {enums} = require('../../src/enums');
const {tmp, setGracefulCleanup} = require('tmp');
const {messageHelper} = require("../../src/helpers/memberHelper.js");
const {describe} = require("pm2");

describe('messageHelper', () => {
    const authorId = "0001";
    const authorFull = "author#0001";
    const attachmentUrl = "../oya.png";
    const attachmentExpiration = new Date('2026-01-01T00.00.00.0000Z')

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    })

    describe(`parseProxyTags`, () => {

    })

    afterEach(() => {
        // restore the spy created with spyOn
        jest.restoreAllMocks();
    });
})