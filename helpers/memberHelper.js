import { db } from '../sequelize.js';

const mh = {};

const errorEnums = {
    NO_MEMBER: "No member was found.",
    NO_NAME_PROVIDED: "No member name was provided for",
    NO_VALUE: "has not been set for this member. Please provide a value.",
    ADD_ERROR: "Error adding member.",
    MEMBER_EXISTS: "A member with that name already exists. Please pick a unique name.",
    USER_NO_MEMBERS: "You have no members created.",
    DISPLAY_NAME_TOO_LONG: "The display name is too long. Please limit it to 32 characters or less.",
    PROXY_EXISTS: "A duplicate proxy already exists for one of your members. Please pick a new one, or change the old one first."
}

const helpEnums = {
    MEMBER: "You can shorten this command to `pf;m`. The available subcommands for `pf;member` are `add`, `remove`, `displayname`, and `proxy`. Add ` --help` to the end of a subcommand to find out more about it, or just send it without arguments.",
    ADD: "Creates a new member to proxy with: `pf;member jane`. The member name should ideally be short so you can write other commands with it. \nYou can optionally add a display name after the member name: `pf;member new jane \"Jane Doe | ze/hir\"`. If it has spaces, put it in **double quotes**. The length limit is 32 characters.",
    REMOVE: "Removes a member based on their name. `pf;member remove jane`.",
    DISPLAYNAME: "Updates the display name for a specific member based on their name. `pf;member jane \"Jane Doe | ze/hir\"`.This can be up to 32 characters long. If it has spaces, put it in quotes.",
    PROXY: "Updates the proxy tag for a specific member based on their name. `pf;member jane proxy Jane:`. This is put at **the start** of a message to allow it to be proxied. Proxies that wrap around text or go at the end are **not** currently supported."
}

mh.parseMemberCommand = async function(authorId, args){
    console.log(authorId, args);
    if (!args) {
        return helpEnums.MEMBER;
    }
    switch(args[0]) {
        case '--help':
            return helpEnums.MEMBER;
        case 'add':
            return await addNewMember(authorId, args);
        case 'remove':
            return await removeMember(authorId, args);
    }
    switch(args[1]) {
        case '--help':
            return helpEnums.MEMBER;
        case 'displayname':
            return await updateDisplayName(authorId, args);
        case 'proxy':
            return await updateProxy(authorId, args);
        // case 'avatar':
        //     return await set_avatar(authorId, args)
        default:
            return await getMemberInfo(authorId, args);
    }
}

async function addNewMember(authorId, args) {
    if (args[1] && args[1] === "--help" || !args[1]) {
        return helpEnums.ADD;
    }
    const memberName = args[1];
    const displayName = args[2];

    const member = await getMemberInfo(authorId, memberName);
    if (member !== errorEnums.NO_MEMBER) {
        return errorEnums.MEMBER_EXISTS;
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
        return `${errorEnums.ADD_ERROR}: ${e.message}`;
    })
}

async function updateDisplayName(authorId, args) {
    if (args[1] && args[1] === "--help" || !args[1]) {
        return helpEnums.DISPLAYNAME;
    }

    const memberName = args[0];
    const displayName = args[2];
    const trimmed_name = displayName ? displayName.replaceAll(' ', '') : null;

    if (!displayName || trimmed_name === null ) {
        let member = getMemberInfo(authorId, args);
        if (member.displayname) {
            return `Display name for ${memberName} is: ${member.displayname}.`;
        }
        return `Display name ${errorEnums.NO_VALUE}`
    }
    else if (displayName.count > 32) {
        return errorEnums.DISPLAY_NAME_TOO_LONG;
    }
    console.log(displayName);
    return await updateMember(authorId, args);
}

async function updateProxy(authorId, args) {
    if (args[1] && args[1] === "--help" || !args[1]) {
        return helpEnums.PROXY;
    }
    const proxy = args[2];
    const trimmedProxy = proxy ? proxy.replaceAll(' ', '') : null;

    if (trimmedProxy == null) {
        return;
    }

    const members = await mh.getMembersByAuthor(authorId);
    const proxyExists = members.some(member => member.proxy === proxy);
    if (proxyExists) {
        return errorEnums.PROXY_EXISTS;
    }
    return await updateMember(authorId, args);
}

async function removeMember(authorId, args) {
    if (args[1] && args[1] === "--help") {
        return helpEnums.REMOVE;
    }

    const memberName = args[1];
    if (!memberName) {
        return `${errorEnums.NO_NAME_PROVIDED} deletion.`;
    }
    return await db.members.destroy({ where: { name: memberName, userid: authorId } }).then(() => {
        return `${memberName} has been deleted.`;
    }).catch(e => {
        return `${errorEnums.NO_MEMBER}: ${e.message}`;
    });
}

/* non-commands */
async function updateMember(authorId, args) {
    const memberName = args[0];
    const columnName = args[1];
    const value = args[2];
    return await db.members.update({[columnName]: value}, { where: { name: memberName, userid: authorId } }).then(() => {
        return `Updated ${columnName} for ${memberName} to ${value}`;
    }).catch(e => {
        return `${errorEnums.NO_MEMBER}: ${e.message}`;
    });
}

async function getMemberInfo(authorId, memberName) {
    let member = await db.members.findOne({ where: { name: memberName, userid: authorId } });
    if (member) {
        let member_info = `Member name: ${member.name}`;
        member_info += member.displayname ? `\nDisplay name: ${member.displayname}` : '\nDisplay name: unset';
        member_info += member.proxy ? `\nProxy Tag: ${member.proxy}` : '\nProxy tag: unset';
        member_info += member.propic ? `\nProfile pic: ${member.propic}` : '\nProfile pic: unset';
        return member_info;
    }
    return errorEnums.NO_MEMBER;
}

mh.getMemberByProxy = async function(authorId, proxy) {
    return await db.members.findOne({ where: { userid: authorId, proxy: proxy } }).catch(e => {
        return `${errorEnums.NO_MEMBER}: ${e.message}`;
    });
}

mh.getMembersByAuthor = async function(authorId) {
    return await db.members.findAll({ where: { userid: authorId } }).catch(e => {
        // I have no idea how this could possibly happen but better safe than sorry
        return `${errorEnums.USER_NO_MEMBERS}: ${e.message}`;
    });
}


export const memberHelper = mh;