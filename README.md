# PluralFlux
PluralFlux is a proxybot akin to PluralKit and Tupperbox, but for [Fluxer](https://fluxer.app/). It is written with the [Fluxer.js](https://fluxerjs.blstmo.com/) library.

[Invite it to your server](https://web.fluxer.app/oauth2/authorize?client_id=1471588659706540815&scope=bot&permissions=4503600164498496).

[Join the support server](https://fluxer.gg/WaO6qGdU)

If it's not running at the moment, it's because my computer crashed or something. I'm looking to move running it to a somewhat more permanent solution.

## Commands
All commands are prefixed by `pf;`. Currently only a few are implemented.

- `pf;help` - Sends the current list of commands.

- `pf;import` - Imports from PluralKit using the JSON file provided by their export command. Importing from other proxy bots is *TBD*. `pf;import` and attach your JSON file to the message.

- `pf;member` - Accesses the sub-commands related to editing proxy members. The available subcommands are:
  - `new` - Creates a new member to proxy with, for example: `pf;member new jane`. The member name should ideally be short so you can write other commands with it easily.
You can optionally add a display name after the member name, for example: `pf;member new jane "Jane Doe | ze/hir"`. If it has spaces, put it in __double quotes__. The length limit is 32 characters.
  - `remove` - Removes a member based on their name, for example: `pf;member remove jane`.
  - `name` - Updates the name for a specific member based on their current name, for ex: `pf;member john name jane`. The member name should ideally be short so you can write other commands with it easily.
  - `displayname` - Updates the display name for a specific member based on their name, for example: `pf;member jane "Jane Doe | ze/hir"`.This can be up to 32 characters long. If it has spaces, put it in __double quotes__.
  - `propic` - Updates the profile picture for the member. Must be in JPG, PNG, or WEBP format and less than 10MB. The two options are:
    1. Pass in a direct remote image URL, for example: `pf;member jane propic <https://cdn.pixabay.com/photo/2020/05/02/02/54/animal-5119676_1280.jpg>`. You can upload images on sites like <https://imgbb.com/>.
    2. Upload an attachment directly.
    **NOTE:** Fluxer does not save your attachments forever, so option #1 is recommended.

## Upcoming
- [ ] React with x to delete message
- [ ] Reply to edit message
- [ ] System tag at the end of messages
- [ ] Optionally keep proxy tag in message