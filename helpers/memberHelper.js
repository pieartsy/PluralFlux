import { db } from '../sequelize.js';

const mh = {};

const errorEnums = {
    NO_MEMBER: "No member with that name was found",
    NO_NAME_PROVIDED: "No member name was provided for",
    NO_VALUE: "has not been set for this member.",
    ADD_ERROR: "Error adding member.",
    MEMBER_EXISTS: "A member with that name already exists."
}

mh.parse_member_command = async function(author_id, args){
    console.log(author_id, args);
    switch(args[0]) {
        case 'new':
            return await add_new_member(author_id, args);
        case 'delete':
            return await delete_member(author_id, args);
        case '':
            return `${errorEnums.NO_NAME_PROVIDED} querying.`
    }
    switch(args[1]) {
        case 'displayname':
            return await set_display_name(author_id, args);
        // case 'proxy':
        //     return await set_proxy(author_id, args);
        // case 'avatar':
        //     return await set_avatar(author_id, args)
        default:
            return await get_member_by_name(author_id, args);
    }
}

async function add_new_member(author_id, args) {
    const member_name = args[1];
    const display_name = args[2];
    const proxy = args[3];
    const propic = args[4];
    if (!member_name) {
        return `${errorEnums.NO_NAME_PROVIDED} adding.`;
    }
    const member = await get_member_by_name(author_id, member_name);
    if (member !== errorEnums.NO_MEMBER) {
        return errorEnums.MEMBER_EXISTS;
    }
    return await db.members.create({
        name: member_name,
        userid: author_id,
        displayname: display_name,
        proxy: proxy,
        propic: propic
    }).then((m) => {
        let success = `Member was successfully added.\nName: ${m.dataValues.name}`
        success += display_name ? `\nDisplay name: ${m.dataValues.displayname}` : "";
        success += proxy ? `\nProxy tag: ${m.dataValues.proxy} `: "";
        success += avatar ? `\nProfile picture: ${m.dataValues.proxy} `: "";
        return success;
    }).catch(e => {
        return `${errorEnums.ADD_ERROR}: ${e.message}`;
    })
}

async function get_member_by_name(author_id, member_name) {
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

async function set_display_name(author_id, args) {
    const member_name = args[0];
    const display_name = args[2];
    if (!member_name) {
        return `${errorEnums.NO_NAME_PROVIDED} display name.`;
    }
    else if (!display_name) {
        let member = await get_member_by_name(author_id, args);
        if (member.displayname) {
            return `Display name for ${member_name} is: ${member.displayname}.`;
        }
        return `Display name ${errorEnums.NO_VALUE}`
    }
    return await update_member(author_id, args);
}

async function update_member(author_id, args) {
    const member_name = args[0];
    const column_Name = args[1];
    const value = args[2];
    return await db.members.update({[column_Name]: value}, { where: { name: member_name, userid: author_id } }).then((updated_member) => {
        return `Updated ${column_Name} for ${member_name} to ${updated_member.dataValues[column_Name]}`;
    }).catch(e => {
        return `${errorEnums.NO_MEMBER}: ${e.message}`;
    });
}

async function delete_member(author_id, args) {
    const member_name = args[1];
    if (!member_name) {
        return `${errorEnums.NO_NAME_PROVIDED} deletion.`;
    }
    return await db.members.destroy({ where: { name: member_name, userid: author_id } }).then(() => {
        return `${member_name} deleted`;
    }).catch(e => {
        return `${errorEnums.NO_MEMBER}: ${e.message}`;
    });
}

mh.get_member_by_proxy = async function(author_id, proxy) {
    let member = await db.members.findOne({ where: { name: member_name, proxy: proxy } });
    if (member) {
        return member;
    }
    return errorEnums.NO_MEMBER;
}

export const memberHelper = mh;