// Workspace models
export interface WorkspaceResponse {
  pagelen: number;
  page: number;
  size: number;
  values: Array<{
    uuid: string;
    links: {
      owners: {href: string};
      self: {href: string};
      repositories: {href: string};
      snippets: {href: string};
      html: {href: string};
      avatar: {href: string};
      members: {href: string};
      projects: {href: string};
    };
    created_on: string;
    type: string;
    slug: string;
    is_private: boolean;
    name: string;
  }>;
}

// Repository models
interface Link {
  href: string;
  name: string;
}

interface Links {
  self: Link;
  html: Link;
  avatar: Link;
  pullrequests: Link;
  commits: Link;
  forks: Link;
  watchers: Link;
  downloads: Link;
  clone: Link[];
  hooks: Link;
}

interface Owner {
  type: string;
}

interface Project {
  type: string;
}

interface MainBranch {
  type: string;
}

interface Repository {
  type: string;
  links: Links;
  uuid: string;
  full_name: string;
  is_private: boolean;
  scm: string;
  owner: Owner;
  name: string;
  description: string;
  created_on: string;
  updated_on: string;
  size: number;
  language: string;
  has_issues: boolean;
  has_wiki: boolean;
  fork_policy: string;
  project: Project;
  mainbranch: MainBranch;
}

export interface RepositoriesResponse {
  size: number;
  page: number;
  pagelen: number;
  next: string;
  previous: string;
  values: Repository[];
}

// Webhook models
export interface WebhookRequest {
  description: string;
  url: string;
  active: boolean;
  secret: string;
  events: string[];
}

export interface WebhookResponse {
  type: string;
  uuid: string;
  url: string;
  description: string;
  subject_type: string;
  active: boolean;
  created_at: string;
  events: string[];
  secret_set: boolean;
  secret: string;
}
