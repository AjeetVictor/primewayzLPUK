import { SdaasSupportingArticlePage } from './SdaasSupportingArticlePage';
import { capacityArticle } from '../../data/sdaas/capacityArticle';
import { prioritisationArticle } from '../../data/sdaas/prioritisationArticle';
import { applicationRescueArticle } from '../../data/sdaas/applicationRescueArticle';
import { technicalDebtArticle } from '../../data/sdaas/technicalDebtArticle';
import { continuousDevelopmentArticle } from '../../data/sdaas/continuousDevelopmentArticle';
import { maintenanceVsDevelopmentArticle } from '../../data/sdaas/maintenanceVsDevelopmentArticle';
import { choosePartnerArticle } from '../../data/sdaas/choosePartnerArticle';

export function HowMonthlySoftwareDevelopmentCapacityWorksPage() {
  return <SdaasSupportingArticlePage article={capacityArticle} />;
}

export function HowToPrioritiseSoftwareDevelopmentRequestsPage() {
  return <SdaasSupportingArticlePage article={prioritisationArticle} />;
}

export function ApplicationRescueAndStabilisationPage() {
  return <SdaasSupportingArticlePage article={applicationRescueArticle} />;
}

export function TechnicalDebtExplainedForBusinessOwnersPage() {
  return <SdaasSupportingArticlePage article={technicalDebtArticle} />;
}

export function WhyBusinessesMoveToContinuousSoftwareDevelopmentPage() {
  return <SdaasSupportingArticlePage article={continuousDevelopmentArticle} />;
}

export function SoftwareMaintenanceVsContinuousProductDevelopmentPage() {
  return <SdaasSupportingArticlePage article={maintenanceVsDevelopmentArticle} />;
}

export function HowToChooseASoftwareDevelopmentPartnerPage() {
  return <SdaasSupportingArticlePage article={choosePartnerArticle} />;
}
