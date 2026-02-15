import {memberHelper} from "./memberHelper.js";
import {enums} from "../enums.js";

const msgh = {};

msgh.prefix = "pf;"

/**
 * Parses and slices up message arguments, retaining quoted strings.
 *
 * @param {string} content - The full message content.
 * @param {string} commandName - The command name.
 * @returns {string[]} An array of arguments.
 */
msgh.parseCommandArgs = function(content, commandName) {
    const message = content.slice(msgh.prefix.length + commandName.length).trim();

    return message.match(/\\?.|^$/g).reduce((accumulator, chara) => {
        if (chara === '"') {
            // checks whether string is within quotes or not
            accumulator.quote ^= 1;
        } else if (!accumulator.quote && chara === ' '){
            // if not currently in quoted string, push empty string to start word
            accumulator.array.push('');
        } else {
            // accumulates characters to the last string in the array and removes escape characters
            accumulator.array[accumulator.array.length-1] += chara.replace(/\\(.)/,"$1");
        }
        return accumulator;
    }, {array: ['']}).array // initial array with empty string for the reducer
}

/**
 * Parses proxy tags and sees if they match the tags of any member belonging to an author.
 *
 * @param {string} authorId - The author of the message.
 * @param {Object} attachment - An attachment for the message, if any exists.
 * @param {string} content - The full message content.
 * @returns {Object} The proxy message object.
 */
msgh.parseProxyTags = async function (authorId, attachment, content){
    const members = await memberHelper.getMembersByAuthor(authorId).catch(e => throw e);

    const proxyMessage = {}
    members.filter(member => member.proxy).forEach(member => {
        const splitProxy = member.proxy.split("text");
        if(content.startsWith(splitProxy[0]) && content.endsWith(splitProxy[1])) {
            if (content.length <= member.proxy.length && !attachment) throw new Error(enums.err.NO_MESSAGE_SENT_WITH_PROXY);
            proxyMessage.proxy = member.proxy;
            proxyMessage.message = content.slice(member.proxy.length).trim();
        }
    })
    return proxyMessage;
}

export const messageHelper = msgh;
