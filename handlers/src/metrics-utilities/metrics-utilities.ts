export function createRepositorySlug(repositoryName: string): string {
  // Convert to lowercase
  const slug = repositoryName.toLowerCase();

  // Replace spaces with hyphens
  return slug.replace(/\s+/g, '-');
}
