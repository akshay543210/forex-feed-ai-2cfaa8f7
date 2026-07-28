import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchBlogs from "./tools/search-blogs";
import getBlog from "./tools/get-blog";
import listPropFirms from "./tools/list-prop-firms";
import createBlogDraft from "./tools/create-blog-draft";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "propfirm-knowledge-mcp",
  title: "PropFirm Knowledge",
  version: "0.1.0",
  instructions:
    "Tools for the PropFirm Knowledge blog. Search and read articles, list tracked prop trading firms, and create new article drafts. Drafts are never published automatically — review them in the admin editor.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchBlogs, getBlog, listPropFirms, createBlogDraft],
});
