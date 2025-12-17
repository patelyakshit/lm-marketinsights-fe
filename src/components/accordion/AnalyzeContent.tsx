/**
 * AnalyzeContent Component
 * Displays lifestyle/tapestry analysis in the Tools & Insights sidebar
 */

import React, { useState, useCallback, useMemo } from "react";
import { useLifestyleStore } from "../../store/useLifestyleStore";
import { LifestyleSegment } from "../../types/operations";

// Icons
const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const CopyIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ClockIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const RadiusIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// Mini Donut Chart Component for sidebar
const MiniDonutChart: React.FC<{
  segments: LifestyleSegment[];
  size?: number;
}> = ({ segments, size = 120 }) => {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const segmentArcs = useMemo(() => {
    let cumulative = 0;
    return segments.map((segment) => {
      const start = cumulative;
      cumulative += segment.percentage;
      return {
        segment,
        startPercent: start,
        dashArray: (segment.percentage / 100) * circumference,
        dashOffset: circumference - (start / 100) * circumference,
      };
    });
  }, [segments, circumference]);

  const totalPercentage = segments.reduce((acc, s) => acc + s.percentage, 0);
  const otherPercentage = Math.max(0, 100 - totalPercentage);

  return (
    <div className="flex items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#eceae9"
            strokeWidth={strokeWidth}
          />

          {/* Segment arcs */}
          {segmentArcs.map(({ segment, dashArray, dashOffset }) => (
            <circle
              key={segment.code}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={hoveredSegment === segment.code ? strokeWidth + 3 : strokeWidth}
              strokeDasharray={`${dashArray} ${circumference}`}
              strokeDashoffset={dashOffset}
              className="transition-all duration-200 cursor-pointer"
              style={{
                opacity: hoveredSegment && hoveredSegment !== segment.code ? 0.4 : 1,
              }}
              onMouseEnter={() => setHoveredSegment(segment.code)}
              onMouseLeave={() => setHoveredSegment(null)}
            />
          ))}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {hoveredSegment ? (
            <>
              <span className="text-lg font-bold" style={{ color: "#1d1916" }}>
                {segments.find(s => s.code === hoveredSegment)?.percentage.toFixed(1)}%
              </span>
              <span className="text-[8px] text-center px-1 leading-tight" style={{ color: "#545251" }}>
                {segments.find(s => s.code === hoveredSegment)?.name?.slice(0, 12)}
              </span>
            </>
          ) : (
            <>
              <span className="text-lg font-bold" style={{ color: "#1d1916" }}>
                {segments.length}
              </span>
              <span className="text-[8px]" style={{ color: "#a6a3a0" }}>
                Segments
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend - compact vertical list */}
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        {segments.slice(0, 5).map((segment) => (
          <div
            key={segment.code}
            className="flex items-center gap-1.5 cursor-pointer transition-opacity"
            style={{ opacity: hoveredSegment && hoveredSegment !== segment.code ? 0.4 : 1 }}
            onMouseEnter={() => setHoveredSegment(segment.code)}
            onMouseLeave={() => setHoveredSegment(null)}
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-[9px] truncate flex-1" style={{ color: "#545251" }}>
              {segment.name}
            </span>
            <span className="text-[9px] font-medium flex-shrink-0" style={{ color: segment.color }}>
              {segment.percentage.toFixed(0)}%
            </span>
          </div>
        ))}
        {otherPercentage > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: "#eceae9" }} />
            <span className="text-[9px]" style={{ color: "#a6a3a0" }}>Other</span>
            <span className="text-[9px]" style={{ color: "#a6a3a0" }}>{otherPercentage.toFixed(0)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Trade Area Badge
const TradeAreaBadge: React.FC<{
  bufferMiles?: number;
  driveTimeMinutes?: number;
}> = ({ bufferMiles, driveTimeMinutes }) => {
  if (driveTimeMinutes) {
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium"
        style={{ backgroundColor: "#fff7f3", color: "#ff7700" }}
      >
        <ClockIcon />
        {driveTimeMinutes} min
      </span>
    );
  }

  if (bufferMiles) {
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium"
        style={{ backgroundColor: "#EBF5FF", color: "#1D4ED8" }}
      >
        <RadiusIcon />
        {bufferMiles} mi
      </span>
    );
  }

  return null;
};

// Format utilities
const formatCurrency = (num: number | undefined) => {
  if (num === undefined || num === null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(num);
};

const formatPercent = (num: number | undefined) => {
  if (num === undefined || num === null) return "N/A";
  return `${(num * 100).toFixed(0)}%`;
};

// Copy button
const CopyButton: React.FC<{ text: string }> = ({ text }) => {
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
      className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded transition-colors"
      style={{
        backgroundColor: copied ? "#10B98120" : "#f3f2f2",
        color: copied ? "#10B981" : "#545251",
      }}
      title="Copy to clipboard"
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
};

// Compact segment card
const SegmentCard: React.FC<{
  segment: LifestyleSegment;
  maxPercentage: number;
  rank: number;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ segment, maxPercentage, rank, isExpanded, onToggle }) => {
  const barWidth = (segment.percentage / maxPercentage) * 100;

  return (
    <div
      className="rounded-md overflow-hidden transition-all duration-200"
      style={{
        backgroundColor: "#fff",
        border: `1px solid ${isExpanded ? segment.color : "#eceae9"}`,
      }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full text-left p-2 hover:bg-[#f8f7f7] transition-colors"
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
              style={{ backgroundColor: segment.color }}
            >
              {rank}
            </span>
            <span className="text-xs font-medium truncate" style={{ color: "#1d1916" }}>
              {segment.name}
            </span>
            <span className="text-[10px] flex-shrink-0" style={{ color: "#a6a3a0" }}>
              ({segment.code})
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-xs font-semibold" style={{ color: segment.color }}>
              {segment.percentage.toFixed(1)}%
            </span>
            {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </div>
        </div>

        {/* Progress Bar */}
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: `${segment.color}15` }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${barWidth}%`,
              backgroundColor: segment.color,
            }}
          />
        </div>

        <div className="flex justify-between mt-1">
          <span className="text-[10px]" style={{ color: "#a6a3a0" }}>
            {segment.lifemodeGroup || "—"}
          </span>
          <span className="text-[10px]" style={{ color: "#545251" }}>
            {segment.householdCount?.toLocaleString() || 0} HH
          </span>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-2 pb-2 space-y-2" style={{ borderTop: "1px solid #eceae9" }}>
          {/* Demographics Grid */}
          <div className="grid grid-cols-2 gap-1.5 pt-2">
            <div
              className="p-1.5 rounded text-center"
              style={{ backgroundColor: `${segment.color}10` }}
            >
              <div className="text-[9px] uppercase tracking-wide" style={{ color: "#a6a3a0" }}>
                Age
              </div>
              <div className="text-xs font-semibold" style={{ color: segment.color }}>
                {segment.medianAge?.toFixed(0) || "N/A"}
              </div>
            </div>
            <div
              className="p-1.5 rounded text-center"
              style={{ backgroundColor: `${segment.color}10` }}
            >
              <div className="text-[9px] uppercase tracking-wide" style={{ color: "#a6a3a0" }}>
                Income
              </div>
              <div className="text-xs font-semibold" style={{ color: segment.color }}>
                {formatCurrency(segment.medianIncome)}
              </div>
            </div>
            <div
              className="p-1.5 rounded text-center"
              style={{ backgroundColor: `${segment.color}10` }}
            >
              <div className="text-[9px] uppercase tracking-wide" style={{ color: "#a6a3a0" }}>
                Net Worth
              </div>
              <div className="text-xs font-semibold" style={{ color: segment.color }}>
                {formatCurrency(segment.medianNetWorth)}
              </div>
            </div>
            <div
              className="p-1.5 rounded text-center"
              style={{ backgroundColor: `${segment.color}10` }}
            >
              <div className="text-[9px] uppercase tracking-wide" style={{ color: "#a6a3a0" }}>
                Homeowners
              </div>
              <div className="text-xs font-semibold" style={{ color: segment.color }}>
                {formatPercent(segment.homeownershipRate)}
              </div>
            </div>
          </div>

          {/* Description */}
          {segment.description && (
            <div>
              <p className="text-[11px] leading-relaxed" style={{ color: "#545251" }}>
                {segment.description.slice(0, 150)}
                {segment.description.length > 150 ? "..." : ""}
              </p>
            </div>
          )}

          {/* Characteristics */}
          {segment.characteristics && segment.characteristics.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {segment.characteristics.slice(0, 3).map((char, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 rounded text-[10px]"
                  style={{
                    backgroundColor: `${segment.color}15`,
                    color: segment.color,
                  }}
                >
                  {char}
                </span>
              ))}
            </div>
          )}

          {/* AI Insight */}
          {segment.insight && (
            <div className="p-2 rounded" style={{ backgroundColor: "#fff7f3" }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-medium uppercase" style={{ color: "#ff7700" }}>
                  💡 Insight
                </span>
                <CopyButton text={segment.insight} />
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: "#c25400" }}>
                {segment.insight}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AnalyzeContent = () => {
  const { currentReport, isLoading } = useLifestyleStore();
  const [expandedSegments, setExpandedSegments] = useState<Set<string>>(new Set(["0"]));

  const toggleSegment = useCallback((index: string) => {
    setExpandedSegments((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full p-3">
        <div className="flex items-center justify-center gap-2 py-8">
          <div className="w-4 h-4 border-2 border-[#ff7700] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm" style={{ color: "#545251" }}>
            Analyzing lifestyles...
          </span>
        </div>
      </div>
    );
  }

  // Empty state
  if (!currentReport) {
    return (
      <div className="w-full p-3">
        <div className="text-center py-6">
          <div
            className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
            style={{ backgroundColor: "#f3f2f2" }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#a6a3a0"
              strokeWidth="1.5"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="text-sm font-medium mb-1" style={{ color: "#1d1916" }}>
            No Analysis Yet
          </div>
          <p className="text-xs px-2" style={{ color: "#a6a3a0" }}>
            Ask about lifestyles near an address.
            <br />
            Try: "What are the lifestyles near 1101 Coit Rd, Plano?"
          </p>
        </div>
      </div>
    );
  }

  const maxPercentage = Math.max(...currentReport.segments.map((s) => s.percentage));

  return (
    <div className="w-full p-2 space-y-2">
      {/* Location Header with Badge */}
      <div
        className="p-2 rounded-md"
        style={{ backgroundColor: "#f8f7f7", border: "1px solid #eceae9" }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="text-xs font-medium truncate" style={{ color: "#1d1916" }}>
                {currentReport.address}
              </div>
              <TradeAreaBadge
                bufferMiles={currentReport.bufferMiles}
                driveTimeMinutes={currentReport.driveTimeMinutes}
              />
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: "#a6a3a0" }}>
              {currentReport.totalHouseholds?.toLocaleString() || 0} households • {currentReport.segments.length} segments
            </div>
          </div>
          <CopyButton
            text={`Lifestyle Analysis for ${currentReport.address}\n\nTop Segments:\n${currentReport.segments
              .map((s, i) => `${i + 1}. ${s.name} (${s.code}): ${s.percentage.toFixed(1)}%`)
              .join("\n")}`}
          />
        </div>
      </div>

      {/* Segment Distribution Chart */}
      <div
        className="p-2 rounded-md"
        style={{ backgroundColor: "#fff", border: "1px solid #eceae9" }}
      >
        <div className="text-[9px] font-medium uppercase tracking-wide mb-2" style={{ color: "#a6a3a0" }}>
          Segment Distribution
        </div>
        <MiniDonutChart segments={currentReport.segments} size={100} />
      </div>

      {/* Segments */}
      <div className="space-y-1.5">
        {currentReport.segments.map((segment, index) => (
          <SegmentCard
            key={segment.code}
            segment={segment}
            maxPercentage={maxPercentage}
            rank={index + 1}
            isExpanded={expandedSegments.has(String(index))}
            onToggle={() => toggleSegment(String(index))}
          />
        ))}
      </div>

      {/* Business Insights */}
      {currentReport.businessInsight && (
        <div
          className="p-2 rounded-md"
          style={{ backgroundColor: "#fff7f3", border: "1px solid #ffe5d6" }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-medium uppercase" style={{ color: "#ff7700" }}>
              🎯 Strategy Recommendations
            </span>
            <CopyButton text={currentReport.businessInsight} />
          </div>
          <p
            className="text-[11px] leading-relaxed"
            style={{ color: "#c25400" }}
            dangerouslySetInnerHTML={{ __html: currentReport.businessInsight }}
          />
        </div>
      )}

    </div>
  );
};

export default AnalyzeContent;
