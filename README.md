# PluralFlux
PluralFlux is a proxybot akin to PluralKit and Tupperbox, but for [Fluxer](https://fluxer.app/). It is written with the [Fluxer.js](https://fluxerjs.blstmo.com/) library.

[Invite it to your server](https://web.fluxer.app/oauth2/authorize?client_id=1471588659706540815&scope=bot&permissions=4503600164498496).

[Join the support server](https://fluxer.gg/WaO6qGdU)

[Sponsor the project](https://github.com/sponsors/pieartsy)

If it's not running at the moment, it's because my computer crashed or something. I'm looking to move running it to a somewhat more permanent solution.

## Commands
All commands are prefixed by `pf;`. Currently only a few are implemented.

- `pf;help` - Sends the current list of commands.

- `pf;import` - Imports from PluralKit using the JSON file provided by their export command. Importing from other proxy bots is *TBD*. `pf;import` and attach your JSON file to the message. This will only save the fields that are present in the bot currently, not anything else like birthdays or system handles (yet?). **Only one proxy can be set per member currently.**"

- `pf;member` - Accesses the sub-commands related to editing proxy members. The available subcommands are:
  - `new` - Creates a new member to proxy with, for example: `pf;member new jane`. The member name should ideally be short so you can write other commands with it easily. The order of values is `pf;member new [name] [displayname] [proxy] [propic]`, _without brackets_. The name is **required**, but the rest are optional.
    Usage notes:
    - If anything has spaces, put it in quotes: `"Jane Doe"`
    - If anything is unset, and you want to set something after it (for ex: you haven't set a display name, but you want to add a proxy), put the unset value in empty quotes in the same position: "" If you leave it out, the bot will set things wrong.
    - The maximum length of a display name is 32 characters.
    - You can't use the same proxy for two different members.
    - You can also upload an image directly instead of using a url.
    Examples:
    - Full example: `pf;member new jane "Jane Doe" J:text https://cdn.pixabay.com/photo/2023/10/20/19/07/aster-8330078_1280.jpg`
    - Example with gaps: `pf;member new bob "Bob he/him" "" https://cdn.pixabay.com/photo/2016/05/09/11/09/tennis-1381230_1280.jpg

  - `remove` - Removes a member based on their name, for example: `pf;member remove jane`.
  - `name` - Updates the name for a specific member based on their current name, for ex: `pf;member john name jane`. The member name should ideally be short so you can write other commands with it easily.
  - `list` - Lists all members in the system.
  - `displayname` - Updates the display name for a specific member based on their name, for example: `pf;member jane "Jane Doe | ze/hir"`.This can be up to 32 characters long. If it has spaces, put it in __double quotes__.
  - `propic` - Updates the profile picture for the member. Must be in JPG, PNG, or WEBP format and less than 10MB. The two options are:
    1. Pass in a direct remote image URL, for example: `pf;member jane propic <https://cdn.pixabay.com/photo/2020/05/02/02/54/animal-5119676_1280.jpg>`. You can upload images on sites like <https://imgbb.com/>.
    2. Upload an attachment directly.
    **NOTE:** Fluxer does not save your attachments forever, so option #1 is recommended.
  - `proxy` Updates the proxy tag for a specific member based on their name. The proxy must be formatted with the tags surrounding the word 'text', for example: `pf;member jane proxy Jane:text` or `pf;member amal proxy [text]` This is so the bot can detect what the proxy tags are. **Only one proxy can be set per member currently.**

## Notes
- Only one proxy tag can be set per member currently.

## Upcoming
- [ ] React with x to delete message
- [ ] System tag at the end of messages
- [ ] Optionally keep proxy tag in message
- [ ] Autoproxy front
