import { OptimizedPicture } from '../../ui/OptimizedPicture';
import { OUTCOME_PILLAR_IMAGE_ASPECT } from '../../../constants/outcomePillarImages';

type OutcomePillarCardVisualProps = {
  basePath: string;
  width: number;
  height: number;
  alt: string;
};

export function OutcomePillarCardVisual({
  basePath,
  width,
  height,
  alt,
}: OutcomePillarCardVisualProps) {
  return (
    <div
      className={`relative w-full overflow-hidden border-b border-[#E5E7EB] bg-white ${OUTCOME_PILLAR_IMAGE_ASPECT}`}
    >
      <OptimizedPicture
        basePath={basePath}
        alt={alt}
        width={width}
        height={height}
        className="block h-full w-full"
        imgClassName="h-full w-full object-contain object-center"
      />
    </div>
  );
}
