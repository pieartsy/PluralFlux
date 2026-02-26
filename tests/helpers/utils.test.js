const {enums} = require("../../src/enums");

const {utils} = require("../../src/helpers/utils.js");

describe('utils', () => {

    const attachmentUrl = 'oya.png';
    const expirationString = new Date("2026-01-01").toDateString();
    let blob;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        blob = new Blob([JSON.stringify({attachmentUrl: attachmentUrl})], {type: 'image/png'});
        global.fetch = jest.fn(() =>
            Promise.resolve({
                blob: () => Promise.resolve(blob),
            })
        );

    })

    describe('checkImageFormatValidity', () => {

        test('calls fetch with imageUrl and returns true if no errors', async() => {
            // Act
            const res = await utils.checkImageFormatValidity(attachmentUrl);
            // Assert
            expect(res).toBe(true);
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(fetch).toHaveBeenCalledWith(attachmentUrl);
        })

        test('throws error if fetch returns error', async() => {
            // Arrange
            global.fetch = jest.fn().mockRejectedValue(new Error('error'));
            // Act & Assert
            await expect(utils.checkImageFormatValidity(attachmentUrl)).rejects.toThrow(`${enums.err.PROPIC_CANNOT_LOAD}: error`);
        })

        test('throws error if blob returns error', async() => {
            // Arrange
            global.fetch = jest.fn(() =>
                Promise.resolve({
                    blob: () => Promise.reject(new Error('error'))
                }))
            // Act & Assert
            await expect(utils.checkImageFormatValidity(attachmentUrl)).rejects.toThrow('error');
        })

        test('throws error if blob in wrong format', async() => {
            // Arrange
            blob =  new Blob([JSON.stringify({attachmentUrl})], {type: 'text/html'});
            global.fetch = jest.fn(() =>
                Promise.resolve({
                    blob: () => Promise.resolve(blob),
                })
            );
            // Act & Assert
            await expect(utils.checkImageFormatValidity(attachmentUrl)).rejects.toThrow(enums.err.PROPIC_FAILS_REQUIREMENTS);
        })
    })

    describe('setExpirationWarning', () => {
        test('sets warning if image Url starts with Fluxer host', () => {
            // Act
            const result = utils.setExpirationWarning(`${enums.misc.FLUXER_ATTACHMENT_URL}${attachmentUrl}`);
            // Assert
            expect(result).toEqual(enums.misc.ATTACHMENT_EXPIRATION_WARNING);
        })

        test('sets warning if expiration string exists', () => {
            const result = utils.setExpirationWarning(null, expirationString);
            // Assert
            expect(result).toEqual(`${enums.misc.ATTACHMENT_EXPIRATION_WARNING}. Expiration date: *${expirationString}*.`);
        })

       test('returns null if img url does not start iwth fluxer host and no expiration', () => {
           // Act
           const result = utils.setExpirationWarning(attachmentUrl);
           // Assert
           expect(result).toBeNull();
       })
    })

    afterEach(() => {
        // restore the spy created with spyOn
        jest.restoreAllMocks();
    });
})