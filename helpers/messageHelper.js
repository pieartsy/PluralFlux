const msgh = {};

msgh.prefix = "pf;"

msgh.parse_command_args = function(text, command_name) {
    const message = text.slice(msgh.prefix.length + command_name.length).trim();
    // slices up message arguments including retaining quoted strings
    return message.match(/\w+|"(?:\\"|[^"])+"/g);
}

export const messageHelper = msgh;
