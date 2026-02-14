import { db } from '../sequelize.js';
import {enums} from "../enums.js";
import { loadImage } from "canvas";

const mh = {};

// Has an empty "command" to parse the help message properly
const commandList = ['--help', 'add', 'remove', 'displayName', 'proxy', 'propic', ''];

/**
 * Parses through the subcommands that come after "pf;member" and calls functions accordingly.
 *
 * @param {string} authorId - The author of the message
 * @param {string[]} args - The message arguments
 * @param {string} attachment - The message attachments
 * @returns {Promise<string>} A message.
 */
mh.parseMemberCommand = async function(authorId, args, attachment){
    console.log(authorId, args);
    let member;
    // checks whether command is in list, otherwise assumes it's a name
    if(!commandList.includes(args[0])) {
        member = await getMemberInfo(authorId, args[0]);
        if (member === enums.err.NO_MEMBER) {
            return member;
        }
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
            return await updatePropic(authorId, args, attachment)
        default:
            return member;
    }
}

/**
 * Adds a member, first checking that there is no member of that name associated with the author.
 *
 * @param {string} authorId - The author of the message
 * @param {string[]} args - The message arguments
 * @returns {Promise<string>} A successful addition, or an error message.
 */
async function addNewMember(authorId, args) {
    if (args[1] && args[1] === "--help" || !args[1]) {
        return enums.help.ADD;
    }
    const memberName = args[1];
    const displayName = args[2];

    const member = await getMemberInfo(authorId, memberName);
    if (member && member !== enums.err.NO_MEMBER) {
        return enums.err.MEMBER_EXISTS;
    }
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
        return `${enums.err.ADD_ERROR}: ${e.message}`;
    })
}

/**
 * Updates the display name for a member.
 *
 * @param {string} authorId - The author of the message
 * @param {string[]} args - The message arguments
 * @returns {Promise<string>} A successful update, or an error message.
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
        return `Display name ${enums.err.NO_VALUE}`
    }
    else if (displayName.length > 32) {
        return enums.err.DISPLAY_NAME_TOO_LONG;
    }
    console.log(displayName);
    return updateMember(authorId, args);
}

/**
 * Updates the proxy for a member, first checking that no other members attached to the author have the tag.
 *
 * @param {string} authorId - The author of the message
 * @param {string[]} args - The message arguments
 * @returns {Promise<string> } A successful update, or an error message.
 */
async function updateProxy(authorId, args) {
    if (args[1] && args[1] === "--help" || !args[1]) {
        return enums.help.PROXY;
    }
    const proxy = args[2];
    const trimmedProxy = proxy ? proxy.replaceAll(' ', '') : null;

    if (trimmedProxy == null) {
        return `Proxy ${enums.err.NO_VALUE}`;
    }

    const members = await mh.getMembersByAuthor(authorId);
    const proxyExists = members.some(member => member.proxy === proxy);
    if (proxyExists) {
        return enums.err.PROXY_EXISTS;
    }
    return updateMember(authorId, args);
}

/**
 * Updates the profile pic for a member, based on either the attachment or the args provided.
 *
 * @param {string} authorId - The author of the message
 * @param {string[]} args - The message arguments
 * @param {string} attachment - The url of the first attachment in the message
 * @returns {Promise<string> } A successful update, or an error message.
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
        return `${enums.err.PROPIC_CANNOT_LOAD}: ${err.message}`;
    });
}

/**
 * Removes a member.
 *
 * @param {string} authorId - The author of the message
 * @param {string[]} args - The message arguments
 * @returns {Promise<string>} A successful removal, or an error message.
 */
async function removeMember(authorId, args) {
    if (args[1] && args[1] === "--help") {
        return enums.help.REMOVE;
    }

    const memberName = args[1];
    if (!memberName) {
        return `${enums.err.NO_NAME_PROVIDED} deletion.`;
    }
    return await db.members.destroy({ where: { name: memberName, userid: authorId } }).then(() => {
        return `Member "${memberName}" has been deleted.`;
    }).catch(e => {
        return `${enums.err.NO_MEMBER}: ${e.message}`;
    });
}

/*======Non-Subcommands======*/

/**
 * Updates a member's fields in the database.
 *
 * @param {string} authorId - The author of the message
 * @param {string[]} args - The message arguments
 * @returns {Promise<string>} A successful update, or an error message.
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
        return `${enums.err.NO_MEMBER}: ${e.message}`;
    });
}

/**
 * Sets the warning for an expiration date.
 *
 * @param {string} expirationString - An expiration date string.
 * @returns {string} A successful update, or an error message.
 */
function setExpirationWarning(expirationString) {
    let expirationDate = new Date(expirationString);
    console.log(expirationDate, expirationDate instanceof Date);
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
 * @returns {Promise<string>} The member's info, or an error message.
 */
async function getMemberInfo(authorId, memberName) {
    let member = await db.members.findOne({ where: { name: memberName, userid: authorId } });
    if (member) {
        let member_info = `Member name: ${member.name}`;
        member_info += member.displayname ? `\nDisplay name: ${member.displayname}` : '\nDisplay name: unset';
        member_info += member.proxy ? `\nProxy Tag: ${member.proxy}` : '\nProxy tag: unset';
        member_info += member.propic ? `\nProfile pic: ${member.propic}` : '\nProfile pic: unset';
        return member_info;
    }
    return enums.err.NO_MEMBER;
}

/**
 * Gets a member based on the author and proxy tag.
 *
 * @param {string} authorId - The author of the message.
 * @param {string} name - The member's name.
 * @returns {Promise<model> | Promise<string>} The member object, or an error message.
 */
mh.getMemberByName = async function(authorId, name) {
    return await db.members.findOne({ where: { userid: authorId, name: name } }).catch(e => {
        return `${enums.err.NO_MEMBER}: ${e.message}`;
    });
}

/**
 * Gets a member based on the author and proxy tag.
 *
 * @param {string} authorId - The author of the message
 * @param {string} proxy - The proxy tag
 * @returns {Promise<model> | Promise<string>} The member object, or an error message.
 */
mh.getMemberByProxy = async function(authorId, proxy) {
    return await db.members.findOne({ where: { userid: authorId, proxy: proxy } }).catch(e => {
        return `${enums.err.NO_MEMBER}: ${e.message}`;
    });
}

/**
 * Gets all members belonging to the author.
 *
 * @param {string} authorId - The author of the message
 * @returns {Promise<model[]> | Promise<string>} The member object, or an error message.
 */
mh.getMembersByAuthor = async function(authorId) {
    return await db.members.findAll({ where: { userid: authorId } }).catch(e => {
        // I have no idea how this could possibly happen but better safe than sorry
        return `${enums.err.USER_NO_MEMBERS}: ${e.message}`;
    });
}


export const memberHelper = mh;