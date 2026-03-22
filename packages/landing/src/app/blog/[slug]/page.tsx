import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getAllPosts, getPost } from '@/lib/blog';

const DEFAULT_OG_IMAGE = 'https://emithq.com/icon.svg';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt,
    authors: [{ name: post.author }],
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      url: `https://emithq.com/blog/${slug}`,
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
      images: [{ url: DEFAULT_OG_IMAGE, alt: post.title }],
    },
    twitter: {
      card: 'summary',
      title: post.title,
      description: post.excerpt,
      images: [DEFAULT_OG_IMAGE],
    },
    alternates: {
      canonical: `/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'EmitHQ',
      url: 'https://emithq.com',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://emithq.com/blog/${post.slug}`,
    },
    keywords: post.tags.join(', '),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Link
          href="/blog"
          className="mb-8 inline-block text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]"
        >
          &larr; Back to blog
        </Link>

        <header className="mb-10">
          <h1 className="mb-4 text-3xl font-bold leading-tight sm:text-4xl">{post.title}</h1>
          <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
            <span>{post.author}</span>
            <span>&middot;</span>
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
        </header>

        <article className="prose-emithq">
          <MDXRemote source={post.content} />
        </article>
      </main>
    </>
  );
}
