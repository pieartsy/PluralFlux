const {enums} = require("../../src/enums");

const fetchMock = require('jest-fetch-mock');
fetchMock.enableMocks();

const {utils} = require("../../src/helpers/utils.js");

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