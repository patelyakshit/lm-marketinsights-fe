import type { ImageBlockType } from "../../../../types/artifacts";
import { DUMMY_IMAGE_URL } from "../../../../constants/urlConts";

interface ImageBlockProps {
  block: ImageBlockType;
}

export const ImageBlock = ({ block }: ImageBlockProps) => {
  const imageUrl = block.payload.source.url.blob_url || DUMMY_IMAGE_URL;

  return (
    <div className="w-full h-full bg-transparent flex flex-col items-center justify-between gap-2">
      <img
        src={imageUrl}
        alt={block.payload.source.alt}
        className="w-full h-full text-charcoal-gray"
      />
    </div>
  );
};
