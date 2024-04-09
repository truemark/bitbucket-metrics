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

export interface Repository {
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
  readonly size: number;
  readonly page: number;
  readonly pagelen: number;
  readonly next: string;
  readonly previous: string;
  readonly values: Repository[];
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

export interface Webhook {
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

export interface RepositoryWebhookResponse {
  size: number;
  page: number;
  pagelen: number;
  next: string;
  previous: string;
  values: Webhook[];
}
