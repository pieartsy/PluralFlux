const {enums} = require("../../src/enums");

const {utils} = require("../../src/helpers/utils.js");

describe('utils', () => {

    const attachmentUrl = 'oya.png';
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

    afterEach(() => {
        // restore the spy created with spyOn
        jest.restoreAllMocks();
    });
})