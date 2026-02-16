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
    PROPIC_FAILS_REQUIREMENTS: "Profile picture must be in JPG, PNG, or WEBP format and less than 10MB.",
    PROPIC_CANNOT_LOAD: "Profile picture could not be loaded from URL.",
    NO_WEBHOOKS_ALLOWED: "Channel does not support webhooks.",
    NOT_IN_SERVER: "You can only proxy in a server.",
    NO_MESSAGE_SENT_WITH_PROXY: 'Proxied message has no content.',
    NO_TEXT_FOR_PROXY: "You need the word 'text' for the bot to detect proxy tags with.\nCorrect usage examples: `pf;member jane proxy J:text`, `pf;member jane [text]`",
    NO_PROXY_WRAPPER: "You need at least one proxy tag surrounding 'text', either before or after.\nCorrect usage examples: `pf;member jane proxy J:text`, `pf;member jane [text]`",
    NOT_JSON_FILE: "Please attach a valid JSON file.",
    NO_MEMBERS_IMPORTED: 'No members were imported.',
    IMPORT_ERROR: "Please see attached file for logs on the member import process.",
    ATTACHMENTS_NOT_ALLOWED: "Unfortunately proxied message attachments aren't possible at this time. If you want to send a file, you can use a file host instead of uploading directly."
}

helperEnums.help = {
    SHORT_DESC_HELP: "Lists available commands.",
    SHORT_DESC_MEMBER: "Accesses subcommands related to proxy members.",
    SHORT_DESC_IMPORT: "Imports from PluralKit.",
    SHORT_DESC_PLURALFLUX: "PluralFlux is a proxybot akin to PluralKit and Tupperbot, but for Fluxer. All commands are prefixed by `pf;`. Type `pf;help` for info on the bot itself.",
    PLURALFLUX: "PluralFlux is a proxybot akin to PluralKit and Tupperbot, but for Fluxer. All commands are prefixed by `pf;`. Add ` --help` to the end of a command to find out more about it, or just send it without arguments.",
    MEMBER: "Accesses the sub-commands related to editing proxy members. The available subcommands are `list`, `new`, `remove`, `displayname`, `proxy`, and `propic`. Add ` --help` to the end of a subcommand to find out more about it, or just send it without arguments.",
    NEW: "Creates a new member to proxy with, for example: `pf;member new jane`. The member name should ideally be short so you can write other commands with it easily. \n\nYou can optionally add a display name after the member name, for example: `pf;member new jane \"Jane Doe | ze/hir\"`. If it has spaces, put it in __double quotes__. The length limit is 32 characters.",
    REMOVE: "Removes a member based on their name, for example: `pf;member remove jane`.",
    NAME: "Updates the name for a specific member based on their current name, for ex: `pf;member john name jane`. The member name should ideally be short so you can write other commands with it easily.",
    DISPLAY_NAME: "Updates the display name for a specific member based on their name, for example: `pf;member jane \"Jane Doe | ze/hir\"`.This can be up to 32 characters long. If it has spaces, put it in __double quotes__.",
    PROXY: "Updates the proxy tag for a specific member based on their name. The proxy must be formatted with the tags surrounding the word 'text', for example: `pf;member jane proxy Jane:text` or `pf;member amal proxy [text]` This is so the bot can detect what the proxy tags are. Only one proxy can be set per member currently.",
    PROPIC: "Updates the profile picture for the member. Must be in JPG, PNG, or WEBP format and less than 10MB. The two options are:\n1. Pass in a direct remote image URL, for example: `pf;member jane propic <https://cdn.pixabay.com/photo/2020/05/02/02/54/animal-5119676_1280.jpg>`. You can upload images on sites like <https://imgbb.com/>.\n2. Upload an attachment directly.\n\n**NOTE:** Fluxer does not save your attachments forever, so option #1 is recommended.",
    IMPORT: "Imports from PluralKit using the JSON file provided by their export command. Importing from other proxy bots is TBD. `pf;import` and attach your JSON file to the message. This will only save the fields that are present in the bot currently (the stuff above), not anything else like birthdays or system handles (yet?)."
}

export const enums = helperEnums;