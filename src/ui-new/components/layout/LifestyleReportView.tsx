/**
 * LifestyleReportView Component
 * Displays comprehensive tapestry/lifestyle analysis with:
 * - Address header with drive time/distance badge
 * - Interactive donut chart showing all segments
 * - Top 5 segments with horizontal bar chart
 * - Segment cards with demographics and AI insights
 * - Overall business recommendations
 */

import React, { useState, useCallback, useMemo } from "react";
import { colors } from "../../design-system";
import { useLifestyleStore } from "../../../store/useLifestyleStore";
import { useViewMode } from "../../../contexts/ViewModeContext";
import { Button } from "../../../components/ui/button";
import { LifestyleSegment } from "../../../types/operations";

// Icons
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const MapIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" />
    <line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const RadiusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="3" />
    <line x1="12" y1="2" x2="12" y2="5" />
  </svg>
);

const LocationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

// Donut Chart Component
interface DonutChartProps {
  segments: LifestyleSegment[];
  size?: number;
  strokeWidth?: number;
}

const DonutChart: React.FC<DonutChartProps> = ({ segments, size = 200, strokeWidth = 35 }) => {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Calculate cumulative percentages for positioning
  const segmentArcs = useMemo(() => {
    let cumulative = 0;
    return segments.map((segment) => {
      const start = cumulative;
      cumulative += segment.percentage;
      return {
        segment,
        startPercent: start,
        endPercent: cumulative,
        dashArray: (segment.percentage / 100) * circumference,
        dashOffset: circumference - (start / 100) * circumference,
      };
    });
  }, [segments, circumference]);

  const totalPercentage = segments.reduce((acc, s) => acc + s.percentage, 0);
  const otherPercentage = Math.max(0, 100 - totalPercentage);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle (Other segments) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={colors.neutral[200]}
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
              strokeWidth={hoveredSegment === segment.code ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={`${dashArray} ${circumference}`}
              strokeDashoffset={dashOffset}
              className="transition-all duration-200 cursor-pointer"
              style={{
                opacity: hoveredSegment && hoveredSegment !== segment.code ? 0.5 : 1,
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
              <span className="text-2xl font-bold" style={{ color: colors.text.strong[900] }}>
                {segments.find(s => s.code === hoveredSegment)?.percentage.toFixed(1)}%
              </span>
              <span className="text-xs text-center px-2" style={{ color: colors.text.sub[600] }}>
                {segments.find(s => s.code === hoveredSegment)?.name}
              </span>
            </>
          ) : (
            <>
              <span className="text-2xl font-bold" style={{ color: colors.text.strong[900] }}>
                {segments.length}
              </span>
              <span className="text-xs" style={{ color: colors.text.sub[600] }}>
                Segments
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full max-w-xs">
        {segments.slice(0, 6).map((segment) => (
          <div
            key={segment.code}
            className="flex items-center gap-2 cursor-pointer transition-opacity"
            style={{ opacity: hoveredSegment && hoveredSegment !== segment.code ? 0.5 : 1 }}
            onMouseEnter={() => setHoveredSegment(segment.code)}
            onMouseLeave={() => setHoveredSegment(null)}
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-xs truncate" style={{ color: colors.text.sub[600] }}>
              {segment.name}
            </span>
          </div>
        ))}
        {otherPercentage > 0 && (
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: colors.neutral[200] }}
            />
            <span className="text-xs" style={{ color: colors.text.soft[400] }}>
              Other ({otherPercentage.toFixed(1)}%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Trade Area Badge Component
const TradeAreaBadge: React.FC<{
  bufferMiles?: number;
  driveTimeMinutes?: number;
}> = ({ bufferMiles, driveTimeMinutes }) => {
  if (driveTimeMinutes) {
    return (
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
        style={{
          backgroundColor: colors.primary[50],
          border: `1px solid ${colors.primary[200]}`,
        }}
      >
        <ClockIcon />
        <span className="text-sm font-medium" style={{ color: colors.primary[700] }}>
          {driveTimeMinutes} min drive
        </span>
      </div>
    );
  }

  if (bufferMiles) {
    return (
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
        style={{
          backgroundColor: "#EBF5FF",
          border: "1px solid #93C5FD",
        }}
      >
        <RadiusIcon />
        <span className="text-sm font-medium" style={{ color: "#1D4ED8" }}>
          {bufferMiles} mile{bufferMiles !== 1 ? 's' : ''} radius
        </span>
      </div>
    );
  }

  return null;
};

// Utility to format numbers
const formatNumber = (num: number | undefined, prefix = "", suffix = "") => {
  if (num === undefined || num === null) return "N/A";
  return `${prefix}${num.toLocaleString()}${suffix}`;
};

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
      className="flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors"
      style={{
        backgroundColor: copied ? "#10B98120" : colors.neutral[100],
        color: copied ? "#10B981" : colors.text.sub[600],
      }}
      title={`Copy ${label}`}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      <span>{copied ? "Copied!" : label}</span>
    </button>
  );
};

// Segment bar chart item
const SegmentBar: React.FC<{
  segment: LifestyleSegment;
  maxPercentage: number;
  rank: number;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ segment, maxPercentage, rank, isExpanded, onToggle }) => {
  const barWidth = (segment.percentage / maxPercentage) * 100;

  return (
    <div
      className="rounded-lg overflow-hidden transition-all duration-200"
      style={{
        backgroundColor: colors.static.white,
        border: `1px solid ${isExpanded ? segment.color : colors.stroke.soft[200]}`,
      }}
    >
      {/* Bar Header - Always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left p-3 hover:bg-neutral-50 transition-colors"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: segment.color }}
            >
              {rank}
            </span>
            <span className="font-medium" style={{ color: colors.text.strong[900] }}>
              {segment.name}
            </span>
            <span className="text-xs" style={{ color: colors.text.soft[400] }}>
              ({segment.code})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold" style={{ color: segment.color }}>
              {segment.percentage.toFixed(1)}%
            </span>
            {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </div>
        </div>

        {/* Progress Bar */}
        <div
          className="h-3 rounded-full overflow-hidden"
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
          <span className="text-xs" style={{ color: colors.text.soft[400] }}>
            {segment.lifemodeGroup}
          </span>
          <span className="text-xs" style={{ color: colors.text.sub[600] }}>
            {formatNumber(segment.householdCount)} households
          </span>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div
          className="px-4 pb-4 space-y-4"
          style={{ borderTop: `1px solid ${colors.stroke.soft[200]}` }}
        >
          {/* Demographics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
            <div
              className="p-3 rounded-lg text-center"
              style={{ backgroundColor: `${segment.color}10` }}
            >
              <div className="text-xs uppercase tracking-wide mb-1" style={{ color: colors.text.soft[400] }}>
                Median Age
              </div>
              <div className="text-lg font-semibold" style={{ color: segment.color }}>
                {segment.medianAge?.toFixed(0) || "N/A"}
              </div>
            </div>
            <div
              className="p-3 rounded-lg text-center"
              style={{ backgroundColor: `${segment.color}10` }}
            >
              <div className="text-xs uppercase tracking-wide mb-1" style={{ color: colors.text.soft[400] }}>
                Median Income
              </div>
              <div className="text-lg font-semibold" style={{ color: segment.color }}>
                {formatCurrency(segment.medianIncome)}
              </div>
            </div>
            <div
              className="p-3 rounded-lg text-center"
              style={{ backgroundColor: `${segment.color}10` }}
            >
              <div className="text-xs uppercase tracking-wide mb-1" style={{ color: colors.text.soft[400] }}>
                Net Worth
              </div>
              <div className="text-lg font-semibold" style={{ color: segment.color }}>
                {formatCurrency(segment.medianNetWorth)}
              </div>
            </div>
            <div
              className="p-3 rounded-lg text-center"
              style={{ backgroundColor: `${segment.color}10` }}
            >
              <div className="text-xs uppercase tracking-wide mb-1" style={{ color: colors.text.soft[400] }}>
                Homeowners
              </div>
              <div className="text-lg font-semibold" style={{ color: segment.color }}>
                {formatPercent(segment.homeownershipRate)}
              </div>
            </div>
          </div>

          {/* Description */}
          {segment.description && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium uppercase tracking-wide" style={{ color: colors.text.soft[400] }}>
                  Profile Description
                </span>
                <CopyButton text={segment.description} label="Copy" />
              </div>
              <p className="text-sm leading-relaxed" style={{ color: colors.text.sub[600] }}>
                {segment.description}
              </p>
            </div>
          )}

          {/* Characteristics */}
          {segment.characteristics && segment.characteristics.length > 0 && (
            <div>
              <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: colors.text.soft[400] }}>
                Key Characteristics
              </div>
              <div className="flex flex-wrap gap-2">
                {segment.characteristics.map((char, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded text-xs"
                    style={{
                      backgroundColor: `${segment.color}15`,
                      color: segment.color,
                    }}
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Insight */}
          {segment.insight && (
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: colors.primary[50] }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium uppercase tracking-wide" style={{ color: colors.primary[700] }}>
                  Marketing Insight
                </span>
                <CopyButton text={segment.insight} label="Copy" />
              </div>
              <p className="text-sm leading-relaxed" style={{ color: colors.primary[900] }}>
                {segment.insight}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export interface LifestyleReportViewProps {
  className?: string;
}

const LifestyleReportView: React.FC<LifestyleReportViewProps> = ({ className = "" }) => {
  const { currentReport, closeReport } = useLifestyleStore();
  const { setViewMode } = useViewMode();
  const [expandedSegments, setExpandedSegments] = useState<Set<string>>(new Set(["0"])); // First expanded by default

  const handleBackToMap = useCallback(() => {
    setViewMode("split");
  }, [setViewMode]);

  const handleClose = useCallback(() => {
    closeReport();
    setViewMode("split");
  }, [closeReport, setViewMode]);

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

  // Empty state
  if (!currentReport) {
    return (
      <div
        className={`flex flex-col h-full ${className}`}
        style={{ backgroundColor: colors.bg.weaker[25] }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            borderBottom: `1px solid ${colors.stroke.soft[200]}`,
            backgroundColor: colors.static.white,
          }}
        >
          <h1 className="text-lg font-semibold" style={{ color: colors.text.strong[900] }}>
            Lifestyle Analysis
          </h1>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-neutral-100 transition-colors"
            style={{ color: colors.text.sub[500] }}
          >
            <CloseIcon />
          </button>
        </div>

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
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.strong[900] }}>
              No Lifestyle Analysis Yet
            </h3>
            <p className="text-sm max-w-sm mx-auto" style={{ color: colors.text.sub[500] }}>
              Ask the AI to analyze the lifestyle segments for a location.
              Try: "What are the lifestyles near 1101 Coit Rd, Plano?"
            </p>
          </div>
        </div>
      </div>
    );
  }

  const maxPercentage = Math.max(...currentReport.segments.map((s) => s.percentage));

  return (
    <div
      className={`flex flex-col h-full ${className}`}
      style={{ backgroundColor: colors.bg.weaker[25] }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{
          borderBottom: `1px solid ${colors.stroke.soft[200]}`,
          backgroundColor: colors.static.white,
        }}
      >
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold" style={{ color: colors.text.strong[900] }}>
            Lifestyle Analysis
          </h1>
          <span
            className="px-2 py-0.5 rounded-full text-xs"
            style={{
              backgroundColor: colors.primary[50],
              color: colors.primary[700],
            }}
          >
            {currentReport.segments.length} segments
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

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Location Summary Header */}
          <div
            className="p-5 rounded-xl"
            style={{
              backgroundColor: colors.static.white,
              border: `1px solid ${colors.stroke.soft[200]}`,
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className="p-2 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: colors.primary[50] }}
                >
                  <LocationIcon />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-1" style={{ color: colors.text.strong[900] }}>
                    {currentReport.address}
                  </h2>
                  <p className="text-sm" style={{ color: colors.text.sub[500] }}>
                    {formatNumber(currentReport.totalHouseholds)} total households in analysis area
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <TradeAreaBadge
                  bufferMiles={currentReport.bufferMiles}
                  driveTimeMinutes={currentReport.driveTimeMinutes}
                />
                <CopyButton
                  text={`Lifestyle Analysis for ${currentReport.address}\n\nTop Segments:\n${currentReport.segments
                    .map((s, i) => `${i + 1}. ${s.name} (${s.code}): ${s.percentage.toFixed(1)}%`)
                    .join("\n")}`}
                  label="Copy"
                />
              </div>
            </div>
          </div>

          {/* Segment Distribution Chart */}
          <div
            className="p-5 rounded-xl"
            style={{
              backgroundColor: colors.static.white,
              border: `1px solid ${colors.stroke.soft[200]}`,
            }}
          >
            <h3
              className="text-sm font-medium uppercase tracking-wide mb-4 text-center"
              style={{ color: colors.text.soft[400] }}
            >
              Segment Distribution
            </h3>
            <DonutChart segments={currentReport.segments} size={220} strokeWidth={40} />
          </div>

          {/* Segments Chart */}
          <div>
            <h3
              className="text-sm font-medium uppercase tracking-wide mb-3"
              style={{ color: colors.text.soft[400] }}
            >
              Top Lifestyle Segments
            </h3>
            <div className="space-y-3">
              {currentReport.segments.map((segment, index) => (
                <SegmentBar
                  key={segment.code}
                  segment={segment}
                  maxPercentage={maxPercentage}
                  rank={index + 1}
                  isExpanded={expandedSegments.has(String(index))}
                  onToggle={() => toggleSegment(String(index))}
                />
              ))}
            </div>
          </div>

          {/* Business Insights */}
          {currentReport.businessInsight && (
            <div
              className="p-5 rounded-xl"
              style={{
                backgroundColor: colors.primary[50],
                border: `1px solid ${colors.primary[200]}`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold" style={{ color: colors.primary[900] }}>
                  Business Strategy Recommendations
                </h3>
                <CopyButton text={currentReport.businessInsight} label="Copy" />
              </div>
              <p
                className="text-sm leading-relaxed"
                style={{ color: colors.primary[800] }}
                dangerouslySetInnerHTML={{ __html: currentReport.businessInsight }}
              />
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default LifestyleReportView;
