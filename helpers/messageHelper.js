const msgh = {};

msgh.prefix = "pf;"

msgh.parse_message_args = function(text, command_name) {
    const message = text.slice(msgh.prefix.length + command_name.length).trim();
    // message arguments
    return message.match(/\w+|"(?:\\"|[^"])+"/g);
}

export const messageHelper = msgh;