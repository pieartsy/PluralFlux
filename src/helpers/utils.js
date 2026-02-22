
const u = {};

u.debounce = function(func, delay) {
    let timeout = null;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}

/**
 * Checks if an uploaded picture is in the right format.
 *
 * @async
 * @param {string} imageUrl - The url of the image
 * @throws {Error} When loading the profile picture from a URL doesn't work, or it fails requirements.
 */
u.checkImageFormatValidity = async function (imageUrl) {
    const acceptableImages = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
    await fetch(imageUrl).then(r => r.blob()).then(blobFile => {
        if (blobFile.size > 1000000 || !acceptableImages.includes(blobFile.type)) throw new Error(enums.err.PROPIC_FAILS_REQUIREMENTS);
    }).catch((error) => {
        throw new Error(`${enums.err.PROPIC_CANNOT_LOAD}: ${error.message}`);
    });
}

export const utils = u;
