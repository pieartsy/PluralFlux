const Member = require("../../database/entity/Member");
const { AppDataSource } = require("../../database/data-source");
const {ILike} = require("typeorm");
const members = AppDataSource.getRepository(Member.Members)

const memberRepo = {};

/**
 * Gets a member based on the author and proxy tag.
 *
 * @async
 * @param {string} authorId - The author of the message.
 * @param {string} memberName - The member's name.
 * @returns {Promise<ObjectLiteral[] | null>} The member object or null if not found.
 */
memberRepo.getMemberByName = async function (authorId, memberName) {
    const member = await members.findOneBy({where: {userid: authorId, name: ILike(`%${memberName}%`)}});
    return member.generatedMaps;
}

/**
 * Gets all members belonging to the author.
 *
 * @async
 * @param {string} authorId - The author of the message
 * @returns {Promise<Entity[]>} The member object array.
 */
memberRepo.getMembersByAuthor = async function (authorId) {
    return await members.findBy({userid: authorId});
}

/**
 * Removes a member.
 *
 * @async
 * @param {string} authorId - The author of the message
 * @param {string} memberName - The name of the member to remove
 * @returns {Promise<number>} Number of results removed.
 * @throws {Error} When there is no member to remove.
 */
memberRepo.removeMember = async function (authorId, memberName) {
    const deleted = await members.delete({
        where: {
            name: ILike(`%${memberName}%`),
            userid: authorId
        }
    })
    return deleted.affected;
}

/**
 * Adds a member with full details.
 *
 * @async
 * @param {{name: string, userid: string, displayname: (string|null), proxy: (string|null), propic: (string|null)}} createObj - Object with parameters in it
 * @returns {Promise<ObjectLiteral[]>} A successful inserted object.
 * @throws {Error}  When the member already exists, there are validation errors, or adding a member doesn't work.
 */
memberRepo.createMember = async function (createObj) {
    const member = members.insert({
        name: createObj.name, userid: createObj.authorId, displayname: createObj.displayName, proxy: createObj.proxy, propic: createObj.propic
    });
    return member.generatedMaps;
}

/**
 * Updates one fields for a member in the database.
 *
 * @async
 * @param {string} authorId - The author of the message
 * @param {string} memberName - The member to update
 * @param {string} columnName - The column name to update.
 * @param {string} value - The value to update to.
 * @returns {Promise<number>} A successful update.
 * @throws {Error} When no member row was updated.
 */
memberRepo.updateMemberValue = async function (authorId, memberName, columnName, value) {
    const updated = members.update({columnName: value}, {
        where: {
            name: ILike(`%${memberName}%`),
            userid: authorId
        }
    })
    return updated.affected;
}

module.exports.memberRepo = memberRepo;