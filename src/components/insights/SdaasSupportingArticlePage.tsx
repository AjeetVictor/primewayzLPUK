import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock, User } from 'lucide-react';
import { CANONICAL_ROUTES } from '../../constants/canonicalRoutes';
import { CommercialSectionVisual } from '../commercial/CommercialSectionVisual';
import { SdaasFaqAccordion } from '../sdaas/SdaasFaqAccordion';
import type {
  SupportingArticleBlock,
  SupportingArticleDefinition,
} from '../../data/sdaas/supportingArticleTypes';
import { useCommercialSectionView } from '../../hooks/useCommercialSectionView';
import { trackSdaasEvent } from '../../lib/sdaasAnalytics';
import { cn } from '../../utils/cn';

function formatDisplayDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function ArticleSection({
  id,
  sectionKey,
  sectionName,
  title,
  children,
  article,
}: {
  id?: string;
  sectionKey: string;
  sectionName: string;
  title: string;
  children: ReactNode;
  article: SupportingArticleDefinition;
}) {
  const ref = useCommercialSectionView(sectionKey, {
    eventName: 'sdaas_supporting_article_section_view',
    sectionName,
    contentCluster: 'sdaas',
    extraParams: {
      article_slug: article.slug,
      article_title: article.seo.h1,
      source_page: article.path,
      content_type: 'supporting_article',
    },
  });

  return (
    <section id={id} ref={ref} className="scroll-mt-24 border-t border-slate-100 py-12 sm:py-14">
      <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
      <div className="mt-6 space-y-5 text-base leading-8 text-slate-700">{children}</div>
      <span className="sr-only">
        {article.slug}:{sectionKey}
      </span>
    </section>
  );
}

function TrackedLink({
  to,
  children,
  className,
  location,
  label,
  article,
  eventName = 'sdaas_supporting_article_service_click',
}: {
  to: string;
  children: ReactNode;
  className?: string;
  location: string;
  label: string;
  article: SupportingArticleDefinition;
  eventName?:
    | 'sdaas_supporting_article_cta_click'
    | 'sdaas_supporting_article_service_click'
    | 'sdaas_supporting_article_related_click';
}) {
  return (
    <Link
      to={to}
      className={className}
      onClick={() =>
        trackSdaasEvent(eventName, {
          cta_location: location,
          cta_label: label,
          destination: to,
          source_page: article.path,
          article_slug: article.slug,
          article_title: article.seo.h1,
          link_context: location,
          content_cluster: 'sdaas',
          content_type: 'supporting_article',
        })
      }
    >
      {children}
    </Link>
  );
}

function renderBlocks(blocks: readonly SupportingArticleBlock[], article: SupportingArticleDefinition) {
  return blocks.map((block, index) => {
    const key = `${article.slug}-block-${index}`;

    switch (block.type) {
      case 'paragraphs':
        return block.texts.map((text, textIndex) => (
          <p key={`${key}-p-${textIndex}`}>{text}</p>
        ));
      case 'bullets':
        return block.ordered ? (
          <ol key={key} className="list-decimal space-y-2 pl-5">
            {block.items.map((item) => (
              <li key={item} className="text-sm leading-7 text-slate-700 sm:text-base">
                {item}
              </li>
            ))}
          </ol>
        ) : (
          <ul key={key} className="space-y-2">
            {block.items.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-7 text-slate-700 sm:text-base">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );
      case 'callout': {
        const toneClass =
          block.tone === 'warning'
            ? 'border-amber-200 bg-amber-50/70'
            : block.tone === 'geo'
              ? 'border-slate-200 bg-slate-50'
              : 'border-emerald-200 bg-emerald-50/70';
        return (
          <p
            key={key}
            className={cn(
              'rounded-xl border px-4 py-3 text-sm font-medium leading-7 text-slate-800',
              toneClass,
            )}
          >
            {block.text}
          </p>
        );
      }
      case 'subsection':
        return (
          <div key={key}>
            <h3 className="text-base font-bold text-slate-950">{block.title}</h3>
            {block.paragraphs?.map((text) => (
              <p key={text} className="mt-3">
                {text}
              </p>
            ))}
            {block.bullets ? (
              block.ordered ? (
                <ol className="mt-3 list-decimal space-y-2 pl-5">
                  {block.bullets.map((item) => (
                    <li key={item} className="text-sm leading-7 text-slate-700">
                      {item}
                    </li>
                  ))}
                </ol>
              ) : (
                <ul className="mt-3 space-y-2">
                  {block.bullets.map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-7 text-slate-700">
                      <span
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400"
                        aria-hidden
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )
            ) : null}
          </div>
        );
      case 'table':
        return (
          <div key={key} className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {block.headers.map((header) => (
                    <th key={header} scope="col" className="px-4 py-3 font-semibold text-slate-900">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {block.rows.map((row) => (
                  <tr key={row.join('|')}>
                    {row.map((cell) => (
                      <td key={`${row[0]}-${cell}`} className="px-4 py-3 align-top text-slate-700">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'checklist':
        return (
          <ul key={key} className="space-y-3">
            {block.items.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-7 text-slate-700 sm:text-base">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );
      case 'scorecard':
        return (
          <div key={key} className="space-y-5">
            {block.intro ? <p>{block.intro}</p> : null}
            <div className="grid gap-4 sm:grid-cols-2">
              {block.categories.map((category) => (
                <div
                  key={category.name}
                  className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5"
                >
                  <h3 className="text-base font-bold text-slate-950">{category.name}</h3>
                  <ul className="mt-3 space-y-2">
                    {category.prompts.map((prompt) => (
                      <li key={prompt} className="flex gap-2 text-sm leading-7 text-slate-700">
                        <span
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
                          aria-hidden
                        />
                        <span>{prompt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );
      case 'visual':
        return (
          <CommercialSectionVisual key={key} image={block.image} caption={block.caption} />
        );
      case 'geo':
        return (
          <ul key={key} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
            {block.statements.map((statement) => (
              <li key={statement} className="text-sm font-medium leading-7 text-slate-800">
                {statement}
              </li>
            ))}
          </ul>
        );
      default:
        return null;
    }
  });
}

type SdaasSupportingArticlePageProps = {
  article: SupportingArticleDefinition;
};

export function SdaasSupportingArticlePage({ article }: SdaasSupportingArticlePageProps) {
  const { seo } = article;

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <article className="mx-auto max-w-[760px] px-4 pb-20 pt-24 sm:px-6 lg:max-w-[820px]">
        <nav className="mb-8 text-sm font-semibold text-slate-500" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link to="/" className="transition hover:text-slate-900">
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="text-slate-300">
              /
            </li>
            <li>
              <Link to={CANONICAL_ROUTES.blog} className="transition hover:text-slate-900">
                Insights
              </Link>
            </li>
            <li aria-hidden="true" className="text-slate-300">
              /
            </li>
            <li className="text-slate-900">{article.breadcrumbLabel}</li>
          </ol>
        </nav>

        <header className="border-b border-slate-100 pb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            {seo.category}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-[2.65rem] lg:leading-[1.15]">
            {seo.h1}
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">{seo.standfirst}</p>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <User className="h-4 w-4" aria-hidden />
              {seo.author}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" aria-hidden />
              <time dateTime={seo.datePublished}>{formatDisplayDate(seo.datePublished)}</time>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" aria-hidden />
              {seo.readTime}
            </span>
          </div>
        </header>

        <div className="prose-sdaas mt-10 space-y-5 text-base leading-8 text-slate-700">
          {article.introParagraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}

          {article.introAsides && article.introAsides.length > 0 ? (
            <aside className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-5 py-4 text-sm leading-7 text-slate-800">
              {article.introAsides.map((aside) => (
                <p key={aside.href + aside.linkLabel}>
                  <span className="font-semibold text-slate-950">{aside.label}</span>{' '}
                  <TrackedLink
                    to={aside.href}
                    location={`${article.slug}_intro_aside`}
                    label={aside.linkLabel}
                    article={article}
                    className="font-semibold text-emerald-800 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-900"
                  >
                    {aside.linkLabel}
                  </TrackedLink>
                  .
                </p>
              ))}
            </aside>
          ) : null}
        </div>

        <ArticleSection
          id="direct-answer"
          sectionKey="direct_answer"
          sectionName={article.directAnswerTitle}
          title={article.directAnswerTitle}
          article={article}
        >
          <p className="text-lg font-medium leading-8 text-slate-900">{article.directAnswer}</p>
          {article.directAnswerFollow ? <p>{article.directAnswerFollow}</p> : null}
          {article.geoStatements[0] ? (
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium leading-7 text-slate-800">
              {article.geoStatements[0]}
            </p>
          ) : null}
        </ArticleSection>

        {article.sections.map((section) => (
          <ArticleSection
            key={section.id}
            id={section.id}
            sectionKey={section.sectionKey}
            sectionName={section.title}
            title={section.title}
            article={article}
          >
            {renderBlocks(section.blocks, article)}
          </ArticleSection>
        ))}

        <ArticleSection
          id="faqs"
          sectionKey="faqs"
          sectionName="Frequently asked questions"
          title="Frequently Asked Questions"
          article={article}
        >
          <SdaasFaqAccordion
            faqs={article.faqs}
            eventName="sdaas_supporting_article_faq_open"
            contentCluster="sdaas"
            extraParams={{
              article_slug: article.slug,
              article_title: article.seo.h1,
              source_page: article.path,
              content_type: 'supporting_article',
            }}
          />
        </ArticleSection>

        <ArticleSection
          id="conclusion"
          sectionKey="conclusion"
          sectionName="Conclusion"
          title="Next Steps"
          article={article}
        >
          {article.conclusion.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
          <div className="flex flex-col gap-3 sm:flex-row">
            <TrackedLink
              to={article.conclusion.primaryCta.href}
              location={`${article.slug}_conclusion_primary`}
              label={article.conclusion.primaryCta.label}
              article={article}
              eventName="sdaas_supporting_article_cta_click"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#000A2D] px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              {article.conclusion.primaryCta.label}
            </TrackedLink>
            {article.conclusion.secondaryCta ? (
              <TrackedLink
                to={article.conclusion.secondaryCta.href}
                location={`${article.slug}_conclusion_secondary`}
                label={article.conclusion.secondaryCta.label}
                article={article}
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-bold text-slate-900 transition hover:border-emerald-600 hover:text-emerald-800"
              >
                {article.conclusion.secondaryCta.label}
              </TrackedLink>
            ) : null}
          </div>
        </ArticleSection>

        <section className="mt-4 scroll-mt-24 border-t border-slate-100 py-12 sm:py-14">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Related content
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {article.relatedLiveLinks.map((link) => (
              <TrackedLink
                key={link.href}
                to={link.href}
                location={`${article.slug}_related_live`}
                label={link.title}
                article={article}
                eventName="sdaas_supporting_article_related_click"
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm"
              >
                <h3 className="font-bold text-slate-950">{link.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{link.description}</p>
              </TrackedLink>
            ))}
          </div>
          {article.relatedBlogLinks && article.relatedBlogLinks.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {article.relatedBlogLinks.map((link) => (
                <TrackedLink
                  key={link.href}
                  to={link.href}
                  location={`${article.slug}_related_blog`}
                  label={link.title}
                  article={article}
                  eventName="sdaas_supporting_article_related_click"
                  className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 transition hover:border-emerald-300"
                >
                  <h3 className="font-bold text-slate-950">{link.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{link.description}</p>
                </TrackedLink>
              ))}
            </div>
          ) : null}
        </section>
      </article>
    </main>
  );
}
