import {memberHelper} from "./memberHelper.js";
import {enums} from "../enums.js";
import tmp, {setGracefulCleanup} from "tmp";
import fs from 'fs';
import {Message} from "@fluxerjs/core";

const msgh = {};

msgh.prefix = "pf;"

setGracefulCleanup();

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
 * @param {string | null} attachmentUrl - The url for an attachment to the message, if any exists.
 * @returns {Object} The proxy message object.
 * @throws {Error} If a proxy message is sent with no message within it.
 */
msgh.parseProxyTags = async function (authorId, content, attachmentUrl = null){
    const members = await memberHelper.getMembersByAuthor(authorId);
    // If an author has no members, no sense in searching for proxy
    if (members.length === 0) {
        return;
    }

    const proxyMessage = {}
    members.forEach(member => {
        if (member.proxy) {
            const splitProxy = member.proxy.split("text");
            if(content.startsWith(splitProxy[0]) && content.endsWith(splitProxy[1])) {
                proxyMessage.member = member;
                if (attachmentUrl) proxyMessage.hasAttachment = true;

                let escapedPrefix = splitProxy[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                let escapedSuffix = splitProxy[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                escapedPrefix = new RegExp("^" + escapedPrefix);
                escapedSuffix = new RegExp(escapedSuffix + "$")
                proxyMessage.message = content.replace(escapedPrefix, "").replace(escapedSuffix, "");
                if (proxyMessage.message.length === 0 && !attachmentUrl) throw new Error(enums.err.NO_MESSAGE_SENT_WITH_PROXY);
            }
        }
    })
    return proxyMessage;
}

/**
 * Returns a text message that's too long as its text plus a file with the remaining text.
 *
 * @async
 * @param {string} text - The text of the message.
 * @returns {Object<string, Buffer>} The text and buffer object
 *
 */
msgh.returnBufferFromText = async function (text) {
    if (text.length > 2000) {
        const truncated = text.substring(0, 2000);
        const restOfText = text.substring(2001);
        const file = Buffer.from(restOfText, 'utf-8');
        return {text: truncated, file: file}
    }
}

export const messageHelper = msgh;
