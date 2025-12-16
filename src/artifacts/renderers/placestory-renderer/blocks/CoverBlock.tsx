import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { DUMMY_IMAGE_URL } from "../../../../constants/urlConts";
import type { CoverBlockType } from "../../../../types/artifacts";

interface CoverBlockProps {
  block: CoverBlockType;
}

const dummyTextBlock = {
  id: "text_block_01",
  type: "text" as const,
  payload: {
    content: "# Title Missing\n\nDescription missing.",
  },
};

const dummyImageBlock = {
  id: "image_block_01",
  type: "image" as const,
  payload: {
    source: {
      url: {
        blob_url:
          "https://static.vecteezy.com/system/resources/previews/053/733/179/non_2x/every-detail-of-a-sleek-modern-car-captured-in-close-up-photo.jpg",
        container: "interactive-presentation-images-dev",
        filename:
          "every-detail-of-a-sleek-modern-car-captured-in-close-up-photo.jpg",
        sas_expires_at: "2025-11-20T15:10:03.008755Z",
        sas_url:
          "https://storymaps.blob.core.windows.net/interactive-presentation-images-dev/every-detail-of-a-sleek-modern-car-captured-in-close-up-photo.jpg?se=2025-11-20T15%3A10%3A03Z&sp=r&sv=2025-07-05&sr=b&sig=UJRztj7UZJu4MjLjIsPpSyHGV/aVRl0Y6p57e2xZhiE%3D",
        storage_type: "azure_blob",
        success: true,
      },
      alt: "Placeholder",
    },
  },
};

export const CoverBlock = ({ block }: CoverBlockProps) => {
  const imageBlock =
    block.payload.cover_blocks.find((b) => b.type === "image") ||
    dummyImageBlock;
  const textBlock =
    block.payload.cover_blocks.find((b) => b.type === "text") || dummyTextBlock;

  const imageUrl = imageBlock.payload.source.url.blob_url || DUMMY_IMAGE_URL;

  const { cleanContent, metadata } = useMemo(() => {
    const rawContent = textBlock.payload.content;
    let location = "";
    let date = "";

    const locationMatch = rawContent.match(
      /(?:\*\*|__)?Location:(?:\*\*|__)?\s*(.*)/i,
    );
    const dateMatch = rawContent.match(/(?:\*\*|__)?Date:(?:\*\*|__)?\s*(.*)/i);

    if (locationMatch) location = locationMatch[1].trim();
    if (dateMatch) date = dateMatch[1].trim();

    const lines = rawContent.split("\n");
    const filteredLines = lines.filter(
      (line) =>
        !line.toLowerCase().includes("location:") &&
        !line.toLowerCase().includes("date:"),
    );

    return {
      cleanContent: filteredLines.join("\n"),
      metadata: { location, date },
    };
  }, [textBlock.payload.content]);

  return (
    <div className="relative w-full min-h-[600px] h-[85vh] overflow-hidden rounded-none shadow-sm group">
      <div className="absolute inset-0">
        <img
          src={imageUrl}
          alt={imageBlock.payload.source.alt}
          className="w-full h-full object-cover transition-transform duration-[2s] ease-out group-hover:scale-105"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20"></div>

      <div className="absolute inset-0 flex flex-col items-center justify-end pb-20 px-8 md:px-16 text-center z-10">
        <div className="max-w-5xl w-full animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-6 drop-shadow-xl leading-[1.1]">
                  {children}
                </h1>
              ),
              p: ({ children }) => (
                <p className="text-lg md:text-2xl text-gray-200 leading-relaxed font-light max-w-3xl mx-auto mb-12 drop-shadow-md">
                  {children}
                </p>
              ),
              strong: ({ children }) => (
                <span className="font-bold text-white">{children}</span>
              ),
            }}
          >
            {cleanContent}
          </ReactMarkdown>

          {(metadata.location || metadata.date) && (
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 text-xs md:text-sm font-medium tracking-widest uppercase text-white/80 font-mono border-t border-white/20 pt-8 mt-2">
              {metadata.location && <span>{metadata.location}</span>}

              {metadata.location && metadata.date && (
                <span className="hidden md:inline-block w-px h-4 bg-white/40"></span>
              )}

              {metadata.date && <span>{metadata.date}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
