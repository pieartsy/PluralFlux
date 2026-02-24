Thanks for being interested in contributing to PluralFlux! I really can't do this by myself, nor do I want to!

This is a guide for code contributions only. If you're looking to contribute _money_, please go to my [sponsorship page](https://github.com/sponsors/pieartsy)!

## Disclaimer
The PluralFlux team is endogenic-friendly. Even if you disagree with this, keep discourse takes to yourself. If you can't be civil about it, please do not contribute. Other bigotry (transphobia, racism, ableism, fatphobia, etc) will not be tolerated either.

## Resources:
Not too many right now, but I'm hoping to get a wiki up.
- [Issues tracker](https://github.com/pieartsy/PluralFlux/issues)
- [Pluralflux Support server](https://fluxer.gg/WaO6qGdU) where you can contact me (there's a #contributing channel for contributors)
- You can also reach me @pieartsy on Discord (or anywhere, really) if/when Fluxer is down.

## Requirements
- [Fluxer.js](https://fluxerjs.blstmo.com/)
- Docker
- Node version 25.3.8

## Submitting changes
- Submit a pull request to this repository and explain your code and changes.
- We squash-merge commits, but keep to the [Conventional Commit](https://www.conventionalcommits.org/en/v1.0.0-beta.2/) structure for your PR titles. Conventions are not necessary for commits themselves, but try to keep them readable anyway.
- Branches should target one specific issue in the Issue Tracker and try not to touch other features. Link to the issue in your PR.
- All commits will undergo PR review, at minimum by the main dev right now. If you can't explain or defend your code, it may be rejected.

## Standards
- Docstrings are *mandatory*, following the standards in [JSDoc](https://michaelcurrin.github.io/dev-cheatsheets/cheatsheets/javascript/general/jsdoc.html).
- Comments are encouraged for confusing code. Prioritize readability (for example, just write an if/else instead of chaining ternaries).
- Reusable message replies should go in the enums file so we don't have to hunt them down to change wording.
- We use [jest](https://jestjs.io/) for testing. Please write unit tests and ideally integration tests for your code. Shoot for 60% coverage at minimum. Check that other features that touch your changes don't break.

### LLM usage
**Do *not* insert code that has been LLM/GenAI generated.** All code you submit must be handwritten by yourself. This includes writing tests. Vibe coding is especially **not** allowed. Please disclose if you've used any AI for any other reasons, such as rubber-ducking or figuring out bugs or something. The main dev is somewhat more open to these uses because of search engines enshittifying--but frequent LLM usage is heavily discouraged due to the ethical concerns as well as damage to critical thinking skills. Only turn to LLMs if scouring search engines, Stack Overflow, and your friends list has not worked.
