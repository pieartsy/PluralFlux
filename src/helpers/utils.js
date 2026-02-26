import {enums} from '../enums.js'

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
 * @returns {bool} - Whether the image is in a valid format
 * @throws {Error} When loading the profile picture from a URL doesn't work, or it fails requirements.
 */
u.checkImageFormatValidity = async function (imageUrl) {
    const acceptableImages = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
    let response, blobFile;
    try {
        response = await fetch(imageUrl);
    }
    catch(e) {
        throw new Error(`${enums.err.PROPIC_CANNOT_LOAD}: ${e.message}`);
    }

    blobFile = await response.blob();
    if (blobFile.size > 10000000 || !acceptableImages.includes(blobFile.type)) throw new Error(enums.err.PROPIC_FAILS_REQUIREMENTS);

    return true;
}

/**
 * Sets the warning that a Fluxer-uploaded image will expire.
 *
 * @param {string | null} [imgUrl] - An image URL.
 * @param {string | null} [expirationString] - An expiration date string.
 * @returns {string | null} A description of the expiration, or null.
 */
u.setExpirationWarning = function (imgUrl = null, expirationString = null) {
    if (imgUrl && imgUrl.startsWith(enums.misc.FLUXER_ATTACHMENT_URL)) {
        return enums.misc.ATTACHMENT_EXPIRATION_WARNING;
    }
    else if (expirationString) {
        let expirationDate = new Date(expirationString);
        if (!isNaN(expirationDate.valueOf())) {
            return `${enums.misc.ATTACHMENT_EXPIRATION_WARNING}. Expiration date: *${expirationString}*.`;
        }
    }
    return null;
}

export const utils = u;
