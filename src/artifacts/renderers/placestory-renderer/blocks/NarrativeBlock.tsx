import type { NarrativeBlockType } from "../../../../types/artifacts";
import { ImageBlock } from "./ImageBlock";
import { MapBlock } from "./MapBlock";
import { TextBlock } from "./TextBlock";

interface NarrativeBlockProps {
  block: NarrativeBlockType;
}

export const NarrativeBlock = ({ block }: NarrativeBlockProps) => {
  return (
    <div className="w-full">
      <div className="w-full flex gap-4">
        {block.payload.narrative_blocks.map((nestedBlock) => (
          <div key={nestedBlock.id} className="w-full">
            {nestedBlock.type === "text" && <TextBlock block={nestedBlock} />}
            {nestedBlock.type === "image" && <ImageBlock block={nestedBlock} />}
            {nestedBlock.type === "map" && <MapBlock block={nestedBlock} />}
          </div>
        ))}
      </div>
    </div>
  );
};
