const {memberHelper} = require('memberHelper.js');
const {fs} = require('fs')
const {tmp, setGracefulCleanup } = require('tmp')
const {enums} = require('../enums.js')
const {Message} = require('@fluxerjs/core');

setGracefulCleanup();

const messageHelper = {

    prefix: "pf;",
    
    /**
     * Parses and slices up message arguments, retaining quoted strings.
     *
     * @param {string} content - The full message content.
     * @param {string} commandName - The command name.
     * @returns {string[]} An array of arguments.
     */
    parseCommandArgs(content, commandName) {
        const message = content.slice(this.prefix.length + commandName.length).trim();

        return message.match(/\\?.|^$/g).reduce((accumulator, chara) => {
            if (chara === '"') {
                // checks whether string is within quotes or not
                accumulator.quote ^= 1;
            } else if (!accumulator.quote && chara === ' ') {
                // if not currently in quoted string, push empty string to start word
                accumulator.array.push('');
            } else {
                // accumulates characters to the last string in the array and removes escape characters
                accumulator.array[accumulator.array.length - 1] += chara.replace(/\\(.)/, "$1");
            }
            return accumulator;
        }, {array: ['']}).array // initial array with empty string for the reducer
    },

    /**
     * Parses messages to see if any part of the text matches the tags of any member belonging to an author.
     *
     * @param {string} authorId - The author of the message.
     * @param {string} content - The full message content
     * @param {string | null} attachmentUrl - The url for an attachment to the message, if any exists.
     * @returns {Object} The proxy message object.
     * @throws {Error} If a proxy message is sent with no message within it.
     */
    async parseProxyTags(authorId, content, attachmentUrl = null) {
        const members = await memberHelper.getMembersByAuthor(authorId);
        // If an author has no members, no sense in searching for proxy
        if (members.length === 0) {
            return;
        }

        const proxyMessage = {}
        members.forEach(member => {
            if (member.proxy) {
                const splitProxy = member.proxy.split("text");
                if (content.startsWith(splitProxy[0]) && content.endsWith(splitProxy[1])) {
                    proxyMessage.member = member;
                    if (attachmentUrl) return proxyMessage.message = enums.misc.ATTACHMENT_SENT_BY;

                    let escapedPrefix = splitProxy[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    let escapedSuffix = splitProxy[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    escapedPrefix = new RegExp("^" + escapedPrefix);
                    escapedSuffix = new RegExp(escapedSuffix + "$")
                    proxyMessage.message = content.replace(escapedPrefix, "").replace(escapedSuffix, "");
                    if (proxyMessage.message.length === 0) throw new Error(enums.err.NO_MESSAGE_SENT_WITH_PROXY);
                }
            }
        })
        return proxyMessage;
    },

    /**
     * Sends a message as an attachment if it's too long.NOT CURRENTLY IN USE
     *
     * @async
     * @param {string} text - The text of the message.
     * @param {Message} message - The message object.
     * @throws {Error} If a proxy message is sent with no message within it.
     *
     */
    async sendMessageAsAttachment(text, message) {
        if (text.length > 2000) {
            tmp.file(async (err, path, fd, cleanupCallback) => {
                fs.writeFile(path, text, (err) => {
                    if (err) throw err;
                })
                if (err) throw err;
                await message.reply({content: enums.err.IMPORT_ERROR, attachments: [path]});
            });
        }
    }
};

module.exports = messageHelper;
