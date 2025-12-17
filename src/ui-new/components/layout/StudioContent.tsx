/**
 * StudioContent - Chrome-like tabbed interface for marketing posts, placestory, etc.
 */

import React, { useState, useCallback } from "react";
import { useMarketingStore } from "../../../store/useMarketingStore";

// Icons
const CloseIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CopyIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const DownloadIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
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

// Copy button component
const CopyButton: React.FC<{ text: string; label: string }> = ({ text, label }) => {
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
      className="flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors hover:bg-[#f3f2f2]"
      style={{ color: copied ? "#10B981" : "#545251" }}
      title={`Copy ${label}`}
    >
      {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
      <span>{copied ? "Copied!" : "Copy"}</span>
    </button>
  );
};

interface StudioContentProps {
  className?: string;
}

type ContentTab = "marketing" | "placestory";

const StudioContent: React.FC<StudioContentProps> = ({ className = "" }) => {
  const { posts, businessName, isGenerating, removePost } = useMarketingStore();
  const [activeTab, setActiveTab] = useState<ContentTab>("marketing");

  // Handle download
  const handleDownload = useCallback((imageUrl: string, platform: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `${platform}-post-${Date.now()}.png`;
    link.click();
  }, []);

  // Content tabs data
  const tabs: { id: ContentTab; label: string; count?: number }[] = [
    { id: "marketing", label: "Marketing Posts", count: posts.length },
    // Add more tabs here in future: PlaceStory, etc.
    // { id: "placestory", label: "PlaceStory", count: 0 },
  ];

  return (
    <div className={`flex flex-col h-full ${className}`} style={{ backgroundColor: "#fafafa" }}>
      {/* Chrome-like Tab Bar */}
      <div
        className="shrink-0 flex items-center gap-1 px-2 pt-2"
        style={{ backgroundColor: "#f3f2f2" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-t-lg text-sm transition-colors ${
              activeTab === tab.id
                ? "bg-white border-t border-l border-r border-[#e5e5e5]"
                : "bg-[#e8e7e6] hover:bg-[#dddcdb]"
            }`}
            style={{
              marginBottom: activeTab === tab.id ? "-1px" : "0",
              fontFamily: "Switzer, sans-serif",
              color: activeTab === tab.id ? "#1d1916" : "#545251",
            }}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className="px-1.5 py-0.5 text-xs rounded-full"
                style={{
                  backgroundColor: activeTab === tab.id ? "#ff7700" : "#a6a3a0",
                  color: "#ffffff",
                  fontSize: "10px",
                  lineHeight: "12px",
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div
        className="flex-1 overflow-auto"
        style={{
          backgroundColor: "#ffffff",
          borderTop: "1px solid #e5e5e5",
        }}
      >
        {activeTab === "marketing" && (
          <div className="p-4">
            {/* Header */}
            {businessName && (
              <div className="mb-4">
                <h2
                  className="text-lg font-medium"
                  style={{ color: "#1d1916", fontFamily: "Switzer, sans-serif" }}
                >
                  Marketing for {businessName}
                </h2>
              </div>
            )}

            {/* Loading State */}
            {isGenerating && posts.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-[#f3f2f2] animate-pulse">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#545251" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                  <p className="text-sm" style={{ color: "#545251" }}>Generating your marketing posts...</p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isGenerating && posts.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-[#f3f2f2]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#545251" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                  <p className="text-sm" style={{ color: "#545251" }}>No marketing posts yet</p>
                  <p className="text-xs mt-1" style={{ color: "#a6a3a0" }}>
                    Generate posts from a lifestyle analysis
                  </p>
                </div>
              </div>
            )}

            {/* Posts Grid */}
            {posts.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {posts.map((post) => {
                  const platformStyle = platformColors[post.platform.toLowerCase()] || {
                    bg: "#f3f2f2",
                    text: "#545251",
                  };

                  return (
                    <div
                      key={post.id}
                      className="rounded-lg overflow-hidden"
                      style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #eceae9",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      }}
                    >
                      {/* Post Header */}
                      <div
                        className="px-3 py-2 flex items-center justify-between"
                        style={{ borderBottom: "1px solid #eceae9" }}
                      >
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                          style={{ backgroundColor: platformStyle.bg, color: platformStyle.text }}
                        >
                          {post.platform}
                        </span>
                        <button
                          onClick={() => removePost(post.id)}
                          className="p-1 rounded hover:bg-[#f3f2f2] transition-colors"
                          style={{ color: "#a6a3a0" }}
                          title="Remove post"
                        >
                          <CloseIcon size={14} />
                        </button>
                      </div>

                      {/* Image */}
                      <div className="aspect-square bg-[#f8f7f7] relative overflow-hidden">
                        {post.isLoading ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="absolute inset-0 skeleton-shimmer" />
                            <div className="flex flex-col items-center gap-2 z-10">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#eceae9]">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#545251" strokeWidth="1.5">
                                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                  <circle cx="8.5" cy="8.5" r="1.5" />
                                  <polyline points="21 15 16 10 5 21" />
                                </svg>
                              </div>
                              <span className="text-xs" style={{ color: "#545251" }}>Generating image...</span>
                            </div>
                          </div>
                        ) : post.imageUrl ? (
                          <img
                            src={post.imageUrl}
                            alt={post.headline}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xs" style={{ color: "#a6a3a0" }}>No image</span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-3 space-y-3">
                        {/* Headline */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] uppercase tracking-wide" style={{ color: "#a6a3a0" }}>
                              Headline
                            </span>
                            <CopyButton text={post.headline} label="headline" />
                          </div>
                          <p className="text-sm font-medium" style={{ color: "#1d1916" }}>
                            {post.headline}
                          </p>
                        </div>

                        {/* Caption */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] uppercase tracking-wide" style={{ color: "#a6a3a0" }}>
                              Caption
                            </span>
                            <CopyButton text={post.caption} label="caption" />
                          </div>
                          <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "#545251" }}>
                            {post.caption}
                          </p>
                        </div>

                        {/* Hashtags */}
                        {post.hashtags && post.hashtags.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] uppercase tracking-wide" style={{ color: "#a6a3a0" }}>
                                Hashtags
                              </span>
                              <CopyButton text={post.hashtags.join(" ")} label="hashtags" />
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {post.hashtags.slice(0, 5).map((tag, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 rounded text-[10px]"
                                  style={{ backgroundColor: "#fff2eb", color: "#ff7700" }}
                                >
                                  {tag}
                                </span>
                              ))}
                              {post.hashtags.length > 5 && (
                                <span className="text-[10px]" style={{ color: "#a6a3a0" }}>
                                  +{post.hashtags.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        {post.imageUrl && !post.isLoading && (
                          <div className="pt-2" style={{ borderTop: "1px solid #eceae9" }}>
                            <button
                              onClick={() => handleDownload(post.imageUrl!, post.platform)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors hover:bg-[#fff2eb]"
                              style={{ color: "#ff7700" }}
                            >
                              <DownloadIcon size={14} />
                              <span>Download Image</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PlaceStory tab content - placeholder for future */}
        {activeTab === "placestory" && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-sm" style={{ color: "#545251" }}>PlaceStory coming soon...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudioContent;
