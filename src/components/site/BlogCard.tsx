import { Link } from "@tanstack/react-router";
import { Clock, User } from "lucide-react";
import { formatRelative } from "@/lib/format";

export type BlogCardData = {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  reading_time_minutes: number | null;
  published_at: string | null;
  author?: { display_name: string | null } | null;
  category?: { name: string; slug: string; color: string | null } | null;
};

export function BlogCard({ blog, size = "md" }: { blog: BlogCardData; size?: "sm" | "md" | "lg" }) {
  const isLg = size === "lg";
  return (
    <Link to="/blog/$slug" params={{ slug: blog.slug }}
      className="group flex flex-col rounded-xl glass shadow-card overflow-hidden hover:border-primary/40 transition-all">
      <div className={`relative overflow-hidden bg-muted ${isLg ? "aspect-[16/9]" : "aspect-[16/10]"}`}>
        {blog.cover_image_url ? (
          <img src={blog.cover_image_url} alt={blog.title} loading="lazy"
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="h-full w-full bg-gradient-primary opacity-30" />
        )}
        {blog.category && (
          <span className="absolute top-3 left-3 rounded-full bg-background/80 backdrop-blur px-2.5 py-0.5 text-xs font-medium"
            style={{ color: blog.category.color ?? undefined }}>
            {blog.category.name}
          </span>
        )}
      </div>
      <div className={`flex flex-col gap-2 p-4 ${isLg ? "md:p-6" : ""}`}>
        <h2 className={`font-display font-bold leading-tight group-hover:text-primary transition-colors ${isLg ? "text-2xl" : "text-base"}`}>
          {blog.title}
        </h2>
        {blog.excerpt && <p className="text-sm text-muted-foreground line-clamp-2">{blog.excerpt}</p>}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-2">
          {blog.author?.display_name && <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{blog.author.display_name}</span>}
          {blog.reading_time_minutes && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{blog.reading_time_minutes} min</span>}
          {blog.published_at && <span>{formatRelative(blog.published_at)}</span>}
        </div>
      </div>
    </Link>
  );
}
