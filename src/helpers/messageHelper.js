import {memberHelper} from "./memberHelper.js";
import tmp, {setGracefulCleanup} from "tmp";
import fetch from 'node-fetch';

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
        if (chara === '\"' || chara === '\'') {
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
 * @returns {{model, string, bool}} The proxy message object.
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
                proxyMessage.hasAttachment = !!attachmentUrl;
                let escapedPrefix = splitProxy[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                let escapedSuffix = splitProxy[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                escapedPrefix = new RegExp("^" + escapedPrefix);
                escapedSuffix = new RegExp(escapedSuffix + "$")
                proxyMessage.message = content.replace(escapedPrefix, "").replace(escapedSuffix, "");
            }
        }
    })
    return proxyMessage;
}

/**
 * Returns a text message that's too long as its text plus a file with the remaining text.
 *
 * @param {string} text - The text of the message.
 * @returns {{text: string, file: Buffer<ArrayBuffer> | undefined}} The text and buffer object
 *
 */
msgh.returnBufferFromText = function (text) {
    if (text.length > 2000) {
        const truncated = text.substring(0, 2000);
        const restOfText = text.substring(2000);
        const file = Buffer.from(restOfText, 'utf-8');
        return {text: truncated, file: file}
    }
    return {text: text, file: undefined}
}

/**
 * Returns an ArrayBuffer from an attachment URL.
 *
 * @param {string} attachmentUrl
 * @returns {ArrayBuffer} The buffer from the image.
 *
 */
msgh.returnBufferFromUrl = async function (attachmentUrl) {
    retryPromise(() => fetch(attachmentUrl),{
        retryIf: (response) => !response.ok,
        retries: 5
    }).then(async(res) => {
        return await res.arrayBuffer().catch((err) => {
            throw new Error(`Error loading attachment into buffer: ${err.message}`);
        })
    })

}

// Source - https://stackoverflow.com/a/70687149 - Arturo Hernandez
function retryPromise(promise, options) {
    const { retryIf, retryCatchIf, retries } = { retryIf: () => false, retryCatchIf: () => true, retries: 5, ...options};
    let _promise = promise();

    for (let i = 1; i < retries; i++)
        _promise = _promise.catch((value) => retryCatchIf(value) ? promise() : Promise.reject(value))
            .then((value) => retryIf(value) ? promise() : Promise.reject(value));

    return _promise;
}


/**
 * Returns an ArrayBuffer from an attachment URL.
 *
 * @param {Map} attachments - A collection of attachments from the message object
 * @returns {[{string, ArrayBuffer}]} An array of file objects
 *
 */
msgh.createFileObjectFromAttachments = async function (attachments) {
    if (attachments.size === 0) {
        return [];
    }
    const attachmentsObj = [];
    attachments.forEach(async (attachment) => {
        await msgh.returnBufferFromUrl(attachment.url).then((res) => {
            attachmentsObj.push({name: attachment.filename, data: res});
        });
    });
    return attachmentsObj;
}

export const messageHelper = msgh;
