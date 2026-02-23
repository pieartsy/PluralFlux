jest.mock('../../src/helpers/messageHelper.js')

const {messageHelper} = require("../../src/helpers/messageHelper.js");

jest.mock('../../src/helpers/messageHelper.js', () => {
    return {messageHelper: {
            parseProxyTags: jest.fn(),
            returnBuffer: jest.fn(),
            returnBufferFromText: jest.fn(),
        }}
})
const {enums} = require("../../src/enums");
const {webhookHelper} = require("../../src/helpers/utils.js");


describe('utils', () => {

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    })

    afterEach(() => {
        // restore the spy created with spyOn
        jest.restoreAllMocks();
    });
})