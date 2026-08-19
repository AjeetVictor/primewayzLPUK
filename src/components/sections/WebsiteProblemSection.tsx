import { Link } from 'react-router-dom';
import { CANONICAL_ROUTES } from '../../constants/canonicalRoutes';
import { trackConversionEvent } from '../../lib/analytics';
import './WebsiteProblemSection.css';

export const WebsiteProblemSection = () => {
  return (
    <section
      id="visibility-trust-enquiry"
      className="website-visibility-section"
      aria-labelledby="website-visibility-title"
    >
      <div className="website-visibility-container">
        <div className="website-visibility-visual">
          <img
            src="/images/visibility-creative.webp"
            alt="A live business website surrounded by barriers, showing the importance of being found, building trust and creating a clear path to customer enquiries."
            width={1080}
            height={1920}
            loading="lazy"
            decoding="async"
            className="website-visibility-image"
          />
        </div>

        <div className="website-visibility-content">
          <p className="website-visibility-eyebrow">
            What may be holding your website back
          </p>

          <h2
            id="website-visibility-title"
            className="website-visibility-heading"
          >
            Your website may be live, but is it helping people find, trust and contact you?
          </h2>

          <p className="website-visibility-intro">
            Many UK businesses do not need a full redesign first. They need clearer discovery,
            stronger trust signals and a simpler path from interest to enquiry.
          </p>

          <ul className="website-visibility-features" role="list">
            <li className="website-feature">
              <div className="website-feature-icon" aria-hidden="true">
                <svg viewBox="0 0 64 64" role="presentation" focusable="false">
                  <path d="M6 32s9.5-14 26-14 26 14 26 14-9.5 14-26 14S6 32 6 32Z" />
                  <circle cx="32" cy="32" r="7" />
                  <path d="M32 7v5M32 52v5M7 32h5M52 32h5" />
                  <path d="m13.5 13.5 3.6 3.6M46.9 46.9l3.6 3.6" />
                  <path d="m50.5 13.5-3.6 3.6M17.1 46.9l-3.6 3.6" />
                </svg>
              </div>

              <h3 className="website-feature-title">Visibility</h3>

              <p className="website-feature-description">
                Can customers and search systems discover the business?
              </p>
            </li>

            <li className="website-feature">
              <div className="website-feature-icon" aria-hidden="true">
                <svg viewBox="0 0 64 64" role="presentation" focusable="false">
                  <path d="M32 5 54 14v16c0 14-8.7 23.5-22 29C18.7 53.5 10 44 10 30V14L32 5Z" />
                  <path d="m22 31 7 7 14-15" />
                </svg>
              </div>

              <h3 className="website-feature-title">Trust</h3>

              <p className="website-feature-description">
                Do visitors see enough clarity, proof and confidence?
              </p>
            </li>

            <li className="website-feature">
              <div className="website-feature-icon" aria-hidden="true">
                <svg viewBox="0 0 64 64" role="presentation" focusable="false">
                  <path d="M8 24 32 42 56 24" />
                  <path d="M11 22h42a3 3 0 0 1 3 3v27H8V25a3 3 0 0 1 3-3Z" />
                  <path d="M20 27V8h24v19" />
                  <path d="M26 15h12M26 21h12" />
                  <path d="m8 52 18-15M56 52 38 37" />
                </svg>
              </div>

              <h3 className="website-feature-title">Enquiry</h3>

              <p className="website-feature-description">
                Can an interested visitor contact, book or submit easily?
              </p>
            </li>
          </ul>

          <Link
            to={CANONICAL_ROUTES.websiteVisibilitySupport}
            className="website-visibility-cta"
            aria-label="Explore website visibility support services"
            onClick={() => {
              trackConversionEvent('visibility_support_link_click', {
                cta_location: 'homepage_problem_section',
                destination: CANONICAL_ROUTES.websiteVisibilitySupport,
              });
            }}
          >
            <span>Explore website visibility support</span>

            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M5 12h14M14 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};
