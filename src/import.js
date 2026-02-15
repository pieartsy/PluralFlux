import {enums} from "./enums.js";
import {memberHelper} from "./helpers/memberHelper.js";

const ih = {};

/**
 * Tries to import from Pluralkit.
 *
 * @param {string} authorId - The author of the message
 * @param {string} attachment - The attached JSON url.
 * @returns {string} A successful addition.
 * @throws {Error}  When the member exists, or creating a member doesn't work.
 */
ih.pluralKitImport = function (authorId, attachment) {
    try {
        const pkData = JSON.parse(attachment);
        const pkMembers = pkData.members;
        pkMembers.forEach(async(pkMember) => {
            const proxy = `${pkMember.proxy_tags.prefix}text${pkMember.proxy_tags.suffix}`;
            await memberHelper.addFullMember(authorId, pkMember.name, pkMember.display_name, proxy, avatar_url);
        })
        return "All members imported.";
    }
    catch {
        throw new Error(enums.err.NOT_JSON);
    }
}

export const importHelper = ih;