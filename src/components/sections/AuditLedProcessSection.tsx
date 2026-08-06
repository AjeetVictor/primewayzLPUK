import type { ReactNode } from 'react';
import {
  DELIVERY_PROCESS_INTRO,
  deliveryProcessSteps,
  type DeliveryProcessStep,
} from '../../content/deliveryProcessSteps';
import './AuditLedProcessSection.css';

function TitleArrow() {
  return (
    <svg
      className="delivery-process__title-arrow"
      viewBox="0 0 36 18"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M1 9h31M25 2l8 7-8 7" />
    </svg>
  );
}

function StepIcon({ id }: { id: DeliveryProcessStep['id'] }) {
  if (id === 'review') {
    return (
      <svg
        viewBox="0 0 64 64"
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
      >
        <path d="M11 7h28l11 11v20" />
        <path d="M39 7v12h12" />
        <path d="M11 7v47h28" />
        <line x1="19" y1="25" x2="36" y2="25" />
        <line x1="19" y1="33" x2="32" y2="33" />
        <line x1="19" y1="41" x2="29" y2="41" />
        <circle cx="43" cy="43" r="11" />
        <line x1="51" y1="51" x2="59" y2="59" />
      </svg>
    );
  }

  if (id === 'prioritise') {
    return (
      <svg
        viewBox="0 0 64 64"
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
      >
        <rect x="14" y="10" width="36" height="45" rx="4" />
        <path d="M23 10V6h18v4" />
        <polyline points="21,23 25,27 32,19" />
        <polyline points="21,35 25,39 32,31" />
        <line x1="36" y1="23" x2="44" y2="23" />
        <line x1="36" y1="35" x2="44" y2="35" />
        <line x1="21" y1="47" x2="36" y2="47" />
        <circle cx="49" cy="49" r="10" />
        <polyline points="45,49 48,52 54,45" />
      </svg>
    );
  }

  if (id === 'improve') {
    return (
      <svg
        viewBox="0 0 64 64"
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
      >
        <rect x="7" y="10" width="50" height="37" rx="4" />
        <line x1="7" y1="19" x2="57" y2="19" />
        <circle cx="13" cy="15" r="1" />
        <circle cx="19" cy="15" r="1" />
        <circle cx="32" cy="36" r="8" />
        <line x1="32" y1="24" x2="32" y2="28" />
        <line x1="32" y1="44" x2="32" y2="48" />
        <line x1="20" y1="36" x2="24" y2="36" />
        <line x1="40" y1="36" x2="44" y2="36" />
        <line x1="23.5" y1="27.5" x2="26.5" y2="30.5" />
        <line x1="37.5" y1="41.5" x2="40.5" y2="44.5" />
        <line x1="40.5" y1="27.5" x2="37.5" y2="30.5" />
        <line x1="26.5" y1="41.5" x2="23.5" y2="44.5" />
        <line x1="25" y1="54" x2="39" y2="54" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      <line x1="8" y1="54" x2="57" y2="54" />
      <rect x="13" y="39" width="9" height="15" />
      <rect x="28" y="30" width="9" height="24" />
      <rect x="43" y="19" width="9" height="35" />
      <polyline points="15,31 28,20 38,25 51,11" />
      <circle cx="15" cy="31" r="3" />
      <circle cx="28" cy="20" r="3" />
      <circle cx="38" cy="25" r="3" />
      <circle cx="51" cy="11" r="3" />
    </svg>
  );
}

function DeliveryDashboard() {
  return (
    <aside
      className="delivery-dashboard"
      aria-label="Example progress overview"
    >
      <div className="delivery-dashboard__top">
        <h3 className="delivery-dashboard__title">Progress overview</h3>

        <div className="delivery-dashboard__menu" aria-hidden="true">
          <span />
          <span />
        </div>
      </div>

      <div className="delivery-dashboard__charts">
        <svg
          className="delivery-dashboard__line-chart"
          viewBox="0 0 270 106"
          aria-hidden="true"
          focusable="false"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient
              id="dpAreaFill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#0d5fe8" stopOpacity=".20" />
              <stop offset="100%" stopColor="#0d5fe8" stopOpacity=".02" />
            </linearGradient>
          </defs>

          <path className="grid" d="M8 22H262M8 51H262M8 80H262" />
          <path
            className="area"
            d="M10 92L62 71L104 75L148 44L196 61L255 19V99H10Z"
          />
          <path
            className="line"
            d="M10 92L62 71L104 75L148 44L196 61L255 19"
          />

          <circle className="point" cx="10" cy="92" r="4" />
          <circle className="point" cx="62" cy="71" r="4" />
          <circle className="point" cx="104" cy="75" r="4" />
          <circle className="point" cx="148" cy="44" r="4" />
          <circle className="point" cx="196" cy="61" r="4" />
          <circle className="point" cx="255" cy="19" r="4" />
        </svg>

        <svg
          className="delivery-dashboard__donut"
          viewBox="0 0 100 100"
          aria-hidden="true"
          focusable="false"
          preserveAspectRatio="xMidYMid meet"
        >
          <circle className="track" cx="50" cy="50" r="38" />
          <circle className="value" cx="50" cy="50" r="38" />
        </svg>
      </div>

      <div className="delivery-dashboard__metrics">
        <div className="delivery-dashboard__metric">
          <strong>+28%</strong>
          <span>Performance</span>
        </div>

        <div className="delivery-dashboard__metric">
          <strong>-16%</strong>
          <span>Risk</span>
        </div>

        <div className="delivery-dashboard__metric">
          <strong>+42%</strong>
          <span>Opportunities</span>
        </div>
      </div>
    </aside>
  );
}

function DeliveryRoute() {
  return (
    <div className="delivery-route" aria-hidden="true">
      <div className="delivery-route__platform">
        <span className="delivery-route__platform-step" />
        <span className="delivery-route__platform-step" />
        <span className="delivery-route__platform-step" />
        <span className="delivery-route__platform-step" />
      </div>

      <svg
        className="delivery-route__svg"
        viewBox="0 0 1000 176"
        preserveAspectRatio="none"
        focusable="false"
      >
        <path className="delivery-route__leader" d="M125 0V154" />
        <path className="delivery-route__leader" d="M375 0V118" />
        <path className="delivery-route__leader" d="M625 0V82" />
        <path className="delivery-route__leader" d="M875 0V46" />

        <path
          className="delivery-route__line"
          d="M0 154H250V118H500V82H750V46H1000"
        />

        <circle className="delivery-route__node" cx="125" cy="154" r="8" />
        <circle className="delivery-route__node" cx="375" cy="118" r="8" />
        <circle className="delivery-route__node" cx="625" cy="82" r="8" />
        <circle className="delivery-route__node" cx="875" cy="46" r="8" />
      </svg>
    </div>
  );
}

function BenefitIcon({ children }: { children: ReactNode }) {
  return (
    <div className="delivery-benefit__icon" aria-hidden="true">
      <svg viewBox="0 0 48 48" focusable="false">
        {children}
      </svg>
    </div>
  );
}

export const AuditLedProcessSection = () => {
  return (
    <section
      className="delivery-process"
      id="delivery-process"
      aria-labelledby="delivery-process-title"
    >
      <div className="delivery-process__container">
        <header className="delivery-process__header">
          <div>
            <p className="delivery-process__eyebrow">Our Delivery Process</p>

            <h2
              id="delivery-process-title"
              className="delivery-process__title"
            >
              <span>Review</span>
              <TitleArrow />
              <span>Prioritise</span>
              <TitleArrow />
              <span>Improve</span>
              <TitleArrow />
              <span>Track</span>
            </h2>

            <p className="delivery-process__intro">{DELIVERY_PROCESS_INTRO}</p>
          </div>

          <DeliveryDashboard />
        </header>

        <ol className="delivery-process__steps">
          {deliveryProcessSteps.map((step) => (
            <li key={step.id} className="delivery-step">
              <span className="delivery-step__number">{step.number}</span>

              <div className="delivery-step__icon" aria-hidden="true">
                <StepIcon id={step.id} />
              </div>

              <div className="delivery-step__content">
                <h3 className="delivery-step__title">{step.title}</h3>
                <p className="delivery-step__description">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>

        <DeliveryRoute />

        <ul className="delivery-benefits" role="list">
          <li className="delivery-benefit">
            <BenefitIcon>
              <path d="M24 4 39 10v11c0 10-5.7 17-15 22C14.7 38 9 31 9 21V10l15-6Z" />
              <line x1="24" y1="5" x2="24" y2="42" />
              <line x1="10" y1="18" x2="38" y2="18" />
              <polyline points="15,27 20,32 30,22" />
            </BenefitIcon>
            <span className="delivery-benefit__label">Practical priorities</span>
          </li>

          <li className="delivery-benefit">
            <BenefitIcon>
              <circle cx="24" cy="24" r="18" />
              <line x1="24" y1="13" x2="24" y2="25" />
              <line x1="24" y1="25" x2="32" y2="29" />
            </BenefitIcon>
            <span className="delivery-benefit__label">Clear progress</span>
          </li>

          <li className="delivery-benefit">
            <BenefitIcon>
              <circle cx="18" cy="17" r="6" />
              <circle cx="33" cy="19" r="5" />
              <path d="M6 40c0-9 4-14 12-14s12 5 12 14" />
              <path d="M27 28c9 0 14 4 14 12" />
              <line x1="2" y1="40" x2="46" y2="40" />
            </BenefitIcon>
            <span className="delivery-benefit__label">Aligned teams</span>
          </li>

          <li className="delivery-benefit">
            <BenefitIcon>
              <circle cx="21" cy="27" r="16" />
              <circle cx="21" cy="27" r="10" />
              <circle cx="21" cy="27" r="4" />
              <line x1="24" y1="24" x2="43" y2="5" />
              <polyline points="35,5 43,5 43,13" />
            </BenefitIcon>
            <span className="delivery-benefit__label">Better outcomes</span>
          </li>
        </ul>
      </div>
    </section>
  );
};
