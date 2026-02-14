const helperEnums = {};

helperEnums.err = {
    NO_MEMBER: "No member was found.",
    NO_NAME_PROVIDED: "No member name was provided for",
    NO_VALUE: "has not been set for this member. Please provide a value.",
    ADD_ERROR: "Error adding member.",
    MEMBER_EXISTS: "A member with that name already exists. Please pick a unique name.",
    USER_NO_MEMBERS: "You have no members created.",
    DISPLAY_NAME_TOO_LONG: "The display name is too long. Please limit it to 32 characters or less.",
    PROXY_EXISTS: "A duplicate proxy already exists for one of your members. Please pick a new one, or change the old one first."
}

helperEnums.help = {
    PLURALFLUX: "PluralFlux is a proxybot akin to PluralKit and Tupperbot, but for Fluxer. All commands are prefixed by `pf;`. The current commands are: `pf;member`. Add ` --help` to the end of a command to find out more about it, or just send it without arguments.",
    MEMBER: "You can shorten this command to `pf;m`. The available subcommands for `pf;member` are `add`, `remove`, `displayname`, and `proxy`. Add ` --help` to the end of a subcommand to find out more about it, or just send it without arguments.",
    ADD: "Creates a new member to proxy with, for example: `pf;member jane`. The member name should ideally be short so you can write other commands with it. \nYou can optionally add a display name after the member name, for example: `pf;member new jane \"Jane Doe | ze/hir\"`. If it has spaces, put it in **double quotes**. The length limit is 32 characters.",
    REMOVE: "Removes a member based on their name, for example: `pf;member remove jane`.",
    DISPLAYNAME: "Updates the display name for a specific member based on their name, for example: `pf;member jane \"Jane Doe | ze/hir\"`.This can be up to 32 characters long. If it has spaces, put it in quotes.",
    PROXY: "Updates the proxy tag for a specific member based on their name, for example: `pf;member jane proxy Jane:` or `pf;member amal proxy A=:`. This is put at **the start** of a message to allow it to be proxied. Proxies that wrap around text or go at the end are **not** currently supported."
}

export const enums = helperEnums;