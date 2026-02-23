import {enums} from "../enums.js";
import {memberHelper} from "./memberHelper.js";

const ih = {};

/**
 * Tries to import from Pluralkit.
 *
 * @async
 * @param {string} authorId - The author of the message
 * @param {string} attachmentUrl - The attached JSON url.
 * @returns {string} A successful addition of all members.
 * @throws {Error}  When the member exists, or creating a member doesn't work.
 */
ih.pluralKitImport = async function (authorId, attachmentUrl) {
    if (!attachmentUrl) {
        throw new Error(enums.err.NOT_JSON_FILE);
    }
    return fetch(attachmentUrl).then((res) => res.json()).then(async(pkData) => {
            const pkMembers = pkData.members;
            let errors = [];
            const addedMembers = [];
            for (let pkMember of pkMembers) {
                const proxy = pkMember.proxy_tags[0] ? `${pkMember.proxy_tags[0].prefix ?? ''}text${pkMember.proxy_tags[0].suffix ?? ''}` : null;
                await memberHelper.addFullMember(authorId, pkMember.name, pkMember.display_name, proxy, pkMember.avatar_url).then((memberObj) => {
                    addedMembers.push(memberObj.member.name);
                    if (memberObj.errors.length > 0) {
                        errors.push(`\n**${pkMember.name}:** `)
                        errors = errors.concat(memberObj.errors);
                    }
                }).catch(e => {
                    errors.push(e.message);
                });
            }
            const aggregatedText = addedMembers.length > 0 ? `Successfully added members: ${addedMembers.join(', ')}` : enums.err.NO_MEMBERS_IMPORTED;
            if (errors.length > 0) {
                throw new AggregateError(errors, aggregatedText);
            }
            return aggregatedText;
        });
}

export const importHelper = ih;