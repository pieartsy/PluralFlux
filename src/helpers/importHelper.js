const {enums} = require("../enums.js");
const {memberHelper} = require("./memberHelper.js");

const importHelper = {};

/**
 * Tries to import from Pluralkit.
 *
 * @async
 * @param {string} authorId - The author of the message
 * @param {string | null} [attachmentUrl] - The attached JSON url.
 * @returns {Promise<string>} A successful addition of all members.
 * @throws {Error}  When the member exists, or creating a member doesn't work.
 */
importHelper.pluralKitImport = async function (authorId, attachmentUrl= null) {
    let fetchResult, pkData;
    if (!attachmentUrl) {
        throw new Error(enums.err.NOT_JSON_FILE);
    }
    try {
         fetchResult = await fetch(attachmentUrl);
    }
    catch(e) {
        throw new Error(enums.err.CANNOT_FETCH_RESOURCE, { cause: e });
    }

    try {
        pkData = await fetchResult.json();
    }
    catch(e) {
        throw new Error(enums.err.NOT_JSON_FILE, { cause: e })
    }

    const pkMembers = pkData.members;
    let errors = [];
    let addedMembers = [];
    for (let pkMember of pkMembers) {
        const proxy = pkMember.proxy_tags[0] ? `${pkMember.proxy_tags[0].prefix ?? ''}text${pkMember.proxy_tags[0].suffix ?? ''}` : null;
        try {
            const memberObj = await memberHelper.addFullMember(authorId, pkMember.name, pkMember.display_name, proxy, pkMember.avatar_url);
            addedMembers.push(memberObj.member.name);
            if (memberObj.errors.length > 0) {
                errors.push(`\n**${pkMember.name}:** `);
                errors = errors.concat(memberObj.errors);
            }
        }
        catch(e) {
            errors.push(e.message);
        }
    }
    const aggregatedText = addedMembers.length > 0 ? `Successfully added members: ${addedMembers.join(', ')}` : `${enums.err.NO_MEMBERS_IMPORTED}`;
    if (errors.length > 0) {
        throw new AggregateError(errors, aggregatedText);
    }
    return aggregatedText;
}

exports.importHelper = importHelper;