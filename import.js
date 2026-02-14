import {db} from './sequelize.js'
import {enums} from "./enums.js";
import {memberHelper} from "./helpers/memberHelper.js";

const ih = {};

/**
 * Tries to import from Pluralkit.
 *
 * @param {string} authorId - The author of the message
 * @param {string[]} args - The message arguments
 * @returns {Promise<string>} A successful addition.
 * @throws {Error}  When the member exists, or creating a member doesn't work.
 */
ih.pluralKitImport = function (authorId, attachment) {
    try {
        const pkData = JSON.parse(attachment);
        const pkMembers = pkData.members;
        pkMembers.forEach((pkMember) => {
            const proxy = `${pkMember.proxy_tags.prefix}text${pkMember.proxy_tags.suffix}`;
            memberHelper.addFullMember(authorId, pkMember.name, pkMember.display_name, proxy, avatar_url);
        })
    }
    catch {
        throw new Error(enums.err.NOT_JSON);
    }
}

export const importHelper = ih;