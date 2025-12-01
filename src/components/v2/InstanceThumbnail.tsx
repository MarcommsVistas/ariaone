import { SlideThumbnail } from "@/components/shared/SlideThumbnail";

interface InstanceThumbnailProps {
  instanceId: string;
  size?: 'sm' | 'md' | 'lg';
  mode?: 'grid' | 'list';
}

export const InstanceThumbnail = ({ instanceId, size = 'md', mode = 'grid' }: InstanceThumbnailProps) => {
  return <SlideThumbnail instanceId={instanceId} size={size} mode={mode} />;
};
