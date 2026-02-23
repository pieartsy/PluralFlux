const {enums} = require('../../src/enums.js');
const fetchMock = require('jest-fetch-mock');

jest.mock('../../src/helpers/memberHelper.js', () => {
    return {
        memberHelper: {
            addFullMember: jest.fn()
        }
    }
})

fetchMock.enableMocks();
const {memberHelper} = require("../../src/helpers/memberHelper.js");
const {importHelper} = require('../../src/helpers/importHelper.js');

describe('importHelper', () => {
    const authorId = '123';
    const attachmentUrl = 'system.json';
    const mockImportedMember = {
        proxy_tags: [{
            prefix: "SP{",
            suffix: "}"
        }],
            display_name: "SomePerson",
        avatar_url: 'oya.png',
        name: 'somePerson'
    }
    const mockData = {
        members: [mockImportedMember]
    };
    const mockAddReturnMember = {
        proxy: "SP{text}",
        displayname: "SomePerson",
        propic: 'oya.png',
        name: 'somePerson'
    }
    const mockAddReturn = {
        member: mockAddReturnMember,
        errors: []
    }

    beforeEach(() => {
        global.fetch = jest.fn();
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockData)
        })

    })

    describe('pluralKitImport', () => {

        test('if no attachment URL, throws error', () => {
            return importHelper.pluralKitImport(authorId).catch((e) => {
                expect(e).toEqual(new Error(enums.err.NOT_JSON_FILE));
            })
        })

        test('if attachment URL, calls fetch and addFullMember and returns value', () => {
            memberHelper.addFullMember.mockResolvedValue(mockAddReturn);
            return importHelper.pluralKitImport(authorId, attachmentUrl).then((res) => {
                expect(fetch).toHaveBeenCalledTimes(1);
                expect(fetch).toHaveBeenCalledWith(attachmentUrl);
                expect(memberHelper.addFullMember).toHaveBeenCalledWith(authorId, mockImportedMember.name, mockImportedMember.display_name, 'SP{text}', mockImportedMember.avatar_url);
                expect(res).toEqual(`Successfully added members: ${mockAddReturnMember.name}`)
            })
        })

        test('if addFullMember returns nothing, return correct enum', () => {
            memberHelper.addFullMember.mockResolvedValue();
            return importHelper.pluralKitImport(authorId, attachmentUrl).catch((res) => {
                expect(res).toEqual(new AggregateError([], `${enums.err.NO_MEMBERS_IMPORTED}\n\n${enums.err.IMPORT_ERROR}`));
            })
        })

        test('if addFullMember returns nothing and throws error, catch and return error', () => {
            memberHelper.addFullMember.mockResolvedValue(new Error('error'));
            return importHelper.pluralKitImport(authorId, attachmentUrl).catch((res) => {
                expect(res).toEqual(new AggregateError([new Error('error')], `${enums.err.NO_MEMBERS_IMPORTED}\n\n${enums.err.IMPORT_ERROR}`))
            })
        })

        test('if addFullMember returns member but also contains error, return member and error', () => {
            // Arrange
            const memberObj = {errors: ['error'], member: mockAddReturnMember};
            memberHelper.addFullMember.mockResolvedValue(memberObj);
            // Act
            return importHelper.pluralKitImport(authorId, attachmentUrl).catch((res) => {
                // Assert
                expect(res).toEqual(new AggregateError(['error'], `Successfully added members: ${mockAddReturnMember.name}\n\n${enums.err.IMPORT_ERROR}`))
            })
        })

    })

    afterEach(() => {
        // restore the spy created with spyOn
        jest.clearAllMocks();
    });
})