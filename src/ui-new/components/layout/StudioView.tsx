/**
 * StudioView Component
 * Displays generated marketing posts with copy functionality
 */

import React, { useState, useCallback } from "react";
import { colors } from "../../design-system";
import { useViewMode } from "../../../contexts/ViewModeContext";
import { Button } from "../../../components/ui/button";

// Icons (using inline SVGs for simplicity)
const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const MapIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" />
    <line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Platform badge colors
const platformColors: Record<string, { bg: string; text: string }> = {
  instagram: { bg: "#E1306C20", text: "#E1306C" },
  facebook: { bg: "#1877F220", text: "#1877F2" },
  linkedin: { bg: "#0A66C220", text: "#0A66C2" },
  email: { bg: "#EA433520", text: "#EA4335" },
  twitter: { bg: "#1DA1F220", text: "#1DA1F2" },
};

export interface MarketingPost {
  id: string;
  platform: string;
  headline: string;
  caption: string;
  hashtags: string[];
  imageUrl?: string;
  businessName?: string;
  segmentName?: string;
  createdAt?: Date;
  isLoading?: boolean; // True when image is being generated
}

interface CopyButtonProps {
  text: string;
  label: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ text, label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors"
      style={{
        backgroundColor: copied ? "#10B98120" : colors.neutral[100],
        color: copied ? "#10B981" : colors.text.sub[600],
      }}
      title={`Copy ${label}`}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      <span>{copied ? "Copied!" : `Copy ${label}`}</span>
    </button>
  );
};

interface MarketingPostCardProps {
  post: MarketingPost;
  onRegenerate?: (id: string) => void;
  onDownload?: (id: string) => void;
}

const MarketingPostCard: React.FC<MarketingPostCardProps> = ({
  post,
  onRegenerate,
  onDownload,
}) => {
  const platformStyle = platformColors[post.platform.toLowerCase()] || {
    bg: colors.neutral[100],
    text: colors.text.sub[600],
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: colors.static.white,
        border: `1px solid ${colors.stroke.soft[200]}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      {/* Platform Badge */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${colors.stroke.soft[200]}` }}
      >
        <span
          className="px-3 py-1 rounded-full text-xs font-medium capitalize"
          style={{ backgroundColor: platformStyle.bg, color: platformStyle.text }}
        >
          {post.platform}
        </span>
        {post.segmentName && (
          <span
            className="text-xs"
            style={{ color: colors.text.soft[400] }}
          >
            Segment: {post.segmentName}
          </span>
        )}
      </div>

      {/* Image Preview or Skeleton Loader */}
      {(post.imageUrl || post.isLoading) && (
        <div className="relative w-full aspect-square bg-neutral-100 overflow-hidden">
          {post.isLoading ? (
            // Skeleton loader with animated shimmer
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.neutral[100] }}>
              <div className="absolute inset-0 skeleton-shimmer" />
              <div className="flex flex-col items-center gap-3 z-10">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.neutral[200] }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.text.soft[400]} strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <span className="text-sm font-medium" style={{ color: colors.text.sub[500] }}>
                  Generating image...
                </span>
              </div>
            </div>
          ) : (
            <img
              src={post.imageUrl}
              alt={post.headline}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Headline */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span
              className="text-xs font-medium uppercase tracking-wide"
              style={{ color: colors.text.soft[400] }}
            >
              Headline
            </span>
            <CopyButton text={post.headline} label="Headline" />
          </div>
          <p
            className="text-base font-semibold"
            style={{ color: colors.text.strong[900] }}
          >
            {post.headline}
          </p>
        </div>

        {/* Caption */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span
              className="text-xs font-medium uppercase tracking-wide"
              style={{ color: colors.text.soft[400] }}
            >
              Caption
            </span>
            <CopyButton text={post.caption} label="Caption" />
          </div>
          <p
            className="text-sm leading-relaxed"
            style={{ color: colors.text.sub[600] }}
          >
            {post.caption}
          </p>
        </div>

        {/* Hashtags */}
        {post.hashtags.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-xs font-medium uppercase tracking-wide"
                style={{ color: colors.text.soft[400] }}
              >
                Hashtags
              </span>
              <CopyButton text={post.hashtags.join(" ")} label="All" />
            </div>
            <div className="flex flex-wrap gap-2">
              {post.hashtags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: colors.primary[50],
                    color: colors.primary[700],
                  }}
                  onClick={() => navigator.clipboard.writeText(tag)}
                  title="Click to copy"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div
          className="flex gap-2 pt-3"
          style={{ borderTop: `1px solid ${colors.stroke.soft[200]}` }}
        >
          {onRegenerate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRegenerate(post.id)}
              className="flex-1 flex items-center justify-center gap-1"
            >
              <RefreshIcon />
              <span>Regenerate</span>
            </Button>
          )}
          {onDownload && post.imageUrl && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onDownload(post.id)}
              className="flex-1 flex items-center justify-center gap-1"
              style={{
                backgroundColor: colors.primary[500],
                color: colors.static.white,
              }}
            >
              <DownloadIcon />
              <span>Download</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export interface StudioViewProps {
  posts?: MarketingPost[];
  businessName?: string;
  onRegenerate?: (postId: string) => void;
  onDownload?: (postId: string) => void;
  className?: string;
}

const StudioView: React.FC<StudioViewProps> = ({
  posts = [],
  businessName,
  onRegenerate,
  onDownload,
  className = "",
}) => {
  const { setViewMode } = useViewMode();

  const handleBackToMap = useCallback(() => {
    setViewMode("split");
  }, [setViewMode]);

  const handleClose = useCallback(() => {
    setViewMode("chat");
  }, [setViewMode]);

  // Empty state
  if (posts.length === 0) {
    return (
      <div
        className={`flex flex-col h-full ${className}`}
        style={{ backgroundColor: colors.bg.weaker[25] }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            borderBottom: `1px solid ${colors.stroke.soft[200]}`,
            backgroundColor: colors.static.white,
          }}
        >
          <div className="flex items-center gap-3">
            <h1
              className="text-lg font-semibold"
              style={{ color: colors.text.strong[900] }}
            >
              Studio
            </h1>
            {businessName && (
              <span
                className="text-sm"
                style={{ color: colors.text.sub[500] }}
              >
                for {businessName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToMap}
              className="flex items-center gap-1"
            >
              <MapIcon />
              <span>Back to Map</span>
            </Button>
            <button
              onClick={handleClose}
              className="p-1 rounded hover:bg-neutral-100 transition-colors"
              style={{ color: colors.text.sub[500] }}
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: colors.neutral[100] }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke={colors.text.soft[400]}
                strokeWidth="1.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <h3
              className="text-lg font-medium mb-2"
              style={{ color: colors.text.strong[900] }}
            >
              No Marketing Posts Yet
            </h3>
            <p
              className="text-sm max-w-sm mx-auto"
              style={{ color: colors.text.sub[500] }}
            >
              Generate marketing posts from your lifestyle analysis to see them here.
              Ask the AI to "create a marketing post" after analyzing an area.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-full ${className}`}
      style={{ backgroundColor: colors.bg.weaker[25] }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{
          borderBottom: `1px solid ${colors.stroke.soft[200]}`,
          backgroundColor: colors.static.white,
        }}
      >
        <div className="flex items-center gap-3">
          <h1
            className="text-lg font-semibold"
            style={{ color: colors.text.strong[900] }}
          >
            Studio
          </h1>
          {businessName && (
            <span
              className="text-sm"
              style={{ color: colors.text.sub[500] }}
            >
              for {businessName}
            </span>
          )}
          <span
            className="px-2 py-0.5 rounded-full text-xs"
            style={{
              backgroundColor: colors.primary[50],
              color: colors.primary[700],
            }}
          >
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToMap}
            className="flex items-center gap-1"
          >
            <MapIcon />
            <span>Back to Map</span>
          </Button>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-neutral-100 transition-colors"
            style={{ color: colors.text.sub[500] }}
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {posts.map((post) => (
            <MarketingPostCard
              key={post.id}
              post={post}
              onRegenerate={onRegenerate}
              onDownload={onDownload}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudioView;
