import {memberHelper} from "./memberHelper.js";

const msgh = {};

msgh.prefix = "pf;"

msgh.parse_command_args = function(text, command_name) {
    const message = text.slice(msgh.prefix.length + command_name.length).trim();
    // slices up message arguments including retaining quoted strings
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

msgh.parse_proxy_tags = async function (author_id, text){
    const members = await memberHelper.get_members_by_author(author_id);
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
