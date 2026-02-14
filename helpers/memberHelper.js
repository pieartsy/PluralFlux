import { db } from '../sequelize.js';
import {enums} from "../enums.js";
import { loadImage } from "canvas";
import {EmptyResultError} from "sequelize";

const mh = {};

// Has an empty "command" to parse the help message properly
const commandList = ['--help', 'add', 'remove', 'displayName', 'proxy', 'propic', ''];

/**
 * Parses through the subcommands that come after "pf;member" and calls functions accordingly.
 *
 * @param {string} authorId - The author of the message
 * @param {string[]} args - The message arguments
 * @param {string} attachmentUrl - The message attachments
 * @returns {Promise<string>} A message.
 */
mh.parseMemberCommand = async function(authorId, args, attachmentUrl){
    console.log(authorId, args);
    let member;
    // checks whether command is in list, otherwise assumes it's a name
    if(!commandList.includes(args[0])) {
        member = await getMemberInfo(authorId, args[0]);
    }
    switch(args[0]) {
        case '--help':
            return enums.help.MEMBER;
        case 'add':
            return await addNewMember(authorId, args);
        case 'remove':
            return await removeMember(authorId, args);
        case 'displayname':
            return enums.help.DISPLAY_NAME;
        case 'proxy':
            return enums.help.PROXY;
        case 'propic':
            return enums.help.PROPIC;
        case '':
            return enums.help.MEMBER;
    }
    switch(args[1]) {
        case '--help':
            return enums.help.MEMBER;
        case 'displayname':
            return await updateDisplayName(authorId, args);
        case 'proxy':
            return await updateProxy(authorId, args);
        case 'propic':
            return await updatePropic(authorId, args, attachmentUrl)
        default:
            return member;
    }
}

/**
 * Adds a member, first checking that there is no member of that name associated with the author.
 *
 * @param {string} authorId - The author of the message
 * @param {string[]} args - The message arguments
 * @returns {Promise<string>} A successful addition.
 * @throws {Error}  When creating a member doesn't work.
 */
async function addNewMember(authorId, args) {
    if (args[1] && args[1] === "--help" || !args[1]) {
        return enums.help.ADD;
    }
    const memberName = args[1];
    const displayName = args[2];

    const member = await getMemberInfo(authorId, memberName);
    const trimmedName = displayName ? displayName.replaceAll(' ', '') : null;
    return await db.members.create({
        name: memberName,
        userid: authorId,
        displayname: trimmedName !== null ? displayName : null,
    }).then((m) => {
        let success = `Member was successfully added.\nName: ${m.dataValues.name}`
        success += displayName ? `\nDisplay name: ${m.dataValues.displayname}` : "";
        return success;
    }).catch(e => {
        throw new Error(`${enums.err.ADD_ERROR}: ${e.message}`)
    })
}

/**
 * Updates the display name for a member.
 *
 * @param {string} authorId - The author of the message
 * @param {string[]} args - The message arguments
 * @returns {Promise<string>} A successful update.
 * @throws {RangeError} When the display name is too long or doesn't exist.
 */
async function updateDisplayName(authorId, args) {
    if (args[1] && args[1] === "--help" || !args[1]) {
        return enums.help.DISPLAY_NAME;
    }

    const memberName = args[0];
    const displayName = args[2];
    const trimmed_name = displayName ? displayName.replaceAll(' ', '') : null;

    if (!displayName || trimmed_name === null ) {
        let member = await mh.getMemberByName(authorId, memberName);
        if (member.displayname) {
            return `Display name for ${memberName} is: \"${member.displayname}\".`;
        }
        throw new RangeError(`Display name ${enums.err.NO_VALUE}`);
    }
    else if (displayName.length > 32) {
        throw new RangeError(enums.err.DISPLAY_NAME_TOO_LONG);
    }
    return updateMember(authorId, args);
}

/**
 * Updates the proxy for a member, first checking that no other members attached to the author have the tag.
 *
 * @param {string} authorId - The author of the message
 * @param {string[]} args - The message arguments
 * @returns {Promise<string> } A successful update, or an error message.
 * @throws {RangeError | Error} When an empty proxy was provided, or no proxy exists.
 */
async function updateProxy(authorId, args) {
    if (args[1] && args[1] === "--help" || !args[1]) {
        return enums.help.PROXY;
    }
    const proxy = args[2];
    const trimmedProxy = proxy ? proxy.replaceAll(' ', '') : null;

    if (trimmedProxy == null) {
        throw new RangeError(`Proxy ${enums.err.NO_VALUE}`);
    }

    const members = await mh.getMembersByAuthor(authorId);
    const proxyExists = members.some(member => member.proxy === proxy);
    if (proxyExists) {
        throw new Error(enums.err.PROXY_EXISTS);
    }
    return updateMember(authorId, args);
}

/**
 * Updates the profile pic for a member, based on either the attachment or the args provided.
 *
 * @param {string} authorId - The author of the message
 * @param {string[]} args - The message arguments
 * @param {string} attachment - The url of the first attachment in the message
 * @returns {Promise<string>} A successful update.
 * @throws {Error} When loading the profile picture from a URL doesn't work.
 */
async function updatePropic(authorId, args, attachment) {
    if (args[1] && args[1] === "--help") {
        return enums.help.PROPIC;
    }
    let img;
    const updatedArgs = args;
    if (!updatedArgs[1] && !attachment) {
        return enums.help.PROPIC;
    } else if (attachment) {
        updatedArgs[2] = attachment.url;
        updatedArgs[3] = attachment.expires_at;
    }
    if (updatedArgs[2]) {
        img = updatedArgs[2];
    }

    return await loadImage(img).then(() => {
        return updateMember(authorId, updatedArgs);
    }).catch((err) => {
        throw new Error(`${enums.err.PROPIC_CANNOT_LOAD}: ${err.message}`);
    });
}

/**
 * Removes a member.
 *
 * @param {string} authorId - The author of the message
 * @param {string[]} args - The message arguments
 * @returns {Promise<string>} A successful removal.
 * @throws {EmptyResultError} When there is no member to remove.
 */
async function removeMember(authorId, args) {
    if (args[1] && args[1] === "--help" || !args[1]) {
        return enums.help.REMOVE;
    }

    const memberName = args[1];
    return await db.members.destroy({ where: { name: memberName, userid: authorId } }).then(() => {
        return `Member "${memberName}" has been deleted.`;
    }).catch(e => {
        throw new EmptyResultError(`${enums.err.NO_MEMBER}: ${e.message}`);
    });
}

/*======Non-Subcommands======*/

/**
 * Updates a member's fields in the database.
 *
 * @param {string} authorId - The author of the message
 * @param {string[]} args - The message arguments
 * @returns {Promise<string>} A successful update.
 * @throws {EmptyResultError | Error} When the member is not found, or catchall error.
 */
async function updateMember(authorId, args) {
    const memberName = args[0];
    const columnName = args[1];
    const value = args[2];
    let fluxerPropicWarning;

    // indicates that an attachment was uploaded on Fluxer directly
    if (columnName === "propic" && args[3]) {
        console.log(args);
        fluxerPropicWarning = setExpirationWarning(args[3]);
    }
    return await db.members.update({[columnName]: value}, { where: { name: memberName, userid: authorId } }).then(() => {
        return `Updated ${columnName} for ${memberName} to "${value}"${fluxerPropicWarning ?? ''}.`;
    }).catch(e => {
        if (e === EmptyResultError) {
            throw new EmptyResultError(`${enums.err.NO_MEMBER}: ${e.message}`);
        }
        else {
            throw new Error(e.message);
        }
    });
}

/**
 * Sets the warning for an expiration date.
 *
 * @param {string} expirationString - An expiration date string.
 * @returns {string} A description of the expiration, interpolating the expiration string.
 */
function setExpirationWarning(expirationString) {
    let expirationDate = new Date(expirationString);
    if (!isNaN(expirationDate.valueOf())) {
        expirationDate = expirationDate.toDateString();
        return `\n**NOTE:** Because this profile picture was uploaded via Fluxer, it will currently expire on *${expirationDate}*. To avoid this, upload the picture to another website like <https://imgbb.com/> and link to it directly.`
    }
}

/**
 * Gets the details for a member.
 *
 * @param {string} authorId - The author of the message
 * @param {string} memberName - The message arguments
 * @returns {Promise<string>} The member's info.
 * @throws { EmptyResultError } When the member is not found.
 */
async function getMemberInfo(authorId, memberName) {
    let member = await db.members.findOne({ where: { name: memberName, userid: authorId } }).catch(e => {
        throw new EmptyResultError(`${enums.err.NO_MEMBER}: ${e.message}`);
    });
    let member_info = `Member name: ${member.name}`;
    member_info += member.displayname ? `\nDisplay name: ${member.displayname}` : '\nDisplay name: unset';
    member_info += member.proxy ? `\nProxy Tag: ${member.proxy}` : '\nProxy tag: unset';
    member_info += member.propic ? `\nProfile pic: ${member.propic}` : '\nProfile pic: unset';
    return member_info;
}

/**
 * Gets a member based on the author and proxy tag.
 *
 * @param {string} authorId - The author of the message.
 * @param {string} name - The member's name.
 * @returns {Promise<model>} The member object.
 * @throws { EmptyResultError } When the member is not found.
 */
mh.getMemberByName = async function(authorId, name) {
    return await db.members.findOne({ where: { userid: authorId, name: name } }).catch(e => {
        throw new EmptyResultError(`${enums.err.NO_MEMBER}: ${e.message}`);
    });
}

/**
 * Gets a member based on the author and proxy tag.
 *
 * @param {string} authorId - The author of the message
 * @param {string} proxy - The proxy tag
 * @returns {Promise<model>} The member object.
 * @throws { EmptyResultError } When the member is not found.
 */
mh.getMemberByProxy = async function(authorId, proxy) {
    return await db.members.findOne({ where: { userid: authorId, proxy: proxy } }).catch(e => {
        throw new EmptyResultError(`${enums.err.NO_MEMBER}: ${e.message}`);
    });
}

/**
 * Gets all members belonging to the author.
 *
 * @param {string} authorId - The author of the message
 * @returns {Promise<model[]>} The member object array.
 * @throws { EmptyResultError } When no members are found.
 */
mh.getMembersByAuthor = async function(authorId) {
    return await db.members.findAll({ where: { userid: authorId } }).catch(e => {
        throw new EmptyResultError(`${enums.err.USER_NO_MEMBERS}: ${e.message}`);
    });
}


export const memberHelper = mh;