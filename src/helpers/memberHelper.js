const { database } = require('../db.js')
const { enums} = require('../enums.js');
const {EmptyResultError, Op} = require('sequelize');
const {EmbedBuilder} = require('@fluxerjs/core');

const memberHelper = {


    // Has an empty "command" to parse the help message properly
    commandList: ['--help', 'new', 'remove', 'name', 'list', 'displayName', 'proxy', 'propic', ''],

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
    async parseMemberCommand (authorId, authorFull, args, attachmentUrl = null, attachmentExpiration = null){
        let member;
        // checks whether command is in list, otherwise assumes it's a name
        if(!this.commandList.includes(args[0])) {
            member = await this.getMemberInfo(authorId, args[0]);
        }
        switch(args[0]) {
            case '--help':
                return enums.help.MEMBER;
            case 'new':
                return await this.addNewMember(authorId, args).catch((e) =>{throw e});
            case 'remove':
                return await this.removeMember(authorId, args).catch((e) =>{throw e});
            case 'name':
                return enums.help.NAME;
            case 'displayname':
                return enums.help.DISPLAY_NAME;
            case 'proxy':
                return enums.help.PROXY;
            case 'propic':
                return enums.help.PROPIC;
            case 'list':
                if (args[1] && args[1] === "--help") {
                    return enums.help.LIST;
                }
                return await this.getAllMembersInfo(authorId, authorFull).catch((e) =>{throw e});
            case '':
                return enums.help.MEMBER;
        }
        switch(args[1]) {
            case 'name':
                return await this.updateName(authorId, args).catch((e) =>{throw e});
            case 'displayname':
                return await this.updateDisplayName(authorId, args).catch((e) =>{throw e});
            case 'proxy':
                if (!args[2]) return await this.getProxyByMember(authorId, args[0]).catch((e) => {throw e});
                return await this.updateProxy(authorId, args).catch((e) =>{throw e});
            case 'propic':
                return await this.updatePropic(authorId, args, attachmentUrl, attachmentExpiration).catch((e) =>{throw e});
            default:
                return member;
        }
    },

    /**
     * Adds a member.
     *
     * @async
     * @param {string} authorId - The author of the message
     * @param {string[]} args - The message arguments
     * @returns {Promise<string>} A successful addition.
     * @throws {Error}  When the member exists, or creating a member doesn't work.
     */
    async addNewMember (authorId, args) {
        if (args[1] && args[1] === "--help" || !args[1]) {
            return enums.help.NEW;
        }
        const memberName = args[1];
        const displayName = args[2];

        return await this.addFullMember(authorId, memberName, displayName).then((member) => {
            let success = `Member was successfully added.\nName: ${member.dataValues.name}`
            success += displayName ? `\nDisplay name: ${member.dataValues.displayname}` : "";
            return success;
        }).catch(e => {
            throw e;
        })
    },

    /**
     * Updates the name for a member.
     *
     * @async
     * @param {string} authorId - The author of the message
     * @param {string[]} args - The message arguments
     * @returns {Promise<string>} A successful update.
     * @throws {RangeError} When the name doesn't exist.
     */
    async updateName  (authorId, args) {
        if (args[1] && args[1] === "--help" || !args[1]) {
            return enums.help.DISPLAY_NAME;
        }

        const name = args[2];
        const trimmedName = name ? name.trim() : null;
        if (!name || trimmedName === null) {
            throw new RangeError(`Display name ${enums.err.NO_VALUE}`);
        }
        return await this.updateMemberField(authorId, args).catch((e) =>{throw e});
    },

    /**
     * Updates the display name for a member.
     *
     * @async
     * @param {string} authorId - The author of the message
     * @param {string[]} args - The message arguments
     * @returns {Promise<string>} A successful update.
     * @throws {RangeError} When the display name is too long or doesn't exist.
     */
    async updateDisplayName (authorId, args) {
        if (args[1] && args[1] === "--help" || !args[1]) {
            return enums.help.DISPLAY_NAME;
        }

        const memberName = args[0];
        const displayName = args[2];
        const trimmedName = displayName ? displayName.trim() : null;

        if (!displayName || trimmedName === null ) {
            return await this.getMemberByName(authorId, memberName).then((member) => {
                if (member && member.displayname) {
                    return `Display name for ${memberName} is: \"${member.displayname}\".`;
                }
                else if (member) {
                    throw new RangeError(`Display name ${enums.err.NO_VALUE}`);
                }
            });
        }
        else if (displayName.length > 32) {
            throw new RangeError(enums.err.DISPLAY_NAME_TOO_LONG);
        }
        return await this.updateMemberField(authorId, args).catch((e) =>{throw e});
    },

    /**
     * Updates the proxy for a member, first checking that no other members attached to the author have the tag.
     *
     * @async
     * @param {string} authorId - The author of the message
     * @param {string[]} args - The message arguments
     * @returns {Promise<string> } A successful update.
     * @throws {RangeError | Error} When an empty proxy was provided, or no proxy exists.
     */
    async updateProxy (authorId, args) {
        if (args[2] && args[2] === "--help") {
            return enums.help.PROXY;
        }
        const proxyExists = await this.checkIfProxyExists(authorId, args[2]).then((proxyExists) => {
            return proxyExists;
        }).catch((e) =>{throw e});
        if (!proxyExists) {
            return await this.updateMemberField(authorId, args).catch((e) =>{throw e});
        }
    },

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
    async updatePropic (authorId, args, attachmentUrl, attachmentExpiry= null) {
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
        const isValidImage = await this.checkImageFormatValidity(img).catch((e) =>{throw e});
        if (isValidImage) {
            return await this.updateMemberField(authorId, updatedArgs).catch((e) =>{throw e});
        }
    },

    /**
     * Checks if an uploaded picture is in the right format.
     *
     * @async
     * @param {string} imageUrl - The url of the image
     * @returns {Promise<boolean>} - If the image is a valid format.
     * @throws {Error} When loading the profile picture from a URL doesn't work, or it fails requirements.
     */
    async checkImageFormatValidity (imageUrl) {
        const acceptableImages = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
        return await fetch(imageUrl).then(r => r.blob()).then(blobFile => {
            if (blobFile.size > 1000000 || !acceptableImages.includes(blobFile.type)) throw new Error(enums.err.PROPIC_FAILS_REQUIREMENTS);
            return true;
        }).catch((error) => {
            throw new Error(`${enums.err.PROPIC_CANNOT_LOAD}: ${error.message}`);
        });
    },

    /**
     * Removes a member.
     *
     * @async
     * @param {string} authorId - The author of the message
     * @param {string[]} args - The message arguments
     * @returns {Promise<string>} A successful removal.
     * @throws {EmptyResultError} When there is no member to remove.
     */
    async removeMember (authorId, args) {
        if (args[1] && args[1] === "--help" || !args[1]) {
            return enums.help.REMOVE;
        }

        const memberName = args[1];
        return await database.members.destroy({ where: { name: {[Op.iLike]: memberName}, userid: authorId } }).then((result) => {
            if (result) {
                return `Member "${memberName}" has been deleted.`;
            }
            throw new EmptyResultError(`${enums.err.NO_MEMBER}`);
        })
    },

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
     * @param {boolean} isImport - Whether calling from the import or not.
     * @returns {Promise<model>} A successful addition.
     * @throws {Error | RangeError}  When the member already exists, there are validation errors, or adding a member doesn't work.
     */
    async addFullMember (authorId, memberName, displayName = null, proxy = null, propic= null, isImport = false) {
        await this.getMemberByName(authorId, memberName).then((member) => {
            if (member) {
                throw new Error(`Can't add ${memberName}. ${enums.err.MEMBER_EXISTS}`);
            }
        });
        if (displayName) {
            const trimmedName = displayName ? displayName.trim() : null;
            if (trimmedName && trimmedName.length > 32) {
                throw new RangeError(`Can't add ${memberName}. ${enums.err.DISPLAY_NAME_TOO_LONG}`);
            }
        }
        if (proxy) {
            await this.checkIfProxyExists(authorId, proxy).catch((e) =>{throw e});
        }
        let validPropic;
        if (propic) {
            validPropic = await this.checkImageFormatValidity(propic).then((valid) => {
                return valid;
            }).catch((e) =>{
                if (!isImport) {
                    throw (e);
                }
                return false;
            });
        }

        const member = await database.members.create({
            name: memberName,
            userid: authorId,
            displayname: displayName,
            proxy: proxy,
            propic: validPropic ? propic : null,
        });
        if (!member) {
            new Error(`${enums.err.ADD_ERROR}`);
        }
    },

    /**
     * Updates one fields for a member in the database.
     *
     * @async
     * @param {string} authorId - The author of the message
     * @param {string[]} args - The message arguments
     * @returns {Promise<string>} A successful update.
     * @throws {EmptyResultError | Error} When the member is not found, or catchall error.
     */
    async updateMemberField (authorId, args) {
        const memberName = args[0];
        const columnName = args[1];
        const value = args[2];
        let fluxerPropicWarning;

        // indicates that an attachment was uploaded on Fluxer directly
        if (columnName === "propic" && args[3]) {
            fluxerPropicWarning = this.setExpirationWarning(args[3]);
        }
        return await database.members.update({[columnName]: value}, { where: { name: {[Op.iLike]: memberName}, userid: authorId } }).then(() => {
            return `Updated ${columnName} for ${memberName} to ${value}${fluxerPropicWarning ?? ''}.`;
        }).catch(e => {
            if (e === EmptyResultError) {
                throw new EmptyResultError(`Can't update ${memberName}. ${enums.err.NO_MEMBER}: ${e.message}`);
            }
            else {
                throw new Error(`Can't update ${memberName}. ${e.message}`);
            }
        });
    },

    /**
     * Sets the warning for an expiration date.
     *
     * @param {string} expirationString - An expiration date string.
     * @returns {string} A description of the expiration, interpolating the expiration string.
     */
    setExpirationWarning(expirationString) {
        let expirationDate = new Date(expirationString);
        if (!isNaN(expirationDate.valueOf())) {
            expirationDate = expirationDate.toDateString();
            return `\n**NOTE:** Because this profile picture was uploaded via Fluxer, it will currently expire on *${expirationDate}*. To avoid this, upload the picture to another website like <https://imgbb.com/> and link to it directly`
        }
    },

    /**
     * Gets the details for a member.
     *
     * @async
     * @param {string} authorId - The author of the message
     * @param {string} memberName - The message arguments
     * @returns {Promise<EmbedBuilder>} The member's info.
     */
    async getMemberInfo  (authorId, memberName) {
        return await this.getMemberByName(authorId, memberName).then((member) => {
            if (member) {
                return new EmbedBuilder()
                    .setTitle(member.name)
                    .setDescription(`Details for ${member.name}`)
                    .addFields(
                        {name: 'Display name: ', value: member.displayname ?? 'unset', inline: true},
                        {name: 'Proxy tag: ', value: member.proxy ?? 'unset', inline: true},
                    )
                    .setImage(member.propic);
            }
        });
    },

    /**
     * Gets all members for an author.
     *
     * @async
     * @param {string} authorId - The id of the message author
     * @param {string} authorName - The id name the message author
     * @returns {Promise<EmbedBuilder>} The info for all members.
     * @throws {Error} When there are no members for an author.
     */
    async getAllMembersInfo (authorId, authorName) {
        const members = await this.getMembersByAuthor(authorId);
        if (members == null) throw Error(enums.err.USER_NO_MEMBERS);
        const fields = [...members.entries()].map(([name, member]) => ({
            name: member.name,
            value: `(Proxy: \`${member.proxy ?? "unset"}\`)`,
            inline: true,
        }));
        return new EmbedBuilder()
            .setTitle(`${fields > 25 ? "First 25 m" : "M"}embers for ${authorName}`)
            .addFields(...fields);
    },

    /**
     * Gets a member based on the author and proxy tag.
     *
     * @async
     * @param {string} authorId - The author of the message.
     * @param {string} memberName - The member's name.
     * @returns {Promise<model>} The member object.
     * @throws { EmptyResultError } When the member is not found.
     */
    async getMemberByName (authorId, memberName) {
        return await database.members.findOne({ where: { userid: authorId, name: {[Op.iLike]: memberName}}});
    },

    /**
     * Gets a member based on the author and proxy tag.
     *
     * @async
     * @param {string} authorId - The author of the message.
     * @param {string} memberName - The member's name.
     * @returns {Promise<model>} The member object.
     * @throws { EmptyResultError } When the member is not found.
     */
    async getProxyByMember (authorId, memberName) {
        return await this.getMemberByName(authorId, memberName).then((member) => {
            if (member) {
                return member.dataValues.proxy;
            }
            throw new EmptyResultError(enums.err.NO_MEMBER);
        })
    },

    /**
     * Gets all members belonging to the author.
     *
     * @async
     * @param {string} authorId - The author of the message
     * @returns {Promise<model[] | null>} The member object array.
     */
    async getMembersByAuthor (authorId) {
        return await database.members.findAll({ where: { userid: authorId } });
    },


    /**
     * Checks if proxy exists for a member.
     *
     * @param {string} authorId - The author of the message
     * @param {string} proxy - The proxy tag.
     * @returns {Promise<boolean> } Whether the proxy exists.
     * @throws {Error} When an empty proxy was provided, or no proxy exists.
     */
    async checkIfProxyExists (authorId, proxy) {
        if (proxy) {
            const splitProxy = proxy.trim().split("text");
            if(splitProxy.length < 2) throw new Error(enums.err.NO_TEXT_FOR_PROXY);
            if(!splitProxy[0] && !splitProxy[1]) throw new Error(enums.err.NO_PROXY_WRAPPER);

            await this.getMembersByAuthor(authorId).then((memberList) => {
                const proxyExists = memberList.some(member => member.proxy === proxy);
                if (proxyExists) {
                    throw new Error(enums.err.PROXY_EXISTS);
                }
            }).catch(e =>{throw e});
        }

    }
}


module.exports = memberHelper;