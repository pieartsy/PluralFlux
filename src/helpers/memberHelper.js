import {db} from '../db.js';
import {enums} from "../enums.js";
import {loadImage} from "canvas";
import {EmptyResultError} from "sequelize";
import {EmbedBuilder} from "@fluxerjs/core";

const mh = {};

// Has an empty "command" to parse the help message properly
const commandList = ['--help', 'add', 'remove', 'name', 'list', 'displayName', 'proxy', 'propic', ''];

/**
 * Parses through the subcommands that come after "pf;member" and calls functions accordingly.
 *
 * @async
 * @param {string} authorId - The id of the message author
 * @param {string} authorFull - The username and discriminator of the message author
 * @param {string[]} args - The message arguments
 * @param {string | null} attachmentUrl - The message attachment url.
 * @param {string | null} attachmentExpiration - The message attachment expiration (if uploaded via Fluxer)
 * @returns {Promise<string> | Promise <EmbedBuilder>} A message, or an informational embed.
 * @throws {Error}
 */
mh.parseMemberCommand = async function(authorId, authorFull, args, attachmentUrl = null, attachmentExpiration = null){
    let member;
    // checks whether command is in list, otherwise assumes it's a name
    if(!commandList.includes(args[0])) {
        member = await mh.getMemberInfo(authorId, args[0]).catch((e) =>{throw e});
    }
    switch(args[0]) {
        case '--help':
            return enums.help.MEMBER;
        case 'add':
            return await mh.addNewMember(authorId, args).catch((e) =>{throw e});
        case 'remove':
            return await mh.removeMember(authorId, args).catch((e) =>{throw e});
        case 'name':
            return enums.help.NAME;
        case 'displayname':
            return enums.help.DISPLAY_NAME;
        case 'proxy':
            return enums.help.PROXY;
        case 'propic':
            return enums.help.PROPIC;
        case 'list':
            return await mh.getAllMembersInfo(authorId, authorFull).catch((e) =>{throw e});
        case '':
            return enums.help.MEMBER;
    }
    switch(args[1]) {
        case 'name':
            return await mh.updateName(authorId, args).catch((e) =>{throw e});
        case 'displayname':
            return await mh.updateDisplayName(authorId, args).catch((e) =>{throw e});
        case 'proxy':
            return await mh.updateProxy(authorId, args).catch((e) =>{throw e});
        case 'propic':
            return await mh.updatePropic(authorId, args, attachmentUrl, attachmentExpiration).catch((e) =>{throw e});
        default:
            return member;
    }
}

/**
 * Adds a member.
 *
 * @async
 * @param {string} authorId - The author of the message
 * @param {string[]} args - The message arguments
 * @returns {Promise<string>} A successful addition.
 * @throws {Error}  When the member exists, or creating a member doesn't work.
 */
mh.addNewMember = async function(authorId, args) {
    if (args[1] && args[1] === "--help" || !args[1]) {
        return enums.help.ADD;
    }
    const memberName = args[1];
    const displayName = args[2];

    return await mh.addFullMember(authorId, memberName, displayName).then((member) => {
        let success = `Member was successfully added.\nName: ${member.dataValues.name}`
        success += displayName ? `\nDisplay name: ${member.dataValues.displayname}` : "";
        return success;
    }).catch(e => {
        throw new Error(`${enums.err.ADD_ERROR}: ${e.message}`)
    })
}

/**
 * Updates the name for a member.
 *
 * @async
 * @param {string} authorId - The author of the message
 * @param {string[]} args - The message arguments
 * @returns {Promise<string>} A successful update.
 * @throws {RangeError} When the name doesn't exist.
 */
mh.updateName = async function (authorId, args) {
    if (args[1] && args[1] === "--help" || !args[1]) {
        return enums.help.DISPLAY_NAME;
    }

    const name = args[2];
    const trimmedName = name ? name.trim() : null;
    if (!name || trimmedName === null) {
        throw new RangeError(`Display name ${enums.err.NO_VALUE}`);
    }
    return await mh.updateMemberField(authorId, args).catch((e) =>{throw e});
}

/**
 * Updates the display name for a member.
 *
 * @async
 * @param {string} authorId - The author of the message
 * @param {string[]} args - The message arguments
 * @returns {Promise<string>} A successful update.
 * @throws {RangeError} When the display name is too long or doesn't exist.
 */
mh.updateDisplayName = async function(authorId, args) {
    if (args[1] && args[1] === "--help" || !args[1]) {
        return enums.help.DISPLAY_NAME;
    }

    const memberName = args[0];
    const displayName = args[2];
    const trimmedName = displayName ? displayName.trim() : null;

    if (!displayName || trimmedName === null ) {
        return await mh.getMemberByName(authorId, memberName).then((member) => {
            if (member.displayname) {
                return `Display name for ${memberName} is: \"${member.displayname}\".`;
            }
            throw new RangeError(`Display name ${enums.err.NO_VALUE}`);
        }).catch((e) =>{throw e});

    }
    else if (displayName.length > 32) {
        throw new RangeError(enums.err.DISPLAY_NAME_TOO_LONG);
    }
    return await mh.updateMemberField(authorId, args).catch((e) =>{throw e});
}

/**
 * Updates the proxy for a member, first checking that no other members attached to the author have the tag.
 *
 * @async
 * @param {string} authorId - The author of the message
 * @param {string[]} args - The message arguments
 * @returns {Promise<string> } A successful update.
 * @throws {RangeError | Error} When an empty proxy was provided, or no proxy exists.
 */
mh.updateProxy = async function(authorId, args) {
    if (args[1] && args[1] === "--help" || !args[1]) {
        return enums.help.PROXY;
    }
    const proxyExists = await mh.checkIfProxyExists(authorId, args[2]).then((proxyExists) => {
        return proxyExists;
    }).catch((e) =>{throw e});
    if (!proxyExists) {
        return await mh.updateMemberField(authorId, args).catch((e) =>{throw e});
    }
}

/**
 * Updates the profile pic for a member, based on either the attachment or the args provided.
 *
 * @async
 * @param {string} authorId - The author of the message
 * @param {string[]} args - The message arguments
 * @param {string} attachmentUrl - The url of the first attachment in the message
 * @param {string | null} attachmentExpiry - The expiration date of the first attachment in the message (if uploaded to Fluxer)
 * @returns {Promise<string>} A successful update.
 * @throws {Error} When loading the profile picture from a URL doesn't work.
 */
mh.updatePropic = async function(authorId, args, attachmentUrl, attachmentExpiry= null) {
    if (args[1] && args[1] === "--help") {
        return enums.help.PROPIC;
    }
    let img;
    const updatedArgs = args;
    if (!updatedArgs[1] && !attachmentUrl) {
        return enums.help.PROPIC;
    } else if (attachmentUrl) {
        updatedArgs[2] = attachmentUrl;
        updatedArgs[3] = attachmentExpiry;
    }
    if (updatedArgs[2]) {
        img = updatedArgs[2];
    }

    const loadedImage = await loadImage(img).then((li) => {
        return li;
    }).catch((err) => {
        throw new Error(`${enums.err.PROPIC_CANNOT_LOAD}: ${err.message}`);
    });
    if (loadedImage) {
        return await mh.updateMemberField(authorId, updatedArgs).catch((e) =>{throw e});
    }
}

/**
 * Removes a member.
 *
 * @async
 * @param {string} authorId - The author of the message
 * @param {string[]} args - The message arguments
 * @returns {Promise<string>} A successful removal.
 * @throws {EmptyResultError} When there is no member to remove.
 */
mh.removeMember = async function(authorId, args) {
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
 * Adds a member with full details, first checking that there is no member of that name associated with the author.
 *
 * @async
 * @param {string} authorId - The author of the message
 * @param {string} memberName - The name of the member.
 * @param {string | null} displayName - The display name of the member.
 * @param {string | null} proxy - The proxy tag of the member.
 * @param {string | null} propic - The profile picture URL of the member.
 * @returns {Promise<string>} A successful addition.
 * @throws {Error | RangeError}  When the member already exists, there are validation errors, or adding a member doesn't work.
 */
mh.addFullMember = async function(authorId, memberName, displayName = null, proxy = null, propic= null) {
    const member = await mh.getMemberByName(authorId, memberName).catch((e) =>{throw e});
    if (member) {
        throw new Error(`Can't add ${memberName}. ${enums.err.MEMBER_EXISTS}`);
    }
    if (displayName) {
        const trimmedName = displayName ? displayName.trim() : null;
        if (trimmedName && trimmedName.length > 32) {
            throw new RangeError(`Can't add ${memberName}. ${enums.err.DISPLAY_NAME_TOO_LONG}`);
        }
    }
    if (proxy) {
        await mh.checkIfProxyExists(authorId, proxy).catch((e) =>{throw e});
    }
    if (propic) {
        await loadImage(propic).catch((err) => {
            throw new Error(`Can't add ${memberName}. ${enums.err.PROPIC_CANNOT_LOAD}: ${err.message}`);
        });
    }

    return await db.members.create({
        name: memberName,
        userid: authorId,
        displayname: displayName,
        proxy: proxy,
        propic: propic,
    }).catch(e => {
        throw new Error(`Can't add ${memberName}. ${enums.err.ADD_ERROR}: ${e.message}`)
    })
}

/**
 * Updates one fields for a member in the database.
 *
 * @async
 * @param {string} authorId - The author of the message
 * @param {string[]} args - The message arguments
 * @returns {Promise<string>} A successful update.
 * @throws {EmptyResultError | Error} When the member is not found, or catchall error.
 */
mh.updateMemberField = async function(authorId, args) {
    const memberName = args[0];
    const columnName = args[1];
    const value = args[2];
    let fluxerPropicWarning;

    // indicates that an attachment was uploaded on Fluxer directly
    if (columnName === "propic" && args[3]) {
        fluxerPropicWarning = mh.setExpirationWarning(args[3]);
    }
    return await db.members.update({[columnName]: value}, { where: { name: memberName, userid: authorId } }).then(() => {
        return `Updated ${columnName} for ${memberName} to "${value}"${fluxerPropicWarning ?? ''}.`;
    }).catch(e => {
        if (e === EmptyResultError) {
            throw new EmptyResultError(`Can't update ${memberName}. ${enums.err.NO_MEMBER}: ${e.message}`);
        }
        else {
            throw new Error(`Can't update ${memberName}. ${e.message}`);
        }
    });
}

/**
 * Sets the warning for an expiration date.
 *
 * @param {string} expirationString - An expiration date string.
 * @returns {string} A description of the expiration, interpolating the expiration string.
 */
mh.setExpirationWarning = function(expirationString) {
    let expirationDate = new Date(expirationString);
    if (!isNaN(expirationDate.valueOf())) {
        expirationDate = expirationDate.toDateString();
        return `\n**NOTE:** Because this profile picture was uploaded via Fluxer, it will currently expire on *${expirationDate}*. To avoid this, upload the picture to another website like <https://imgbb.com/> and link to it directly.`
    }
}

/**
 * Gets the details for a member.
 *
 * @async
 * @param {string} authorId - The author of the message
 * @param {string} memberName - The message arguments
 * @returns {Promise<EmbedBuilder>} The member's info.
 * @throws {Error}
 */
mh.getMemberInfo = async function(authorId, memberName) {
    return await mh.getMemberByName(authorId, memberName).then((member) => {
        console.log(member);
        return new EmbedBuilder()
            .setTitle(member.name)
            .setDescription(`Details for ${member.name}`)
            .addFields(
                {name: 'Display name: ', value: member.displayname ?? 'unset', inline: true},
                {name: 'Proxy tag: ', value: member.proxy ?? 'unset', inline: true},
            )
            .setImage(member.propic);
    }).catch((e) =>{throw e})
}

/**
 * Gets all members for an author.
 *
 * @async
 * @param {string} authorId - The id of the message author
 * @param {string} authorName - The id name the message author
 * @returns {Promise<EmbedBuilder>} The info for all members.
 * @throws {Error}
 */
mh.getAllMembersInfo = async function(authorId, authorName) {
    const members = await mh.getMembersByAuthor(authorId).catch(e =>{throw e});
    const fields = [...members.entries()].map(([name, member]) => ({
        name: member.name,
        value: `(Proxy: \`${member.proxy ?? "unset"}\`)`,
        inline: true,
    }));
    return new EmbedBuilder()
        .setTitle(`Members for ${authorName}`)
        .addFields(...fields);
}

/**
 * Gets a member based on the author and proxy tag.
 *
 * @async
 * @param {string} authorId - The author of the message.
 * @param {string} memberName - The member's name.
 * @returns {Promise<model>} The member object.
 * @throws { EmptyResultError } When the member is not found.
 */
mh.getMemberByName = async function(authorId, memberName) {
    return await db.members.findOne({ where: { userid: authorId, name: memberName } }).then((result) => {
        if (!result) {
            throw new EmptyResultError(`Can't get ${memberName}. ${enums.err.NO_MEMBER}`);
        }
        return result;
    });
}

/**
 * Gets a member based on the author and proxy tag.
 *
 * @async
 * @param {string} authorId - The author of the message
 * @param {string} proxy - The proxy tag
 * @returns {Promise<model>} The member object.
 * @throws { EmptyResultError } When the member is not found.
 */
mh.getMemberByProxy = async function(authorId, proxy) {
    return await db.members.findOne({ where: { userid: authorId, proxy: proxy } }).then((result) => {
        if (!result) {
            throw new EmptyResultError(`Can't find member with that proxy. ${enums.err.NO_MEMBER}.`);
        }
        return result;
    });
}

/**
 * Gets all members belonging to the author.
 *
 * @async
 * @param {string} authorId - The author of the message
 * @returns {Promise<model[]>} The member object array.
 * @throws { EmptyResultError } When no members are found.
 */
mh.getMembersByAuthor = async function(authorId) {
    return await db.members.findAll({ where: { userid: authorId } }).then((result) => {
        if (result.length === 0) {
            throw new EmptyResultError(`${enums.err.USER_NO_MEMBERS}: ${e.message}`);
        }
        return result;
    });
}


/**
 * Checks if proxy exists for a member.
 *
 * @param {string} authorId - The author of the message
 * @param {string} proxy - The proxy tag.
 * @returns {Promise<boolean> } Whether the proxy exists.
 * @throws {Error} When an empty proxy was provided, or no proxy exists.
 */
mh.checkIfProxyExists = async function(authorId, proxy) {
    const trimmedProxy = proxy ? proxy.trim() : null;

    if (trimmedProxy == null) throw new RangeError(`Proxy ${enums.err.NO_VALUE}`);
    const splitProxy = proxy.trim().split("text");
    if(splitProxy.length < 2) throw new Error(enums.err.NO_TEXT_FOR_PROXY);
    if(!splitProxy[0] && !splitProxy[1]) throw new Error(enums.err.NO_PROXY_WRAPPER);

    await mh.getMembersByAuthor(authorId).then((memberList) => {
        const proxyExists = memberList.some(member => member.proxy === proxy);
        if (proxyExists) {
            throw new Error(enums.err.PROXY_EXISTS);
        }
    }).catch(e =>{throw e});
}


export const memberHelper = mh;