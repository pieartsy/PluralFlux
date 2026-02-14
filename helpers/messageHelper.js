import {memberHelper} from "./memberHelper.js";

const msgh = {};

msgh.prefix = "pf;"

/**
 * Parses and slices up message arguments, retaining quoted strings.
 *
 * @param {string} text - The full message content.
 * @param {string} commandName - The command name.
 * @returns {string[]} An array of arguments.
 */
msgh.parseCommandArgs = function(text, commandName) {
    const message = text.slice(msgh.prefix.length + commandName.length).trim();

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
 * @param {string} text - The full message content.
 * @returns {Object} The proxy message object.
 */
msgh.parseProxyTags = async function (authorId, text){
    const members = await memberHelper.getMembersByAuthor(authorId);
    const proxyMessage = {}
    members.forEach(member => {
        if (text.startsWith(member.proxy) && text.length > member.proxy.length) {
            proxyMessage.proxy = member.proxy;
            proxyMessage.message = text.slice(member.proxy.length).trim();
        }
    })
    return proxyMessage;
}

export const messageHelper = msgh;
