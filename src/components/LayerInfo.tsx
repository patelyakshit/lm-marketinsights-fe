import React, { useState } from "react";

interface LayerInfoProps {
  layerDetails: {
    type?: string;
    size?: number;
    id?: string;
    avgRating?: number;
    tags?: string[];
    accessInformation?: string;
    url?: string;
    licenseInfo?: string;
  };
}

const LayerInfo = ({ layerDetails }: LayerInfoProps) => {
  const [copied, setCopied] = useState(false);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = rating;
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <span key={i} className="text-yellow-400 text-xl">
            ★
          </span>,
        );
      } else {
        stars.push(
          <span key={i} className="text-yellow-400 text-xl">
            ☆
          </span>,
        );
      }
    }
    return stars;
  };

  return (
    <div className="max-w-xl p-2 text-sm">
      <section className="mb-2">
        {layerDetails?.type && (
          <div className="mb-2">
            <span className="text-[#475569] font-normal text-[14px] leading-[20px] tracking-[0%]">
              Source:{" "}
            </span>
            <button
              className="text-base text-blue-600 text-[14px] hover:underline"
              onClick={() => window.open(layerDetails?.url, "_blank")}
            >
              {layerDetails?.type}
            </button>
          </div>
        )}

        {layerDetails?.size && (
          <div className="mb-2">
            <span className="text-[#475569] font-normal text-[14px] leading-[20px] tracking-[0%]">
              Size:{" "}
            </span>
            <span className="text-base text-[14px]">{`${layerDetails?.size}KB`}</span>
          </div>
        )}

        {layerDetails?.id && (
          <div className="mb-3">
            <span className="text-[#475569] font-normal text-[14px] leading-[20px] tracking-[0%]">
              ID:{" "}
            </span>
            <span className="text-base text-[14px]">{layerDetails?.id}</span>
          </div>
        )}

        {layerDetails?.avgRating ? (
          <div className="flex mb-2">
            {renderStars(layerDetails?.avgRating)}
          </div>
        ) : null}
      </section>

      {/* Tags Section */}
      {layerDetails?.tags &&
      layerDetails?.tags.length &&
      layerDetails?.tags.length > 0 ? (
        <section className="mb-4">
          <h2 className="text-2xl text-gray-700 font-normal mb-3 text-[14px]">
            Tags
          </h2>
          <div className="text-sm text-[14px]">
            {layerDetails?.tags?.map((tag: string, index: number) => (
              <React.Fragment key={tag}>
                <a
                  href={`https://www.arcgis.com/home/search.html?t=content&q=tags:${encodeURIComponent(tag)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {tag}
                </a>
                {index < (layerDetails?.tags?.length || 0) - 1 && (
                  <span className="text-gray-500">, </span>
                )}
              </React.Fragment>
            ))}
          </div>
        </section>
      ) : null}

      {/* Credits Section */}
      {layerDetails?.accessInformation && (
        <section className="mb-4">
          <h2 className="text-2xl text-gray-700 font-normal mb-2 text-[14px]">
            Credits (Attribution) :
          </h2>
          <p className="text-base text-[14px]">
            {layerDetails?.accessInformation}
          </p>
        </section>
      )}

      {/* URL Section */}
      {layerDetails?.url && (
        <section className="mb-2 ">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl text-gray-700 font-normal text-[14px]">
              URL
            </h2>
            <button
              className="text-blue-600 hover:underline flex items-center text-sm text-[14px]"
              onClick={() => window.open(layerDetails?.url, "_blank")}
            >
              <span className="mr-1">View</span>
              <button>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </button>
            </button>
          </div>

          <div className="flex">
            <input
              type="text"
              value={layerDetails?.url}
              readOnly={true}
              className="flex-grow border p-2 bg-white text-gray-700 border-gray-300 text-sm"
            />
            <button
              onClick={() => {
                if (layerDetails?.url) {
                  navigator.clipboard.writeText(layerDetails.url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500); // Reset after 1.5s
                }
              }}
              className={`bg-white border border-l-0 p-2 border-gray-300 transition-colors duration-300 ${
                copied ? "bg-blue-100" : ""
              }`}
            >
              {copied ? (
                // ✅ Blue check icon when copied
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="blue"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                // 📋 Default icon
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
        </section>
      )}

      {layerDetails?.licenseInfo && (
        <section className="mb-2">
          <span
            className="px-2 py-2"
            dangerouslySetInnerHTML={{
              __html: layerDetails?.licenseInfo || "",
            }}
          ></span>
        </section>
      )}
    </div>
  );
};

export default LayerInfo;
