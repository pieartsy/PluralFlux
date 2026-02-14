import { db } from '../sequelize.js';

const mh = {};

mh.parseMemberCommand = async function(authorId, args){
    console.log(authorId, args);
    if (!args) {
        return enums.help.MEMBER;
    }
    switch(args[0]) {
        case '--help':
            return enums.help.MEMBER;
        case 'add':
            return await addNewMember(authorId, args);
        case 'remove':
            return await removeMember(authorId, args);
    }
    switch(args[1]) {
        case '--help':
            return enums.help.MEMBER;
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
        return enums.help.ADD;
    }
    const memberName = args[1];
    const displayName = args[2];

    const member = await getMemberInfo(authorId, memberName);
    if (member !== errorEnums.NO_MEMBER) {
        return errorEnums.MEMBER_EXISTS;
    if (member !== enums.err.NO_MEMBER) {
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

async function updateDisplayName(authorId, args) {
    if (args[1] && args[1] === "--help" || !args[1]) {
        return enums.help.DISPLAYNAME;
    }

    const memberName = args[0];
    const displayName = args[2];
    const trimmed_name = displayName ? displayName.replaceAll(' ', '') : null;

    if (!displayName || trimmed_name === null ) {
        let member = getMemberInfo(authorId, args);
        if (member.displayname) {
            return `Display name for ${memberName} is: ${member.displayname}.`;
        }
        return `Display name ${enums.err.NO_VALUE}`
    }
    else if (displayName.count > 32) {
        return errorEnums.DISPLAY_NAME_TOO_LONG;
        return enums.err.DISPLAY_NAME_TOO_LONG;
    }
    console.log(displayName);
    return await updateMember(authorId, args);
}

async function updateProxy(authorId, args) {
    if (args[1] && args[1] === "--help" || !args[1]) {
        return enums.help.PROXY;
    }
    const proxy = args[2];
    const trimmedProxy = proxy ? proxy.replaceAll(' ', '') : null;

    if (trimmedProxy == null) {
        return;
    }

    const members = await mh.getMembersByAuthor(authorId);
    const proxyExists = members.some(member => member.proxy === proxy);
    if (proxyExists) {
        return enums.err.PROXY_EXISTS;
    }
    return await updateMember(authorId, args);
}

async function removeMember(authorId, args) {
    if (args[1] && args[1] === "--help") {
        return enums.help.REMOVE;
    }

    const memberName = args[1];
    if (!memberName) {
        return `${enums.err.NO_NAME_PROVIDED} deletion.`;
    }
    return await db.members.destroy({ where: { name: memberName, userid: authorId } }).then(() => {
        return `${memberName} has been deleted.`;
    }).catch(e => {
        return `${enums.err.NO_MEMBER}: ${e.message}`;
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
        return `${enums.err.NO_MEMBER}: ${e.message}`;
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
    return enums.err.NO_MEMBER;
}

mh.getMemberByProxy = async function(authorId, proxy) {
    return await db.members.findOne({ where: { userid: authorId, proxy: proxy } }).catch(e => {
        return `${enums.err.NO_MEMBER}: ${e.message}`;
    });
}

mh.getMembersByAuthor = async function(authorId) {
    return await db.members.findAll({ where: { userid: authorId } }).catch(e => {
        // I have no idea how this could possibly happen but better safe than sorry
        return `${enums.err.USER_NO_MEMBERS}: ${e.message}`;
    });
}


export const memberHelper = mh;