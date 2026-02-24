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

        test('if no attachment URL, throws error', async() => {
            await expect(importHelper.pluralKitImport(authorId)).rejects.toThrow(enums.err.NOT_JSON_FILE);
        })

        test('if attachment URL, calls fetch and addFullMember and returns value', async() => {
            memberHelper.addFullMember.mockResolvedValue(mockAddReturn);
            const result = await importHelper.pluralKitImport(authorId, attachmentUrl);

            expect(fetch).toHaveBeenCalledTimes(1);
            expect(fetch).toHaveBeenCalledWith(attachmentUrl);
            expect(memberHelper.addFullMember).toHaveBeenCalledWith(authorId, mockImportedMember.name, mockImportedMember.display_name, 'SP{text}', mockImportedMember.avatar_url);
            expect(result).toEqual(`Successfully added members: ${mockAddReturnMember.name}`)
        })


        test('if fetch fails, throws error', async() => {
            global.fetch = jest.fn().mockRejectedValue("can't get");
            await expect(importHelper.pluralKitImport(authorId, attachmentUrl)).rejects.toThrow(enums.err.CANNOT_FETCH_RESOURCE, "can't get file");
        })

        test('if json conversion fails, throws error', async() => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.reject("not json")
            })
            await expect(importHelper.pluralKitImport(authorId, attachmentUrl)).rejects.toThrow(enums.err.NOT_JSON_FILE, "not json");
        })

        test('if addFullMember returns nothing, return correct enum', async () => {
            memberHelper.addFullMember.mockResolvedValue();
            await expect(importHelper.pluralKitImport(authorId, attachmentUrl)).rejects.toThrow(([], enums.err.NO_MEMBERS_IMPORTED));
        })

        test('if addFullMember returns nothing and throws error, catch and return error', async() => {
            memberHelper.addFullMember.mockResolvedValue(new Error('error'));
            await expect(importHelper.pluralKitImport(authorId, attachmentUrl)).rejects.toThrow(([new Error('error')], enums.err.NO_MEMBERS_IMPORTED));
        })

        test('if addFullMember returns member but also contains error, return member and error', async () => {
            // Arrange
            const memberObj = {errors: ['error'], member: mockAddReturnMember};
            memberHelper.addFullMember.mockResolvedValue(memberObj);
            // Act & Assert
            await expect(importHelper.pluralKitImport(authorId, attachmentUrl)).rejects.toThrow((['error'], `Successfully added members: ${mockAddReturnMember.name}`));
        })

    })

    afterEach(() => {
        // restore the spy created with spyOn
        jest.clearAllMocks();
    });
})