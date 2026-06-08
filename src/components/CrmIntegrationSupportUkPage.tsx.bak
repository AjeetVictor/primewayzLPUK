import { Link } from 'react-router-dom';
import { TrackedLink } from './common/TrackedLink';

const services = [
  {
    title: 'Data Synchronization',
    description: 'Keep your CRM data in sync with accounting software, email platforms, and other business tools in real-time.',
  },
  {
    title: 'Workflow Automation',
    description: 'Automate lead routing, follow-up emails, task creation, and other repetitive processes to save time and reduce errors.',
  },
  {
    title: 'Third-Party Integrations',
    description: 'Connect your CRM with marketing automation, e-commerce platforms, project management tools, and more.',
  },
  {
    title: 'Sales Process Optimization',
    description: 'Streamline your sales pipeline with custom integrations that improve visibility and accelerate deal closure.',
  },
  {
    title: 'Data Migration',
    description: 'Safely migrate your customer data from spreadsheets or legacy systems to your new CRM without data loss.',
  },
  {
    title: 'Custom API Development',
    description: 'Build custom integrations when off-the-shelf solutions do not meet your specific business requirements.',
  },
];

const platforms = ['Salesforce', 'HubSpot', 'Zoho CRM', 'Pipedrive', 'Monday.com', 'Freshworks'];

const benefits = [
  {
    title: 'Eliminate Data Entry Duplication',
    description: 'Stop manually entering the same data in multiple systems. Automated sync keeps everything up-to-date.',
  },
  {
    title: 'Improve Sales Team Productivity',
    description: 'Sales reps spend less time on admin and more time selling with automated workflows and instant data access.',
  },
  {
    title: 'Better Customer Insights',
    description: 'Get a 360-degree view of your customers by combining data from all your business systems.',
  },
  {
    title: 'Faster Response Times',
    description: 'Automated lead routing and notifications ensure no opportunity falls through the cracks.',
  },
  {
    title: 'Accurate Reporting',
    description: 'Make better decisions with real-time, accurate reports that pull data from all integrated systems.',
  },
  {
    title: 'Scalable Solutions',
    description: 'Integrations that grow with your business, from startup to enterprise-level operations.',
  },
];

const processSteps = [
  {
    title: 'Discovery',
    description: 'We analyze your current systems, workflows, and business requirements.',
  },
  {
    title: 'Planning',
    description: 'We design the integration architecture and create a detailed implementation plan.',
  },
  {
    title: 'Implementation',
    description: 'We build, test, and deploy the integrations with thorough quality assurance.',
  },
  {
    title: 'Support',
    description: 'Ongoing monitoring, maintenance, and optimization to ensure peak performance.',
  },
];

export function CrmIntegrationSupportUkPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              CRM Integration Support UK
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Connect your CRM with other business tools, automate workflows, and streamline your sales processes with expert integration services for UK SMEs.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <TrackedLink
                href="/#contact"
                ctaText="Book a free CRM integration consultation"
                ctaLocation="crm_integration_hero"
                eventType="book_call_click"
                className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-bold text-blue-600 shadow-lg transition hover:bg-blue-50"
              >
                Book a Free Consultation
              </TrackedLink>
              <a
                href="#services"
                className="inline-flex min-h-[48px] items-center justify-center rounded-lg border-2 border-white px-6 py-3 text-sm font-bold text-white transition hover:border-white/40 hover:bg-white/10"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive CRM Integration Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We help UK businesses connect their CRM systems with other tools to eliminate data silos, automate repetitive tasks, and improve team productivity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported CRM Platforms */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              CRM Platforms We Support
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We work with all major CRM platforms popular among UK businesses.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {platforms.map((platform) => (
              <div key={platform} className="text-center p-6 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                <p className="font-semibold text-gray-900">{platform}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Benefits for UK SMEs
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Proper CRM integration delivers measurable improvements to your business operations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Process */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Integration Process
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A proven methodology that ensures successful CRM integration with minimal disruption.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {processSteps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {index + 1}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Streamline Your CRM?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Let us discuss how we can integrate your CRM with other business tools to improve efficiency and drive growth.
          </p>
          <TrackedLink
            href="/#contact"
            ctaText="Book CRM integration consultation"
            ctaLocation="crm_integration_final_cta"
            eventType="book_call_click"
            className="inline-flex min-h-[52px] items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-bold text-blue-600 transition hover:bg-blue-50"
          >
            Book Your Free Consultation
          </TrackedLink>
        </div>
      </section>
    </main>
  );
}
