import { SlideThumbnail } from "@/components/shared/SlideThumbnail";

interface TemplateThumbnailProps {
  templateId: string;
  size?: 'sm' | 'md' | 'lg';
  mode?: 'grid' | 'list';
}

export const TemplateThumbnail = ({ templateId, size = 'md', mode = 'grid' }: TemplateThumbnailProps) => {
  return <SlideThumbnail templateId={templateId} size={size} mode={mode} />;
};
