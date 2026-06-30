import { Link } from 'react-router-dom';
import { ShieldCheck, FileText, Cookie, ArrowLeft } from 'lucide-react';

type LegalPageType = 'privacy' | 'terms' | 'cookies';

type LegalPageProps = {
  type: LegalPageType;
};

const businessName = 'Primewayz UK';
const contactEmail = 'info@primewayz.com';

const pageContent = {
  privacy: {
    icon: ShieldCheck,
    title: 'Privacy Policy',
    updated: 'Last updated: May 2026',
    intro:
      'This Privacy Policy explains how Primewayz UK collects, uses, stores, and protects personal information when UK businesses visit our website, contact us, request a digital audit, or discuss our subscription-based digital services.',
    sections: [
      {
        title: '1. Who this policy applies to',
        body:
          'This policy applies to visitors, business owners, decision-makers, prospective clients, and client representatives based in the United Kingdom who interact with the Primewayz UK website or contact us about our services.',
      },
      {
        title: '2. Information we may collect',
        body:
          'We may collect your name, business name, work email address, phone number, website URL, business sector, enquiry details, digital challenges, messages submitted through forms, call booking details, and technical website usage information such as pages visited, device type, browser type, approximate location, and referral source.',
      },
      {
        title: '3. How we collect information',
        body:
          'We collect information when you submit a contact form, request a free digital audit, book a call, email us, speak with us, use our website, or interact with our analytics and security tools.',
      },
      {
        title: '4. Why we use your information',
        body:
          'We use your information to respond to enquiries, understand your business requirements, prepare audit findings, suggest suitable subscription plans, provide proposals, deliver agreed services, improve website performance, monitor security, and maintain appropriate business records.',
      },
      {
        title: '5. Lawful basis for processing',
        body:
          'Depending on the situation, we may process your information because it is necessary to respond before entering into a contract, to perform a contract with you, to comply with legal obligations, because we have a legitimate business interest in managing enquiries and improving our services, or because you have given consent, for example for certain marketing or non-essential cookies.',
      },
      {
        title: '6. Marketing communication',
        body:
          'We may contact UK business representatives about relevant Primewayz UK services where permitted by law. You can ask us to stop marketing communication at any time by contacting us or using any unsubscribe option provided.',
      },
      {
        title: '7. Sharing information',
        body:
          'We do not sell personal information. We may share limited information with trusted service providers who help us operate our website, analytics, hosting, email, CRM, call booking, security, or project delivery systems. These providers are only allowed to use information as needed to support our services.',
      },
      {
        title: '8. International processing',
        body:
          'Primewayz may use delivery, hosting, software, or support resources outside the United Kingdom. Where personal information is processed outside the UK, we aim to use appropriate safeguards and suitable service providers to protect that information.',
      },
      {
        title: '9. How long we keep information',
        body:
          'We keep enquiry information only for as long as needed to respond, manage the business relationship, maintain records, improve services, and meet legal or accounting requirements. If no business relationship begins, enquiry records may be periodically reviewed and deleted when no longer required.',
      },
      {
        title: '10. Your UK data protection rights',
        body:
          'Subject to applicable conditions, you may have the right to access your personal information, ask for correction, request deletion, restrict processing, object to processing, request data portability, and withdraw consent where consent is the lawful basis.',
      },
      {
        title: '11. Security',
        body:
          'We use reasonable technical and organisational measures to protect information from unauthorised access, loss, misuse, or disclosure. No website or online transmission can be guaranteed completely secure, but we work to keep information protected.',
      },
      {
        title: '12. Contact us',
        body:
          `For privacy questions or requests, contact ${businessName} at ${contactEmail}.`,
      },
    ],
  },
  terms: {
    icon: FileText,
    title: 'Terms of Service',
    updated: 'Last updated: May 2026',
    intro:
      'These Terms of Service explain the basic conditions for using the Primewayz UK website and discussing or engaging our subscription-based digital services for UK businesses.',
    sections: [
      {
        title: '1. About Primewayz UK',
        body:
          'Primewayz UK provides subscription-based digital services for UK small and medium businesses, including website and platform development, digital audits, SEO support, CRM and tool integrations, automation, maintenance, and ongoing digital improvement work.',
      },
      {
        title: '2. Website use',
        body:
          'You may use this website to learn about our services, submit enquiries, request a digital audit, or contact us. You must not misuse the website, attempt unauthorised access, introduce malware, scrape content at scale, or interfere with the website operation.',
      },
      {
        title: '3. Information on this website',
        body:
          'The content on this website is provided for general business information. It does not create a binding service agreement until a proposal, subscription plan, statement of work, order confirmation, or written agreement has been accepted by both parties.',
      },
      {
        title: '4. Free audit or consultation',
        body:
          'Any free digital audit, discovery call, or initial recommendation is provided to help understand your business needs. It is not a guarantee of specific search ranking, traffic, revenue, lead volume, or business outcome.',
      },
      {
        title: '5. Subscription services',
        body:
          'Where you engage Primewayz UK on a monthly subscription plan, the work will be based on the agreed plan, available monthly capacity, priorities, technical feasibility, and any written scope agreed between both parties.',
      },
      {
        title: '6. Plan changes, pause, or cancellation',
        body:
          'Plan changes, pauses, cancellation terms, notice periods, and maintenance mode terms will be governed by the specific proposal or agreement accepted for your engagement. Unless agreed otherwise, changes should be requested in writing.',
      },
      {
        title: '7. Third-party costs',
        body:
          'Third-party costs such as domain registration, hosting, cloud services, paid plugins, SaaS tools, CRM licences, payment gateways, SMS, WhatsApp Business, advertising spend, stock images, fonts, or APIs are not included unless clearly stated in writing.',
      },
      {
        title: '8. Client responsibilities',
        body:
          'Clients are responsible for providing accurate information, approvals, access credentials, brand assets, content, third-party account access, and timely feedback needed to deliver the agreed work.',
      },
      {
        title: '9. Ownership',
        body:
          'Unless agreed otherwise in writing, clients retain ownership of their business content, domain, hosting accounts, and third-party accounts. Ownership of custom deliverables, code, design files, or configuration work will follow the accepted proposal or written agreement.',
      },
      {
        title: '10. Acceptable use',
        body:
          'Primewayz UK may refuse work involving unlawful activity, harmful content, deceptive practices, spam, malware, unauthorised data access, or activities that could damage users, businesses, or public trust.',
      },
      {
        title: '11. Limitation of outcomes',
        body:
          'We work professionally and aim to improve digital performance, but we do not guarantee specific rankings, sales, revenue, leads, uptime from third-party providers, or platform approvals unless expressly stated in writing.',
      },
      {
        title: '12. Contact',
        body:
          `For questions about these terms, contact ${businessName} at ${contactEmail}.`,
      },
    ],
  },
  cookies: {
    icon: Cookie,
    title: 'Cookie Policy',
    updated: 'Last updated: May 2026',
    intro:
      'This Cookie Policy explains how Primewayz UK may use cookies and similar technologies on our website for visitors in the United Kingdom.',
    sections: [
      {
        title: '1. What cookies are',
        body:
          'Cookies are small text files stored on your device when you visit a website. Similar technologies may include pixels, tags, local storage, scripts, and analytics identifiers.',
      },
      {
        title: '2. How we use cookies',
        body:
          'We may use cookies to keep the website working, improve security, understand how visitors use the website, measure performance, remember preferences, and improve our marketing and user experience.',
      },
      {
        title: '3. Essential cookies',
        body:
          'Essential cookies are required for the website to operate properly. These may support security, page loading, forms, session handling, and basic functionality. These cookies cannot usually be switched off through our website.',
      },
      {
        title: '4. Analytics cookies',
        body:
          'Analytics cookies help us understand website traffic, popular pages, visitor journeys, and conversion performance. We use this information to improve the website and make our UK business content more useful.',
      },
      {
        title: '5. Marketing cookies',
        body:
          'Marketing cookies or similar technologies may be used to understand campaign performance or support relevant advertising. Where required, these should only be used after you have given consent.',
      },
      {
        title: '6. Third-party cookies',
        body:
          'Some cookies may be placed by third-party tools used for analytics, security, embedded content, booking, forms, or advertising. These third parties may process limited information according to their own policies.',
      },
      {
        title: '7. Cookie consent',
        body:
          'For non-essential cookies, we aim to request consent where required under UK cookie rules. You should be able to accept, reject, or manage non-essential cookies when a cookie banner or settings tool is available.',
      },
      {
        title: '8. Managing cookies in your browser',
        body:
          'You can block or delete cookies through your browser settings. If you block all cookies, some website features may not work as intended.',
      },
      {
        title: '9. Changes to this policy',
        body:
          'We may update this Cookie Policy if our website, analytics setup, advertising tools, or legal requirements change.',
      },
      {
        title: '10. Contact',
        body:
          `For questions about cookies, contact ${businessName} at ${contactEmail}.`,
      },
    ],
  },
};

export default function LegalPage({ type }: LegalPageProps) {
  const content = pageContent[type];
  const Icon = content.icon;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="px-6 py-10 md:py-16">
        <div className="mx-auto max-w-[1200px]">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 md:p-10 shadow-2xl">
            <div className="mb-8 flex items-start gap-4">
              <div className="rounded-2xl bg-blue-500/10 p-4 text-blue-400">
                <Icon className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-widest text-blue-400">
                  Primewayz UK
                </p>
                <h1 className="text-3xl md:text-5xl font-bold mt-2">
                  {content.title}
                </h1>
                <p className="text-sm text-zinc-500 mt-2">{content.updated}</p>
              </div>
            </div>

            <p className="text-lg leading-8 text-zinc-300 border-b border-zinc-800 pb-8">
              {content.intro}
            </p>

            <div className="mt-8 space-y-8">
              {content.sections.map((section) => (
                <section key={section.title}>
                  <h2 className="text-xl font-semibold text-white mb-3">
                    {section.title}
                  </h2>
                  <p className="leading-7 text-zinc-400">{section.body}</p>
                </section>
              ))}
            </div>

            <div className="mt-10 rounded-2xl bg-zinc-950 border border-zinc-800 p-5">
              <h2 className="font-semibold mb-2">Important note</h2>
              <p className="text-zinc-400 leading-7">
                This page is written for Primewayz UK website visitors and business enquiries in the United Kingdom. It is not intended for India, the EU, the USA, or any other region.
              </p>
            </div>

            <div className="mt-5 rounded-2xl bg-zinc-950 border border-zinc-800 p-5">
              <h2 className="font-semibold mb-2">Contact</h2>
              <p className="text-zinc-400 leading-7">
                Email:{' '}
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-blue-400 hover:text-blue-300"
                >
                  {contactEmail}
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
