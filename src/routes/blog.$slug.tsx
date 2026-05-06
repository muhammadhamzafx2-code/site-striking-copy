import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { posts } from "./blog.index";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = posts.find((p) => p.slug === params.slug);
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Article"} — Exonax Blog` },
      { name: "description", content: loaderData?.excerpt ?? "Exonax blog article." },
    ],
  }),
  notFoundComponent: () => (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">Article not found</h1>
      <Link to="/blog" className="text-brand mt-4 inline-block">← Back to blog</Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="container mx-auto px-4 py-20 text-center text-destructive">{error.message}</div>
  ),
  component: BlogPost,
});

function BlogPost() {
  const post = Route.useLoaderData();
  return (
    <>
      <PageHeader title={post.title} subtitle={post.date} />
      <article className="container mx-auto px-4 py-12 max-w-2xl space-y-4 text-muted-foreground leading-relaxed">
        <p className="text-lg text-foreground">{post.excerpt}</p>
        <p>This is a sample article on the Exonax blog. Content will be populated by the editorial team and cover topics across trading, security, market analysis and platform features.</p>
        <p>Stay tuned for more in-depth content from our research desk.</p>
        <Link to="/blog" className="text-brand inline-block pt-6">← Back to all articles</Link>
      </article>
    </>
  );
}
