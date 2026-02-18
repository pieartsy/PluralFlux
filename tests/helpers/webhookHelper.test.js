jest.mock('../../src/helpers/messageHelper.js')
jest.mock('@fluxerjs/core', () => jest.fn());

const {messageHelper} = require("../../src/helpers/messageHelper.js");
const {Message, Webhook, Channel} = require("@fluxerjs/core");
const {webhookHelper} = require("../../src/helpers/webhookHelper.js");

describe('webhookHelper', () => {
    const authorId = "0001";
    const authorFull = "author#0001";
    const attachmentUrl = "../oya.png";
    const attachmentExpiration = new Date('2026-01-01T00.00.00.0000Z')

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    })

    describe(`sendMessageAsMember`, () => {

    })

    afterEach(() => {
        // restore the spy created with spyOn
        jest.restoreAllMocks();
    });
})