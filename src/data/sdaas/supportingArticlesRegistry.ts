import { capacityArticle } from './capacityArticle';
import { prioritisationArticle } from './prioritisationArticle';
import { applicationRescueArticle } from './applicationRescueArticle';
import { technicalDebtArticle } from './technicalDebtArticle';
import { continuousDevelopmentArticle } from './continuousDevelopmentArticle';
import { maintenanceVsDevelopmentArticle } from './maintenanceVsDevelopmentArticle';
import { choosePartnerArticle } from './choosePartnerArticle';
import type { SupportingArticleDefinition } from './supportingArticleTypes';

/** All live SDaaS supporting articles (cluster articles 4–10). */
export const SDAAS_SUPPORTING_ARTICLES: readonly SupportingArticleDefinition[] = [
  capacityArticle,
  prioritisationArticle,
  applicationRescueArticle,
  technicalDebtArticle,
  continuousDevelopmentArticle,
  maintenanceVsDevelopmentArticle,
  choosePartnerArticle,
] as const;

export const SDAAS_SUPPORTING_ARTICLES_BY_PATH: ReadonlyMap<string, SupportingArticleDefinition> =
  new Map(SDAAS_SUPPORTING_ARTICLES.map((article) => [article.path, article]));

export function getSdaasSupportingArticleByPath(
  path: string,
): SupportingArticleDefinition | undefined {
  return SDAAS_SUPPORTING_ARTICLES_BY_PATH.get(path);
}

export {
  capacityArticle,
  prioritisationArticle,
  applicationRescueArticle,
  technicalDebtArticle,
  continuousDevelopmentArticle,
  maintenanceVsDevelopmentArticle,
  choosePartnerArticle,
};
