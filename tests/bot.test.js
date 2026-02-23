const { Client, Events } = require('@fluxerjs/core');
const { messageHelper } = require("../src/helpers/messageHelper.js");
const {enums} = require("../src/enums.js");
const {commands} = require("../src/commands.js");
const {webhookHelper} = require("../src/helpers/webhookHelper.js");
const env = require('dotenv');
const {utils} = require("../src/helpers/utils.js");

env.config();

describe('bot', () => {

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    })

    afterEach(() => {
        // restore the spy created with spyOn
        jest.restoreAllMocks();
    });
})