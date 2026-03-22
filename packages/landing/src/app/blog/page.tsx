import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Technical insights about webhook infrastructure, reliability engineering, and building EmitHQ in the open.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'EmitHQ Blog',
    description:
      'Technical insights about webhook infrastructure, reliability engineering, and building EmitHQ in the open.',
    url: 'https://emithq.com/blog',
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold">Blog</h1>
      <p className="mb-12 text-[var(--color-text-muted)]">
        Webhook infrastructure insights, architecture decisions, and build-in-public updates.
      </p>

      {posts.length === 0 ? (
        <p className="text-[var(--color-text-muted)]">No posts yet. Check back soon.</p>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="rounded-lg border border-[var(--color-border)] p-6 transition-colors hover:border-[var(--color-accent)]/40"
            >
              <Link href={`/blog/${post.slug}`} className="block">
                <h2 className="mb-2 text-xl font-semibold hover:text-[var(--color-accent)]">
                  {post.title}
                </h2>
                <div className="mb-3 flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                  <span>&middot;</span>
                  <span>{post.readingTime}</span>
                </div>
                <p className="text-sm text-[var(--color-text-muted)]">{post.excerpt}</p>
              </Link>
              {post.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-text-muted)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
