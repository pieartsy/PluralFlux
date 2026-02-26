import {database} from '../database.js';
import {enums} from "../enums.js";
import {Op} from "sequelize";
import {EmbedBuilder} from "@fluxerjs/core";
import {utils} from "./utils.js";

const mh = {};

const commandList = ['new', 'remove', 'name', 'list', 'displayname', 'proxy', 'propic'];
const newAndRemoveCommands = ['new', 'remove'];

/**
 * Parses through the subcommands that come after "pf;member" to identify member name, command, and associated values.
 *
 * @async
 * @param {string} authorId - The id of the message author
 * @param {string} authorFull - The username and discriminator of the message author
 * @param {string[]} args - The message arguments
 * @param {string | null} [attachmentUrl] - The attachment URL, if any
 * @param {string | null} [attachmentExpiration] - The attachment expiry date, if any
 * @returns {Promise<string>} A success message.
 * @returns {Promise <EmbedBuilder>} A list of 25 members as an embed.
 * @returns {Promise <EmbedBuilder>} A list of member commands and descriptions.
 * @returns {Promise<{EmbedBuilder, string[], string}>} A member info embed + info/errors.
 */
mh.parseMemberCommand = async function (authorId, authorFull, args, attachmentUrl = null, attachmentExpiration = null) {
    let memberName, command, isHelp = false;
    // checks whether command is in list, otherwise assumes it's a name

    // ex: pf;member remove, pf;member remove --help
    // ex: pf;member, pf;member --help
    if (args.length === 0 || args[0] === '--help' || args[0] === '') {
        return mh.getMemberCommandInfo();
    }
    // ex: pf;member remove somePerson
    if (commandList.includes(args[0])) {
        command = args[0];
        if (args[1]) {
            memberName = args[1];
        }
    }
    // ex: pf;member somePerson propic
    else if (args[1] && commandList.includes(args[1])) {
        command = args[1];
        memberName = args[0];
    }
    // ex: pf;member somePerson
    else if (!commandList.includes(args[0]) && !args[1]) {
        memberName = args[0];
    }
    if (args[1] === "--help" || command && (memberName === "--help" || !memberName && command !== 'list')) {
        isHelp = true;
    }

    return await mh.memberArgumentHandler(authorId, authorFull, isHelp, command, memberName, args, attachmentUrl, attachmentExpiration)
}

/**
 * Parses through the command, argument, and values and calls appropriate functions based on their presence or absence.
 *
 * @async
 * @param {string} authorId - The id of the message author
 * @param {string} authorFull - The username and discriminator of the message author
 * @param {boolean} isHelp - Whether this is a help command or not
 * @param {string | null} [command] - The command name
 * @param {string | null} [memberName] - The member name
 * @param {string[]} [args] - The message arguments
 * @param {string | null} [attachmentUrl] - The attachment URL, if any
 * @param {string | null} [attachmentExpiration] - The attachment expiry date, if any
 * @returns {Promise<string>} A success message.
 * @returns {Promise <EmbedBuilder>} A list of 25 members as an embed.
 * @returns {Promise <EmbedBuilder>} A list of member commands and descriptions.
 * @returns {Promise<{EmbedBuilder, [string], string}>} A member info embed + info/errors.
 * @throws {Error} When there's no member or a command is not recognized.
 */
mh.memberArgumentHandler = async function(authorId, authorFull, isHelp, command = null, memberName = null, args = [], attachmentUrl = null, attachmentExpiration = null) {
    if (!command && !memberName && !isHelp) {
        throw new Error(enums.err.COMMAND_NOT_RECOGNIZED);
    }
    else if (isHelp) {
        return mh.sendHelpEnum(command);
    }
    else if (command === "list") {
        return await mh.getAllMembersInfo(authorId, authorFull);
    }
    else if (!memberName && !isHelp) {
        throw new Error(enums.err.NO_MEMBER);
    }

    // remove memberName and command from values to reduce confusion
    const values = args.slice(2);

    // ex: pf;member blah blah
    if (command && memberName && (values.length > 0 || newAndRemoveCommands.includes(command) || attachmentUrl)) {
        return await mh.memberCommandHandler(authorId, command, memberName, values, attachmentUrl, attachmentExpiration);
    }
    else if (memberName && values.length === 0) {
        return await mh.sendCurrentValue(authorId, memberName, command);
    }
}

/**
 * Sends the current value of a field based on the command.
 *
 * @async
 * @param {string} authorId - The id of the message author
 * @param {string} memberName - The name of the member
 * @param {string | null} [command] - The command being called to query a value.
 * @returns {Promise<string>} A success message.
 * @returns {Promise <EmbedBuilder>} A list of 25 members as an embed.
 * @returns {Promise <EmbedBuilder>} A list of member commands and descriptions.
 * @returns {Promise<{EmbedBuilder, string[], string}>} A member info embed + info/errors.
 * @throws {Error} When there's no member
 */
mh.sendCurrentValue = async function(authorId, memberName, command= null) {
    const member = await mh.getMemberByName(authorId, memberName);
    if (!member) throw new Error(enums.err.NO_MEMBER);

    if (!command) {
        return mh.getMemberInfo(member);
    }

    switch (command) {
        case 'name':
            return `The name of ${member.name} is \"${member.name}\" but you probably already knew that!`;
        case 'displayname':
            return member.displayname ? `The display name for ${member.name} is \"${member.displayname}\".` : `Display name ${enums.err.NO_VALUE}`;
        case 'proxy':
            return member.proxy ? `The proxy for ${member.name} is \"${member.proxy}\".` : `Proxy ${enums.err.NO_VALUE}`;
        case 'propic':
            return member.propic ? `The profile picture for ${member.name} is \"${member.propic}\".` : `Propic ${enums.err.NO_VALUE}`;
    }
}

/**
 * Sends the help text associated with a command.
 *
 * @param {string} command - The command being called.
 * @returns {string} - The help text associated with a command.
 */
mh.sendHelpEnum = function(command) {
    switch (command) {
        case 'new':
            return enums.help.NEW;
        case 'remove':
            return enums.help.REMOVE;
        case 'name':
            return enums.help.NAME;
        case 'displayname':
            return enums.help.DISPLAY_NAME;
        case 'proxy':
            return enums.help.PROXY;
        case 'propic':
            return enums.help.PROPIC;
        case 'list':
            return enums.help.LIST;
    }
}

/**
 * Handles the commands that need to call other update/edit commands.
 *
 * @async
 * @param {string} authorId - The id of the message author
 * @param {string} memberName - The name of the member
 * @param {string} command - The command being called.
 * @param {string[]} values - The values to be passed in. Only includes the values after member name and command name.
 * @param {string | null} attachmentUrl - The attachment URL, if any
 * @param {string | null} attachmentExpiration - The attachment expiry date, if any
 * @returns {Promise<string>} A success message.
 * @returns {Promise <EmbedBuilder>} A list of 25 members as an embed.
 * @returns {Promise <EmbedBuilder>} A list of member commands and descriptions.
 * @returns {Promise<{EmbedBuilder, [string], string}>} A member info embed + info/errors.
 */
mh.memberCommandHandler = async function(authorId, command, memberName, values, attachmentUrl = null, attachmentExpiration = null) {
    switch (command) {
        case 'new':
            return await mh.addNewMember(authorId, memberName, values, attachmentUrl, attachmentExpiration);
        case 'remove':
            return await mh.removeMember(authorId, memberName);
        case 'name':
            return await mh.updateName(authorId, memberName, values[0]);
        case 'displayname':
            return await mh.updateDisplayName(authorId, memberName, values[0]);
        case 'proxy':
            return await mh.updateProxy(authorId, memberName, values[0]);
        case 'propic':
            return await mh.updatePropic(authorId, memberName, values[0], attachmentUrl, attachmentExpiration);
        default:
            throw new Error(enums.err.COMMAND_NOT_RECOGNIZED);
    }
}

/**
 * Adds a member.
 *
 * @async
 * @param {string} authorId - The author of the message
 * @param {string} memberName - The member name
 * @param {string[]} values - The arguments following the member name and command
 * @param {string | null} [attachmentUrl] - The attachment URL, if any
 * @param {string | null} [attachmentExpiration] - The attachment expiry date, if any
 * @returns {Promise<{EmbedBuilder, string[], string}>} A successful addition.
 */
mh.addNewMember = async function (authorId, memberName, values, attachmentUrl = null, attachmentExpiration = null) {
    const displayName = values[0];
    const proxy = values[1];
    const propic = values[2] ?? attachmentUrl;

    const memberObj = await mh.addFullMember(authorId, memberName, displayName, proxy, propic, attachmentExpiration);
    const memberInfoEmbed = mh.getMemberInfo(memberObj.member);
    return {embed: memberInfoEmbed, errors: memberObj.errors, success: `${memberName} has been added successfully.`}
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
    const trimmedName = name.trim();
    if (trimmedName === '') {
        throw new RangeError(`Name ${enums.err.NO_VALUE}`);
    }
    return await mh.updateMemberField(authorId, memberName, "name", trimmedName);
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
    const trimmedName = displayname.trim();

    if (trimmedName.length > 32) {
        throw new RangeError(enums.err.DISPLAY_NAME_TOO_LONG);
    }
    else if (trimmedName === '') {
        throw new RangeError(`Display name ${enums.err.NO_VALUE}`);
    }
    return await mh.updateMemberField(authorId, membername, "displayname", trimmedName);
}

/**
 * Updates the proxy for a member, first checking that no other members attached to the author have the tag.
 *
 * @async
 * @param {string} authorId - The author of the message
 * @param {string} memberName - The member to update
 * @param {string} proxy - The proxy to set
 * @returns {Promise<string> } A successful update.
 */
mh.updateProxy = async function (authorId, memberName, proxy) {
    // Throws error if exists
    await mh.checkIfProxyExists(authorId, proxy);

    return await mh.updateMemberField(authorId, memberName, "proxy", proxy);
}

/**
 * Updates the profile pic for a member, based on either the attachment or the args provided.
 *
 * @async
 * @param {string} authorId - The author of the message
 * @param {string} memberName - The member to update
 * @param {string} values - The message arguments
 * @param {string | null} attachmentUrl - The attachment URL, if any
 * @param {string | null} attachmentExpiration - The attachment expiry date, if any
 * @returns {Promise<string>} A successful update.
 */
mh.updatePropic = async function (authorId, memberName, values, attachmentUrl = null, attachmentExpiration = null) {
    const imgUrl = values ?? attachmentUrl;
    // Throws error if invalid
    await utils.checkImageFormatValidity(imgUrl);
    const expirationWarning = utils.setExpirationWarning(imgUrl, attachmentExpiration);
    return await mh.updateMemberField(authorId, memberName, "propic", imgUrl, expirationWarning);
}

/**
 * Removes a member.
 *
 * @async
 * @param {string} authorId - The author of the message
 * @param {string} memberName - The name of the member to remove
 * @returns {Promise<string>} A successful removal.
 * @throws {Error} When there is no member to remove.
 */
mh.removeMember = async function (authorId, memberName) {
    const destroyed = await database.members.destroy({
        where: {
            name: {[Op.iLike]: memberName},
            userid: authorId
        }
    })
    if (destroyed > 0) {
        return `Member "${memberName}" has been deleted.`;
    } else {
        throw new Error(`${enums.err.NO_MEMBER}`);
    }
}

/*======Non-Subcommands======*/

/**
 * Adds a member with full details, first checking that there is no member of that name associated with the author.
 *
 * @async
 * @param {string} authorId - The author of the message
 * @param {string} memberName - The name of the member.
 * @param {string | null} [displayName] - The display name of the member.
 * @param {string | null} [proxy] - The proxy tag of the member.
 * @param {string | null} [propic] - The profile picture URL of the member.
 * @param {string | null} [attachmentExpiration] - The expiration date of an uploaded profile picture.
 * @returns {Promise<{model, string[]}>} A successful addition object, including errors if there are any.
 * @throws {Error}  When the member already exists, there are validation errors, or adding a member doesn't work.
 */
mh.addFullMember = async function (authorId, memberName, displayName = null, proxy = null, propic = null, attachmentExpiration = null) {
    const existingMember = await mh.getMemberByName(authorId, memberName);
    if (existingMember) {
        throw new Error(`Can't add ${memberName}. ${enums.err.MEMBER_EXISTS}`);
    }
    const errors = [];

    const trimmedName = memberName.trim();
    if (trimmedName.length === 0) {
        throw new Error(`Name ${enums.err.NO_VALUE}. ${enums.err.NAME_REQUIRED}`);
    }

    let isValidDisplayName;
    if (displayName) {
        const trimmedDisplayName= displayName ? displayName.trim() : null;
        if (!trimmedDisplayName || trimmedDisplayName.length === 0) {
            errors.push(`Display name ${enums.err.NO_VALUE}. ${enums.err.SET_TO_NULL}`);
            isValidDisplayName = false;
        }
        else if (trimmedDisplayName.length > 32) {
            errors.push(`Tried to set displayname to \"${displayName}\". ${enums.err.DISPLAY_NAME_TOO_LONG}. ${enums.err.SET_TO_NULL}`);
            isValidDisplayName = false;
        }
        else {
            isValidDisplayName = true;
        }
    }

    let isValidProxy;
    if (proxy && proxy.length > 0) {
        try {
            const proxyExists = await mh.checkIfProxyExists(authorId, proxy);
            isValidProxy = !proxyExists;
        }
        catch(e) {
            errors.push(`Tried to set proxy to \"${proxy}\". ${e.message}. ${enums.err.SET_TO_NULL}`);
            isValidProxy = false;
        }
    }

    let isValidPropic;
    if (propic && propic.length > 0) {
        try {
            isValidPropic = await utils.checkImageFormatValidity(propic);
        }
        catch(e) {
            errors.push(`Tried to set profile picture to \"${propic}\". ${e.message}. ${enums.err.SET_TO_NULL}`);
            isValidPropic = false;
        }
    }
    const expirationWarning = utils.setExpirationWarning(propic, attachmentExpiration);
    if (expirationWarning) {
        errors.push(expirationWarning);
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
 * @param {string | null} [expirationWarning] - The attachment expiration warning (if any)
 * @returns {Promise<string>} A successful update.
 * @throws {Error} When no member row was updated.
 */
mh.updateMemberField = async function (authorId, memberName, columnName, value, expirationWarning = null) {
    const res = await database.members.update({[columnName]: value}, {
        where: {
            name: {[Op.iLike]: memberName},
            userid: authorId
        }
    })
    if (res[0] === 0) {
        throw new Error(`Can't update ${memberName}. ${enums.err.NO_MEMBER}.`);
    } else {
        return `Updated ${columnName} for ${memberName} to ${value}${expirationWarning ? `. ${expirationWarning}.` : '.'}`;
    }
}

/**
 * Gets the details for a member.
 *
 * @param {model} member - The member object
 * @returns {EmbedBuilder} The member's info.
 */
mh.getMemberInfo = function (member) {
    return new EmbedBuilder()
        .setTitle(member.name)
        .setDescription(`Details for ${member.name}`)
        .addFields({
            name: 'Display name: ',
            value: member.displayname ?? 'unset',
            inline: true
        }, {name: 'Proxy tag: ', value: member.proxy ?? 'unset', inline: true},)
        .setImage(member.propic ?? null);
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
    if (members.length === 0) throw Error(enums.err.USER_NO_MEMBERS);
    const fields = [...members.entries()].map(([index, member]) => ({
        name: member.name, value: `(Proxy: \`${member.proxy ?? "unset"}\`)`, inline: true,
    }));
    return new EmbedBuilder()
        .setTitle(`${fields.length > 25 ? "First 25 m" : "M"}embers for ${authorName}`)
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
    const splitProxy = proxy.trim().split("text");
    if (splitProxy.length < 2) throw new Error(enums.err.NO_TEXT_FOR_PROXY);
    if (!splitProxy[0] && !splitProxy[1]) throw new Error(enums.err.NO_PROXY_WRAPPER);

    const memberList = await mh.getMembersByAuthor(authorId);
    const proxyExists = memberList.some(member => member.proxy === proxy);
    if (proxyExists) {
        throw new Error(enums.err.PROXY_EXISTS);
    }
    return false;
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