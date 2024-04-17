import {MetricsUtilities} from './metrics-utilities';

describe('metrics-utilities', () => {
  describe('createRepositorySlug', () => {
    const testCases = [
      {
        repositoryName: 'My Test Repository',
        expectedSlug: 'my-test-repository',
      },
      {
        repositoryName: 'My pecial Repoitory',
        expectedSlug: 'my-pecial-repoitory',
      },
      {
        repositoryName: 'curl_test',
        expectedSlug: 'curl_test',
      },
    ];

    testCases.forEach(({repositoryName, expectedSlug}) => {
      it(`should correctly transform the repository name "${repositoryName}" into a slug "${expectedSlug}"`, () => {
        const result = MetricsUtilities.createRepositorySlug(repositoryName);
        expect(result).toEqual(expectedSlug);
      });
    });
  });

  describe('readJsonToObject', () => {
    it('should correctly read a JSON file and convert it to an object', () => {
      const fileName = '../../test/data/test.json';
      const expectedObject = {key: 'value'};

      const result = MetricsUtilities.readJsonToObject(fileName);

      expect(result).toEqual(expectedObject);
    });
  });
});
