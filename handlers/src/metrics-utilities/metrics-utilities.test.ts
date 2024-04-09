import {createRepositorySlug} from './metrics-utilities';

describe('createRepositorySlug', () => {
  const testCases = [
    {repositoryName: 'My Test Repository', expectedSlug: 'my-test-repository'},
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
      const result = createRepositorySlug(repositoryName);
      expect(result).toEqual(expectedSlug);
    });
  });
});
