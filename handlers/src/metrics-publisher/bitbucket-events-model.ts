export interface Repository {
  type: string;
  full_name: string;
  links: Links;
  name: string;
  scm: string;
  website: null;
  owner: Owner;
  workspace: Workspace;
  is_private: boolean;
  project: Project;
  uuid: string;
  parent: null;
}

interface Links {
  self: Self;
  html: Html;
  avatar: Avatar;
}

interface Self {
  href: string;
}

interface Html {
  href: string;
}

interface Avatar {
  href: string;
}

interface Owner {
  display_name: string;
  links: Links2;
  type: string;
  uuid: string;
  username: string;
}

interface Links2 {
  self: Self2;
  avatar: Avatar2;
  html: Html2;
}

interface Self2 {
  href: string;
}

interface Avatar2 {
  href: string;
}

interface Html2 {
  href: string;
}

interface Workspace {
  type: string;
  uuid: string;
  name: string;
  slug: string;
  links: Links3;
}

interface Links3 {
  avatar: Avatar3;
  html: Html3;
  self: Self3;
}

interface Avatar3 {
  href: string;
}

interface Html3 {
  href: string;
}

interface Self3 {
  href: string;
}

interface Project {
  type: string;
  key: string;
  uuid: string;
  name: string;
  links: Links4;
}

interface Links4 {
  self: Self4;
  html: Html4;
  avatar: Avatar4;
}

interface Self4 {
  href: string;
}

interface Html4 {
  href: string;
}

interface Avatar4 {
  href: string;
}

interface Actor {
  display_name: string;
  links: Links5;
  type: string;
  uuid: string;
  username: string;
}

interface Links5 {
  self: Self5;
  avatar: Avatar5;
  html: Html5;
}

interface Self5 {
  href: string;
}

interface Avatar5 {
  href: string;
}

interface Html5 {
  href: string;
}

interface CommitStatus {
  key: string;
  type: string;
  state: string;
  name: string;
  refname: string;
  commit: Commit;
  url: string;
  repository: Repository2;
  description: string;
  created_on: string;
  updated_on: string;
  links: Links6;
}

interface Commit {
  type: string;
  hash: string;
  date: string;
  author: Author;
  message: string;
  links: Links7;
}

interface Author {
  type: string;
  raw: string;
}

interface Links7 {
  self: Self6;
  html: Html6;
  diff: Diff;
  approve: Approve;
  comments: Comments;
  statuses: Statuses;
  patch: Patch;
}

interface Self6 {
  href: string;
}

interface Html6 {
  href: string;
}

interface Diff {
  href: string;
}

interface Approve {
  href: string;
}

interface Comments {
  href: string;
}

interface Statuses {
  href: string;
}

interface Patch {
  href: string;
}

interface Repository2 {
  type: string;
  full_name: string;
  links: Links8;
  name: string;
  uuid: string;
}

interface Links8 {
  self: Self7;
  html: Html7;
  avatar: Avatar6;
}

interface Self7 {
  href: string;
}

interface Html7 {
  href: string;
}

interface Avatar6 {
  href: string;
}

interface Links6 {
  self: Self8;
  commit: Commit2;
}

interface Self8 {
  href: string;
}

interface Commit2 {
  href: string;
}

export interface BitbucketEvent {
  repository: Repository;
  actor: Actor;
  commit_status: CommitStatus;
}
