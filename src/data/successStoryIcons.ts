import { BookOpen, Layers, Smartphone, type LucideIcon } from 'lucide-react';
import type { SuccessStoryIconKey } from '../data/successStories';

export const successStoryIconByKey: Record<SuccessStoryIconKey, LucideIcon> = {
  layers: Layers,
  'book-open': BookOpen,
  smartphone: Smartphone,
};
