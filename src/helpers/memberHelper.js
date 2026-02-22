import {database} from '../database.js';
import {enums} from "../enums.js";
import {EmptyResultError, Op} from "sequelize";
import {EmbedBuilder} from "@fluxerjs/core";

const mh = {};

// Has an empty "command" to parse the help message properly
const commandList = ['--help', 'new', 'remove', 'name', 'list', 'displayName', 'proxy', 'propic', ''];

/**
 * Parses through the subcommands that come after "pf;member" and calls functions accordingly.
 *
 * @async
 * @param {string} authorId - The id of the message author
 * @param {string} authorFull - The username and discriminator of the message author
 * @param {string[]} args - The message arguments
 * @param {string | null} attachmentUrl - The message attachment url.
 * @param {string | null} attachmentExpiration - The message attachment expiration (if uploaded via Fluxer)
 * @returns {Promise<string>} A success message.
 * @returns {Promise <EmbedBuilder>} A list of 25 members as an embed.
 * @returns {Promise <EmbedBuilder>} A list of member commands and descriptions.
 * @returns {Promise<{EmbedBuilder, [string], string}>} A member info embed + info/errors.
 * @throws {Error}
 */
mh.parseMemberCommand = async function (authorId, authorFull, args, attachmentUrl = null, attachmentExpiration = null) {
    const memberName = !commandList.includes(args[0]) ? args[0] : args[1];

    // checks whether command is in list, otherwise assumes it's a name
    const member = await mh.getMemberByName(authorId, memberName).then((m) => {
        if (!m) throw new Error(enums.err.NO_MEMBER);
        return m;
    })

    switch (args[0]) {
        case 'new':
            if (!args[1] || args[1] === "--help") return enums.help.NEW;
            return await mh.addNewMember(authorId, args, attachmentUrl).catch((e) => { throw e });
        case 'remove':
            if (!args[1] || args[1] === "--help") return enums.help.REMOVE;
            return await mh.removeMember(authorId, memberName).catch((e) => { throw e });
        case 'name':
            return enums.help.NAME;
        case 'displayname':
            return enums.help.DISPLAY_NAME;
        case 'proxy':
            return enums.help.PROXY;
        case 'propic':
            return enums.help.PROPIC;
        case 'list':
            if (args[1] && args[1] === "--help") return enums.help.LIST;
            return await mh.getAllMembersInfo(authorId, authorFull).catch((e) => { throw e });
        case '--help':
        case '':
            return mh.getMemberCommandInfo();
    }
    switch (args[1]) {
        case 'name':
            if (!args[2]) return member.name;
            return await mh.updateName(authorId, args[0], args[2]).catch((e) => { throw e});
        case 'displayname':
            if (!args[2]) return member.displayname ?? `Display name ${enums.err.NO_VALUE}`;
            return await mh.updateDisplayName(authorId, args[0], args[2]).catch((e) => {throw e});
        case 'proxy':
            if (!args[2]) return member.proxy ?? `Proxy ${enums.err.NO_VALUE}`;
            return await mh.updateProxy(authorId, args[0], args[2]).catch((e) => {throw e});
        case 'propic':
            if (!args[2] && !attachmentUrl) return member.propic ?? `Profile picture ${enums.err.NO_VALUE}`;
            return await mh.updatePropic(authorId, args[0], args[2], attachmentUrl, attachmentExpiration).catch((e) => {throw e});
        default:
            return await mh.getMemberInfo(authorId, member);
    }
}

/**
 * Adds a member.
 *
 * @async
 * @param {string} authorId - The author of the message
 * @param {string[]} args - The message arguments
 * @param {string | null} attachmentURL - The attachment URL, if any exists
 * @returns {Promise<string>} A successful addition.
 * @throws {Error}  When the member exists, or creating a member doesn't work.
 */
mh.addNewMember = async function (authorId, args, attachmentURL = null) {
    const memberName = args[1];
    const displayName = args[2];
    const proxy = args[3];
    const propic = args[4] ?? attachmentURL;

    return await mh.addFullMember(authorId, memberName, displayName, proxy, propic).then(async(response) => {
        const memberInfoEmbed = await mh.getMemberInfo(authorId, response.member).catch((e) => {throw e})
        return {embed: memberInfoEmbed, errors: response.errors, success: `${memberName} has been added successfully.`};
    }).catch(e => {
        throw e;
    })
}

/**
 * Updates the name for a member.
 *
 * @async
 * @param {string} authorId - The author of the message
 * @param {string} memberName - The member to update
 * @param {string} name - The message arguments
 * @returns {Promise<string>} A successful update.
 * @throws {RangeError} When the name doesn't exist.
 */
mh.updateName = async function (authorId, memberName, name) {
    if (name === "--help") {
        return enums.help.NAME;
    }
    const trimmedName = name.trim();
    if (trimmedName === '') {
        throw new RangeError(`Name ${enums.err.NO_VALUE}`);
    }
    return await mh.updateMemberField(authorId, memberName, "name", trimmedName).catch((e) => {
        throw e
    });
}

/**
 * Updates the display name for a member.
 *
 * @async
 * @param {string} authorId - The author of the message
 * @param {string} membername - The member to update
 * @param {string} displayname - The display name to set
 * @returns {Promise<string>} A successful update.
 * @throws {RangeError} When the display name is too long or doesn't exist.
 */
mh.updateDisplayName = async function (authorId, membername, displayname) {
    if (displayname === "--help") {
        return enums.help.DISPLAY_NAME;
    }
    const trimmedName = displayname.trim();

    if (trimmedName.length > 32) {
        throw new RangeError(enums.err.DISPLAY_NAME_TOO_LONG);
    }
    else if (trimmedName === '') {
        throw new RangeError(`Display name ${enums.err.NO_VALUE}`);
    }
    return await mh.updateMemberField(authorId, membername, "displayname", trimmedName).catch((e) => {
        throw e
    });
}

/**
 * Updates the proxy for a member, first checking that no other members attached to the author have the tag.
 *
 * @async
 * @param {string} authorId - The author of the message
 * @param {string} memberName - The member to update
 * @param {string} proxy - The proxy to set
 * @returns {Promise<string> } A successful update.
 * @throws {RangeError | Error} When an empty proxy was provided, or no proxy exists.
 */
mh.updateProxy = async function (authorId, memberName, proxy) {
    if (proxy === "--help") {
        return enums.help.PROXY;
    }
    const proxyExists = await mh.checkIfProxyExists(authorId, proxy).then((proxyExists) => {
        return proxyExists;
    }).catch((e) => {
        throw e
    });
    if (!proxyExists) {
        return await mh.updateMemberField(authorId, memberName, "proxy", proxy).catch((e) => {
            throw e
        });
    }
}

/**
 * Updates the profile pic for a member, based on either the attachment or the args provided.
 *
 * @async
 * @param {string} authorId - The author of the message
 * @param {string} memberName - The member to update
 * @param {string | null} imgUrl - The message arguments
 * @param {string | null} attachmentUrl - The url of the first attachment in the message
 * @param {string | null} attachmentExpiry - The expiration date of the first attachment in the message (if uploaded to Fluxer)
 * @returns {Promise<string>} A successful update.
 * @throws {Error} When loading the profile picture from a URL doesn't work.
 */
mh.updatePropic = async function (authorId, memberName, imgUrl = null, attachmentUrl = null, attachmentExpiry = null) {
    if (imgUrl === "--help") {
        return enums.help.PROPIC;
    }
    const isValidImage = await mh.checkImageFormatValidity(attachmentUrl ?? imgUrl).catch((e) => {
        throw e
    });
    if (isValidImage) {
        return await mh.updateMemberField(authorId, memberName, "propic", attachmentUrl ?? imgUrl, attachmentExpiry).catch((e) => {
            throw e
        });
    }
}

/**
 * Checks if an uploaded picture is in the right format.
 *
 * @async
 * @param {string} imageUrl - The url of the image
 * @returns {Promise<boolean>} - If the image is a valid format.
 * @throws {Error} When loading the profile picture from a URL doesn't work, or it fails requirements.
 */
mh.checkImageFormatValidity = async function (imageUrl) {
    const acceptableImages = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
    return await fetch(imageUrl).then(r => r.blob()).then(blobFile => {
        if (blobFile.size > 1000000 || !acceptableImages.includes(blobFile.type)) throw new Error(enums.err.PROPIC_FAILS_REQUIREMENTS);
        return true;
    }).catch((error) => {
        throw new Error(`${enums.err.PROPIC_CANNOT_LOAD}: ${error.message}`);
    });
}

/**
 * Removes a member.
 *
 * @async
 * @param {string} authorId - The author of the message
 * @param {string} memberName - The name of the member to remove
 * @returns {Promise<string>} A successful removal.
 * @throws {EmptyResultError} When there is no member to remove.
 */
mh.removeMember = async function (authorId, memberName) {
    return await database.members.destroy({
        where: {
            name: {[Op.iLike]: memberName},
            userid: authorId
        }
    }).then((result) => {
        if (result) {
            return `Member "${memberName}" has been deleted.`;
        }
        throw new EmptyResultError(`${enums.err.NO_MEMBER}`);
    })
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
 * @returns {Promise<{model, string[]}>} A successful addition object, including errors if there are any.
 * @throws {Error}  When the member already exists, there are validation errors, or adding a member doesn't work.
 */
mh.addFullMember = async function (authorId, memberName, displayName = null, proxy = null, propic = null) {
    await mh.getMemberByName(authorId, memberName).then((member) => {
        if (member) {
            throw new Error(`Can't add ${memberName}. ${enums.err.MEMBER_EXISTS}`);
        }
    });
    const errors = [];

    let isValidDisplayName;
    if (displayName && displayName.length > 0) {
        const trimmedName = displayName ? displayName.trim() : null;
        if (trimmedName && trimmedName.length > 32) {
            errors.push(`Tried to set displayname to \"${displayName}\". ${enums.err.DISPLAY_NAME_TOO_LONG}. ${enums.err.SET_TO_NULL}`);
            isValidDisplayName = false;
        }
        else {
            isValidDisplayName = true;
        }
    }

    let isValidProxy;
    if (proxy && proxy.length > 0) {
        await mh.checkIfProxyExists(authorId, proxy).then(() => {
            isValidProxy = true;
        }).catch((e) => {
            errors.push(`Tried to set proxy to \"${proxy}\". ${e.message}. ${enums.err.SET_TO_NULL}`);
            isValidProxy = false;
        });
    }

    let isValidPropic;
    if (propic && propic.length > 0) {
        await mh.checkImageFormatValidity(propic).then(() => {
            isValidPropic = true;
        }).catch((e) => {
            errors.push(`Tried to set profile picture to \"${propic}\". ${e.message}. ${enums.err.SET_TO_NULL}`);
            isValidPropic = false;
        });
    }
    const member = await database.members.create({
        name: memberName, userid: authorId, displayname: isValidDisplayName ? displayName : null, proxy: isValidProxy ? proxy : null, propic: isValidPropic ? propic : null
    });

    return {member: member, errors: errors};
}

/**
 * Updates one fields for a member in the database.
 *
 * @async
 * @param {string} authorId - The author of the message
 * @param {string} memberName - The member to update
 * @param {string} columnName - The column name to update.
 * @param {string} value - The value to update to.
 * @param {string | null} attachmentExpiration - The attachment expiration date (if any)
 * @returns {Promise<string>} A successful update.
 * @throws {Error} When the member is not found, or catchall error.
 */
mh.updateMemberField = async function (authorId, memberName, columnName, value, attachmentExpiration = null) {
    let fluxerPropicWarning;

    // indicates that an attachment was uploaded on Fluxer directly
    if (columnName === "propic" && attachmentExpiration) {
        fluxerPropicWarning = mh.setExpirationWarning(value);
    }
    return await database.members.update({[columnName]: value}, {
        where: {
            name: {[Op.iLike]: memberName},
            userid: authorId
        }
    }).then((res) => {
            if (res[0] === 0) {
                throw new Error(`Can't update ${memberName}. ${enums.err.NO_MEMBER}.`);
            } else {
                return `Updated ${columnName} for ${memberName} to ${value}${fluxerPropicWarning ?? ''}.`;
            }
    })
}

/**
 * Sets the warning for an expiration date.
 *
 * @param {string} expirationString - An expiration date string.
 * @returns {string} A description of the expiration, interpolating the expiration string.
 */
mh.setExpirationWarning = function (expirationString) {
    let expirationDate = new Date(expirationString);
    if (!isNaN(expirationDate.valueOf())) {
        expirationDate = expirationDate.toDateString();
        return `\n**NOTE:** Because this profile picture was uploaded via Fluxer, it will currently expire on *${expirationDate}*. To avoid this, upload the picture to another website like <https://imgbb.com/> and link to it directly`
    }
}

/**
 * Gets the details for a member.
 *
 * @async
 * @param {string} authorId - The author of the message
 * @param {model} member - The member object
 * @returns {Promise<EmbedBuilder>} The member's info.
 */
mh.getMemberInfo = async function (authorId, member) {
    return new EmbedBuilder()
        .setTitle(member.name)
        .setDescription(`Details for ${member.name}`)
        .addFields({
            name: 'Display name: ',
            value: member.displayname ?? 'unset',
            inline: true
        }, {name: 'Proxy tag: ', value: member.proxy ?? 'unset', inline: true},)
        .setImage(member.propic);
}

/**
 * Gets all members for an author.
 *
 * @async
 * @param {string} authorId - The id of the message author
 * @param {string} authorName - The id name the message author
 * @returns {Promise<EmbedBuilder>} The info for all members.
 * @throws {Error} When there are no members for an author.
 */
mh.getAllMembersInfo = async function (authorId, authorName) {
    const members = await mh.getMembersByAuthor(authorId);
    if (members == null) throw Error(enums.err.USER_NO_MEMBERS);
    const fields = [...members.entries()].map(([name, member]) => ({
        name: member.name, value: `(Proxy: \`${member.proxy ?? "unset"}\`)`, inline: true,
    }));
    return new EmbedBuilder()
        .setTitle(`${fields > 25 ? "First 25 m" : "M"}embers for ${authorName}`)
        .addFields(...fields);
}

/**
 * Gets a member based on the author and proxy tag.
 *
 * @async
 * @param {string} authorId - The author of the message.
 * @param {string} memberName - The member's name.
 * @returns {Promise<model>} The member object.
 */
mh.getMemberByName = async function (authorId, memberName) {
    return await database.members.findOne({where: {userid: authorId, name: {[Op.iLike]: memberName}}});
}

/**
 * Gets all members belonging to the author.
 *
 * @async
 * @param {string} authorId - The author of the message
 * @returns {Promise<model[] | null>} The member object array.
 */
mh.getMembersByAuthor = async function (authorId) {
    return await database.members.findAll({where: {userid: authorId}});
}

/**
 * Checks if proxy exists for a member.
 *
 * @param {string} authorId - The author of the message
 * @param {string} proxy - The proxy tag.
 * @returns {Promise<boolean> } Whether the proxy exists.
 * @throws {Error} When an empty proxy was provided, or no proxy exists.
 */
mh.checkIfProxyExists = async function (authorId, proxy) {
    if (proxy) {
        const splitProxy = proxy.trim().split("text");
        if (splitProxy.length < 2) throw new Error(enums.err.NO_TEXT_FOR_PROXY);
        if (!splitProxy[0] && !splitProxy[1]) throw new Error(enums.err.NO_PROXY_WRAPPER);

        await mh.getMembersByAuthor(authorId).then((memberList) => {
            const proxyExists = memberList.some(member => member.proxy === proxy);
            if (proxyExists) {
                throw new Error(enums.err.PROXY_EXISTS);
            }
        }).catch(e => {
            throw e
        });
    }

}

/**
 * Creates an embed with all member commands
 *
 * @returns {EmbedBuilder } An embed of member commands.
 */
mh.getMemberCommandInfo = function() {
    const fields = [
        {name: `**new**`, value: enums.help.NEW, inline: false},
        {name: `**remove**`, value: enums.help.REMOVE, inline: false},
        {name: `**name**`, value: enums.help.NAME, inline: false},
        {name: `**displayname**`, value: enums.help.DISPLAY_NAME, inline: false},
        {name: `**proxy**`, value: enums.help.PROXY, inline: false},
        {name: `**propic**`, value: enums.help.PROPIC, inline: false},
        {name: `**list**`, value: enums.help.LIST, inline: false},
    ];
    return new EmbedBuilder()
        .setTitle("Member subcommands")
        .setDescription(enums.help.MEMBER)
        .addFields(...fields);
}


export const memberHelper = mh;