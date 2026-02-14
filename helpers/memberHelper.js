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
    MEMBER: "You can shorten this command to `pf;m`. The available subcommands for `pf;member` are `add`, `remove`, `displayname`, and `proxy`. Add ` --help` to the end of a subcommand to find out more about it.",
    ADD: "Creates a new member to proxy with: `pf;member jane`. The member name should ideally be short so you can write other commands with it. \nYou can optionally add a display name after the member name: `pf;member new jane \"Jane Doe | ze/hir\"`. If it has spaces, put it in **double quotes**. The length limit is 32 characters.",
    REMOVE: "Removes a member based on their name. `pf;member remove jane`.",
    DISPLAYNAME: "Updates the display name for a specific member based on their name. `pf;member jane \"Jane Doe | ze/hir\"`.This can be up to 32 characters long. If it has spaces, put it in quotes.",
    PROXY: "Updates the proxy tag for a specific member based on their name. `pf;member jane proxy Jane:`. This is put at **the start** of a message to allow it to be proxied. Proxies that wrap around text or go at the end are **not** currently supported."
}

mh.parse_member_command = async function(author_id, args){
    console.log(author_id, args);
    if (!args) {
        return `${errorEnums.NO_NAME_PROVIDED} querying.`
    }
    switch(args[0]) {
        case '--help':
            return helpEnums.MEMBER;
        case 'add':
            return await add_new_member(author_id, args);
        case 'remove':
            return await remove_member(author_id, args);
    }
    switch(args[1]) {
        case '--help':
            return helpEnums.MEMBER;
        case 'displayname':
            return await update_display_name(author_id, args);
        case 'proxy':
            return await update_proxy(author_id, args);
        // case 'avatar':
        //     return await set_avatar(author_id, args)
        default:
            return await get_member_info(author_id, args);
    }
}

async function add_new_member(author_id, args) {
    const member_name = args[1];
    const display_name = args[2];
    if (!member_name) {
        return `${errorEnums.NO_NAME_PROVIDED} adding.`;
    }
    const member = await get_member_info(author_id, member_name);
    if (member !== errorEnums.NO_MEMBER) {
        return errorEnums.MEMBER_EXISTS;
    }
    const trimmed_name = display_name ? display_name.replaceAll(' ', '') : null;
    return await db.members.create({
        name: member_name,
        userid: author_id,
        displayname: trimmed_name !== null ? display_name : null,
    }).then((m) => {
        let success = `Member was successfully added.\nName: ${m.dataValues.name}`
        success += display_name ? `\nDisplay name: ${m.dataValues.displayname}` : "";
        return success;
    }).catch(e => {
        return `${errorEnums.ADD_ERROR}: ${e.message}`;
    })
}

async function get_member_info(author_id, member_name) {
    let member = await db.members.findOne({ where: { name: member_name, userid: author_id } });
    if (member) {
        let member_info = `Member name: ${member.name}`;
        member_info += member.displayname ? `\nDisplay name: ${member.displayname}` : '\nDisplay name: unset';
        member_info += member.proxy ? `\nProxy Tag: ${member.proxy}` : '\nProxy tag: unset';
        member_info += member.propic ? `\nProfile pic: ${member.propic}` : '\nProfile pic: unset';
        return member_info;
    }
    return errorEnums.NO_MEMBER;
}

async function update_display_name(author_id, args) {
    const member_name = args[0];
    const display_name = args[2];
    const trimmed_name = display_name ? display_name.replaceAll(' ', '') : null;
    console.log(trimmed_name, display_name);
    if (!member_name) {
        return `${errorEnums.NO_NAME_PROVIDED} display name.`;
    }
    else if (!display_name || trimmed_name === null ) {
        let member = await get_member_info(author_id, args);
        console.log(member.displayname);
        if (member.displayname) {
            return `Display name for ${member_name} is: ${member.displayname}.`;
        }
        return `Display name ${errorEnums.NO_VALUE}`
    }
    else if (display_name.count > 32) {
        return errorEnums.DISPLAY_NAME_TOO_LONG;
    }
    console.log(display_name);
    return await update_member(author_id, args);
}

async function update_proxy(author_id, args) {
    const proxy = args[2];
    const trimmed_proxy = proxy ? proxy.replaceAll(' ', '') : null;

    if (trimmed_proxy == null) {
        return;
    }

    const members = await mh.get_members_by_author(author_id);
    const proxyExists = members.some(member => member.proxy === proxy);
    if (proxyExists) {
        return errorEnums.PROXY_EXISTS;
    }
    return await update_member(author_id, args);
}

async function update_member(author_id, args) {
    const member_name = args[0];
    const column_Name = args[1];
    const value = args[2];
    return await db.members.update({[column_Name]: value}, { where: { name: member_name, userid: author_id } }).then(() => {
        return `Updated ${column_Name} for ${member_name} to ${value}`;
    }).catch(e => {
        return `${errorEnums.NO_MEMBER}: ${e.message}`;
    });
}

async function remove_member(author_id, args) {
    const member_name = args[1];
    if (!member_name) {
        return `${errorEnums.NO_NAME_PROVIDED} deletion.`;
    }
    return await db.members.destroy({ where: { name: member_name, userid: author_id } }).then(() => {
        return `${member_name} has been deleted.`;
    }).catch(e => {
        return `${errorEnums.NO_MEMBER}: ${e.message}`;
    });
}

mh.get_member_by_proxy = async function(author_id, proxy) {
    return await db.members.findOne({ where: { userid: author_id, proxy: proxy } }).catch(e => {
        return `${errorEnums.NO_MEMBER}: ${e.message}`;
    });
}

mh.get_members_by_author = async function(author_id) {
    return await db.members.findAll({ where: { userid: author_id } }).catch(e => {
        // I have no idea how this could possibly happen but better safe than sorry
        return `${errorEnums.USER_NO_MEMBERS}: ${e.message}`;
    });
}


export const memberHelper = mh;