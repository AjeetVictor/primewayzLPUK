import { Link } from 'react-router-dom';
import { 
  FiDatabase, 
  FiRefreshCw, 
  FiZap, 
  FiTrendingUp, 
  FiCheckCircle, 
  FiArrowRight,
  FiMessageSquare,
  FiCalendar
} from 'react-icons/fi';

export function CrmIntegrationSupportUkPage() {
  return (
    <div className="min-h-screen bg-white">
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
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/contact" 
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
              >
                <FiCalendar className="mr-2" />
                Book a Free Consultation
              </Link>
              <a 
                href="#services" 
                className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
              >
                Learn More
                <FiArrowRight className="ml-2" />
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
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <FiDatabase className="text-3xl text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Data Synchronization</h3>
              <p className="text-gray-600">
                Keep your CRM data in sync with accounting software, email platforms, and other business tools in real-time.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <FiRefreshCw className="text-3xl text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Workflow Automation</h3>
              <p className="text-gray-600">
                Automate lead routing, follow-up emails, task creation, and other repetitive processes to save time and reduce errors.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <FiZap className="text-3xl text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Third-Party Integrations</h3>
              <p className="text-gray-600">
                Connect your CRM with marketing automation, e-commerce platforms, project management tools, and more.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <FiTrendingUp className="text-3xl text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Sales Process Optimization</h3>
              <p className="text-gray-600">
                Streamline your sales pipeline with custom integrations that improve visibility and accelerate deal closure.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <FiCheckCircle className="text-3xl text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Data Migration</h3>
              <p className="text-gray-600">
                Safely migrate your customer data from spreadsheets or legacy systems to your new CRM without data loss.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
                <FiMessageSquare className="text-3xl text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Custom API Development</h3>
              <p className="text-gray-600">
                Build custom integrations when off-the-shelf solutions don't meet your specific business requirements.
              </p>
            </div>
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
            {['Salesforce', 'HubSpot', 'Zoho CRM', 'Pipedrive', 'Monday.com', 'Freshworks'].map((platform) => (
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
            <div className="flex items-start space-x-4">
              <FiCheckCircle className="text-3xl text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Eliminate Data Entry Duplication</h3>
                <p className="text-gray-600">
                  Stop manually entering the same data in multiple systems. Automated sync keeps everything up-to-date.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <FiCheckCircle className="text-3xl text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Improve Sales Team Productivity</h3>
                <p className="text-gray-600">
                  Sales reps spend less time on admin and more time selling with automated workflows and instant data access.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <FiCheckCircle className="text-3xl text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Better Customer Insights</h3>
                <p className="text-gray-600">
                  Get a 360-degree view of your customers by combining data from all your business systems.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <FiCheckCircle className="text-3xl text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Faster Response Times</h3>
                <p className="text-gray-600">
                  Automated lead routing and notifications ensure no opportunity falls through the cracks.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <FiCheckCircle className="text-3xl text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Accurate Reporting</h3>
                <p className="text-gray-600">
                  Make better decisions with real-time, accurate reports that pull data from all integrated systems.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <FiCheckCircle className="text-3xl text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Scalable Solutions</h3>
                <p className="text-gray-600">
                  Integrations that grow with your business, from startup to enterprise-level operations.
                </p>
              </div>
            </div>
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
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Discovery</h3>
              <p className="text-gray-600">
                We analyze your current systems, workflows, and business requirements.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Planning</h3>
              <p className="text-gray-600">
                We design the integration architecture and create a detailed implementation plan.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Implementation</h3>
              <p className="text-gray-600">
                We build, test, and deploy the integrations with thorough quality assurance.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Support</h3>
              <p className="text-gray-600">
                Ongoing monitoring, maintenance, and optimization to ensure peak performance.
              </p>
            </div>
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
            Let's discuss how we can integrate your CRM with other business tools to improve efficiency and drive growth.
          </p>
          <Link 
            to="/contact" 
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
          >
            <FiCalendar className="mr-2" />
            Book Your Free Consultation
          </Link>
        </div>
      </section>
    </div>
  );
}
