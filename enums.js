const helperEnums = {};

helperEnums.err = {
    NO_MEMBER: "No such member was found.",
    NO_NAME_PROVIDED: "No member name was provided for",
    NO_VALUE: "has not been set for this member. Please provide a value.",
    ADD_ERROR: "Error adding member.",
    MEMBER_EXISTS: "A member with that name already exists. Please pick a unique name.",
    USER_NO_MEMBERS: "You have no members created.",
    DISPLAY_NAME_TOO_LONG: "The display name is too long. Please limit it to 32 characters or less.",
    PROXY_EXISTS: "A duplicate proxy already exists for one of your members. Please pick a new one, or change the old one first.",
    NO_SUCH_COMMAND: "No such command exists.",
    PROPIC_FAILS_REQUIREMENTS: "Profile picture must be in JPG or PNG format.",
    PROPIC_CANNOT_LOAD: "Profile picture could not be loaded from URL.",
    NO_WEBHOOKS_ALLOWED: "Channel does not support webhooks.",
    NOT_IN_SERVER: "You can only proxy in a server.",
    NO_MESSAGE_SENT_WITH_PROXY: 'Proxied message has no content.'
}

helperEnums.help = {
    SHORT_DESC_HELP: "Lists available commands.",
    SHORT_DESC_MEMBER: "Commands and sub-commands related to proxy members.",
    SHORT_DESC_PLURALFLUX: "PluralFlux is a proxybot akin to PluralKit and Tupperbot, but for Fluxer. All commands are prefixed by `pf;`. Type `pf;help` for info on the bot itself.",
    PLURALFLUX: "PluralFlux is a proxybot akin to PluralKit and Tupperbot, but for Fluxer. All commands are prefixed by `pf;`. Add ` --help` to the end of a command to find out more about it, or just send it without arguments.",
    MEMBER: "Accesses the sub-commands related to editing proxy members. The available subcommands are `add`, `remove`, `displayname`, `proxy`, and `propic`. Add ` --help` to the end of a subcommand to find out more about it, or just send it without arguments.",
    ADD: "Creates a new member to proxy with, for example: `pf;member jane`. The member name should ideally be short so you can write other commands with it easily. \n\nYou can optionally add a display name after the member name, for example: `pf;member new jane \"Jane Doe | ze/hir\"`. If it has spaces, put it in __double quotes__. The length limit is 32 characters.",
    REMOVE: "Removes a member based on their name, for example: `pf;member remove jane`.",
    NAME: "Updates the name for a specific member based on their current name, for ex: `pf;member jane name jane`. The member name should ideally be short so you can write other commands with it easily.",
    DISPLAY_NAME: "Updates the display name for a specific member based on their name, for example: `pf;member jane \"Jane Doe | ze/hir\"`.This can be up to 32 characters long. If it has spaces, put it in __double quotes__.",
    PROXY: "Updates the proxy tag for a specific member based on their name, for example: `pf;member jane proxy Jane:` or `pf;member amal proxy A=`. This is put at *the start* of a message to allow it to be proxied. Proxies that wrap around text or go at the end are *not* currently supported.",
    PROPIC: "Updates the profile picture for the member. Must be in JPG or PNG format. The two options are:\n1. Pass in a direct remote image URL, for example: `pf;member jane propic <https://cdn.pixabay.com/photo/2020/05/02/02/54/animal-5119676_1280.jpg>`. You can upload images on sites like <https://imgbb.com/>.\n2. Upload an attachment directly.\n\n**NOTE:** Fluxer does not save your attachments forever, so option #1 is recommended.",
}

export const enums = helperEnums;