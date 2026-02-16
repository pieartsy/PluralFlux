import {memberHelper} from "./memberHelper.js";
import {enums} from "../enums.js";
import tmp from "tmp";
import fs from 'fs';
import {Message} from "@fluxerjs/core";

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
 * Parses messages to see if any part of the text matches the tags of any member belonging to an author.
 *
 * @param {string} authorId - The author of the message.
 * @param {string} content - The full message content
 * @param {Object | null} attachment - An attachment for the message, if any exists.
 * @returns {Object} The proxy message object.
 * @throws {Error} If a proxy message is sent with no message within it.
 */
msgh.parseProxyTags = async function (authorId, content, attachment= null){
    const members = await memberHelper.getMembersByAuthor(authorId);
    // If an author has no members, no sense in searching for proxy
    if (members.length === 0) {
        return;
    }

    const proxyMessage = {}
    members.filter(member => member.proxy).forEach(member => {
        const splitProxy = member.proxy.split("text");
        if(content.startsWith(splitProxy[0]) && content.endsWith(splitProxy[1])) {
            proxyMessage.proxy = member.proxy;
            const removePrefix = new RegExp("^" + splitProxy[0]);
            const removeSuffix = new RegExp(splitProxy[1] + "$");
            proxyMessage.message = content.replace(removePrefix, "").replace(removeSuffix, "");

            if (proxyMessage.message.length === 0 && !attachment) throw new Error(enums.err.NO_MESSAGE_SENT_WITH_PROXY);
        }
    })
    return proxyMessage;
}

/**
 * Sends a message as an attachment if it's too long.
 *
 * @param {string} text - The text of the message.
 * @param {Message} message - The message object.
 * @throws {Error} If a proxy message is sent with no message within it.
 */
msgh.sendMessageAsAttachment = async function(text, message) {
    if (text.length > 2000) {
        tmp.file(async (err, path, fd, cleanupCallback) => {
            fs.writeFile('path', text, (err) => {
                if (err) throw err;
            })
            if (err) throw err;
            await message.reply({attachments: [path]});
        });
    }
}

export const messageHelper = msgh;
