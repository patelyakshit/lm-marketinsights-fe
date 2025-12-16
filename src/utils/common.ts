import PictureMarkerSymbol from "@arcgis/core/symbols/PictureMarkerSymbol";

export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return "just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}min ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};

const generatePinIconSvg = (
  fillColor: string = "#171717",
  strokeColor: string = "white",
  filterId: string = "filter0_d_pin",
  useFilter: boolean = true,
  scale: number = 1,
  isCursor: boolean = false,
): string => {
  let fillPath: string;
  let strokePath: string;
  const svgWidth = 31 * scale;
  const svgHeight = 35 * scale;
  const viewBox = `0 0 ${31 * scale} ${35 * scale}`;

  if (scale === 1) {
    fillPath = `M17.25 5.5C21.5208 5.5 25 8.82641 25 13.25C25 14.6666 24.5075 16.1022 23.8223 17.4238C23.1337 18.7517 22.224 20.0149 21.3291 21.1016C20.4323 22.1906 19.5369 23.1177 18.8672 23.7715C18.5321 24.0986 18.2519 24.359 18.0547 24.5381C17.9562 24.6275 17.8781 24.6967 17.8242 24.7441C17.7973 24.7679 17.7762 24.7862 17.7617 24.7988C17.7545 24.8051 17.7491 24.8101 17.7451 24.8135C17.7432 24.8152 17.7402 24.8174 17.7402 24.8174L17.7383 24.8193C17.4925 25.03 17.1444 25.0564 16.873 24.8984L16.7617 24.8193L16.7598 24.8174C16.7598 24.8174 16.7568 24.8152 16.7549 24.8135C16.7509 24.8101 16.7455 24.8051 16.7383 24.7988C16.7238 24.7862 16.7027 24.7679 16.6758 24.7441C16.6219 24.6967 16.5438 24.6275 16.4453 24.5381C16.2481 24.359 15.9679 24.0986 15.6328 23.7715C14.9631 23.1177 14.0677 22.1906 13.1709 21.1016C12.276 20.0149 11.3663 18.7517 10.6777 17.4238C9.99247 16.1022 9.5 14.6666 9.5 13.25C9.5 8.96979 12.9698 5.5 17.25 5.5ZM17.25 9.5C16.8358 9.5 16.5 9.83579 16.5 10.25V12.5H14.25C13.8358 12.5 13.5 12.8358 13.5 13.25C13.5 13.6642 13.8358 14 14.25 14H16.5V16.25C16.5 16.6642 16.8358 17 17.25 17C17.6642 17 18 16.6642 18 16.25V14H20.25C20.6642 14 21 13.6642 21 13.25C21 12.8358 20.6642 12.5 20.25 12.5H18V10.25C18 9.83579 17.6642 9.5 17.25 9.5Z`;
    strokePath = `M17.25 4.75C21.9253 4.75 25.75 8.40254 25.75 13.25C25.75 14.8331 25.2026 16.3919 24.4883 17.7695C23.7673 19.1598 22.8229 20.4674 21.9082 21.5781C20.9895 22.6936 20.0738 23.6417 19.3906 24.3086C19.0486 24.6424 18.7617 24.9093 18.5586 25.0938C18.4568 25.1862 18.3758 25.2578 18.3203 25.3066C18.2919 25.3317 18.2694 25.3518 18.2539 25.3652C18.2539 25.3652 18.253 25.3654 18.251 25.3672C18.2502 25.3679 18.2482 25.3702 18.2461 25.3721C18.2439 25.374 18.2399 25.3779 18.2354 25.3818C18.2211 25.3941 18.2088 25.4033 18.2051 25.4062C18.2023 25.4085 18.1991 25.4107 18.1973 25.4121L18.1953 25.4141H18.1943C17.7048 25.8114 17.0275 25.856 16.4961 25.5469C16.4765 25.5355 16.4569 25.5229 16.4385 25.5098L16.3271 25.4307C16.3198 25.4255 16.3138 25.4186 16.3066 25.4131V25.415L16.3047 25.4141C16.304 25.4135 16.3027 25.4128 16.3018 25.4121C16.3 25.4107 16.2977 25.4084 16.2949 25.4062C16.2912 25.4034 16.2789 25.3941 16.2646 25.3818V25.3809C16.2603 25.3771 16.256 25.374 16.2539 25.3721C16.2519 25.3703 16.2498 25.3679 16.249 25.3672C16.2469 25.3653 16.2461 25.3652 16.2461 25.3652C16.2306 25.3518 16.2081 25.3317 16.1797 25.3066C16.1242 25.2578 16.0432 25.1862 15.9414 25.0938C15.7384 24.9093 15.4514 24.6424 15.1094 24.3086C14.4262 23.6417 13.5105 22.6936 12.5918 21.5781C11.6771 20.4674 10.7327 19.1598 10.0117 17.7695C9.29737 16.3919 8.75 14.8331 8.75 13.25C8.75 8.55558 12.5556 4.75 17.25 4.75ZM16.5 13.25C16.9142 13.25 17.25 13.5858 17.25 14C17.25 13.5858 17.5858 13.25 18 13.25C17.5858 13.25 17.25 12.9142 17.25 12.5C17.25 12.9142 16.9142 13.25 16.5 13.25Z`;
  } else if (scale === 2) {
    fillPath = `M34.5 11.0C43.0416 11.0 50.0 17.65282 50.0 26.5C50.0 29.3332 49.015 32.2044 47.6446 34.8476C46.2674 37.5034 44.448 40.0298 42.6582 42.2032C40.8646 44.3812 39.0738 46.2354 37.7344 47.543C37.0642 48.1972 36.5038 48.718 36.1094 49.0762C35.9124 49.255 35.7562 49.3934 35.6484 49.4882C35.5946 49.5358 35.5524 49.5724 35.5234 49.5976C35.509 49.6102 35.4982 49.6202 35.4902 49.627C35.4864 49.6304 35.4804 49.6348 35.4804 49.6348L35.4766 49.6386C34.985 50.06 34.2888 50.1128 33.746 49.7968L33.5234 49.6386L33.5196 49.6348C33.5196 49.6348 33.5136 49.6304 33.5098 49.627C33.5018 49.6202 33.491 49.6102 33.4766 49.5976C33.4476 49.5724 33.4054 49.5358 33.3516 49.4882C33.2438 49.3934 33.0876 49.255 32.8906 49.0762C32.4962 48.718 31.9358 48.1972 31.2656 47.543C29.9262 46.2354 28.1354 44.3812 26.3418 42.2032C24.552 40.0298 22.7326 37.5034 21.3554 34.8476C19.98494 32.2044 19.0 29.3332 19.0 26.5C19.0 17.93958 25.9396 11.0 34.5 11.0ZM34.5 19.0C33.6716 19.0 33.0 19.67158 33.0 20.5V25.0H28.5C27.6716 25.0 27.0 25.6716 27.0 26.5C27.0 27.3284 27.6716 28.0 28.5 28.0H33.0V32.5C33.0 33.3284 33.6716 34.0 34.5 34.0C35.3284 34.0 36.0 33.3284 36.0 32.5V28.0H40.5C41.3284 28.0 42.0 27.3284 42.0 26.5C42.0 25.6716 41.3284 25.0 40.5 25.0H36.0V20.5C36.0 19.67158 35.3284 19.0 34.5 19.0Z`;
    strokePath = `M34.5 9.5C43.8506 9.5 51.5 16.80508 51.5 26.5C51.5 29.6662 50.4052 32.7838 48.9766 35.539C47.5346 38.3196 45.6458 40.9348 43.8164 43.1562C41.979 45.3872 40.1476 47.2834 38.7812 48.6172C38.0972 49.2848 37.5234 49.8186 37.1172 50.1876C36.9136 50.3724 36.7516 50.5156 36.6406 50.6132C36.5838 50.6634 36.5388 50.7036 36.5078 50.7304C36.5078 50.7304 36.506 50.7308 36.502 50.7344C36.5004 50.7358 36.4964 50.7404 36.4922 50.7442C36.4878 50.748 36.4798 50.7558 36.4708 50.7636C36.4422 50.7882 36.4176 50.8066 36.4102 50.8124C36.4046 50.817 36.3982 50.8214 36.3946 50.8242L36.3906 50.8282H36.3886C35.4096 51.6228 34.055 51.712 32.9922 51.0938C32.953 51.071 32.9138 51.0458 32.877 51.0196L32.6542 50.8614C32.6396 50.851 32.6276 50.8372 32.6132 50.8262V50.83L32.6094 50.8282C32.608 50.827 32.6054 50.8256 32.6036 50.8242C32.6 50.8214 32.5954 50.8168 32.5898 50.8124C32.5824 50.8068 32.5578 50.7882 32.5292 50.7636V50.7618C32.5206 50.7542 32.512 50.748 32.5078 50.7442C32.5038 50.7406 32.4996 50.7358 32.498 50.7344C32.4938 50.7306 32.4922 50.7304 32.4922 50.7304C32.4612 50.7036 32.4162 50.6634 32.3594 50.6132C32.2484 50.5156 32.0864 50.3724 31.8828 50.1876C31.4768 49.8186 30.9028 49.2848 30.2188 48.6172C28.8524 47.2834 27.021 45.3872 25.1836 43.1562C23.3542 40.9348 21.4654 38.3196 20.0234 35.539C18.59474 32.7838 17.5 29.6662 17.5 26.5C17.5 17.11116 25.1112 9.5 34.5 9.5ZM33.0 26.5C33.8284 26.5 34.5 27.1716 34.5 28.0C34.5 27.1716 35.1716 26.5 36.0 26.5C35.1716 26.5 34.5 25.8284 34.5 25.0C34.5 25.8284 33.8284 26.5 33.0 26.5Z`;
  } else {
    throw new Error(`Unsupported scale: ${scale}. Use 1 or 2.`);
  }

  const shapeRendering = isCursor ? "geometricPrecision" : "crispEdges";
  const strokeWidth = 1.5 * scale;

  if (useFilter) {
    const filterDx = -2 * scale;
    const filterDy = 2 * scale;
    const filterStd = 3 * scale;
    const filterWidth = (30.5 * scale).toFixed(1);
    const filterHeight = (34.5 * scale).toFixed(1);
    return `<svg width="${svgWidth}" height="${svgHeight}" viewBox="${viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#${filterId})">
        <path fill-rule="evenodd" clip-rule="evenodd" d="${fillPath}" fill="${fillColor}"/>
        <path d="${strokePath}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </g>
      <defs>
        <filter id="${filterId}" x="0" y="0" width="${filterWidth}" height="${filterHeight}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dx="${filterDx}" dy="${filterDy}"/>
          <feGaussianBlur stdDeviation="${filterStd}"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
        </filter>
      </defs>
    </svg>`;
  } else {
    return `<svg width="${svgWidth}" height="${svgHeight}" viewBox="${viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg" shape-rendering="${shapeRendering}">
      <g>
        <path fill-rule="evenodd" clip-rule="evenodd" d="${fillPath}" fill="${fillColor}"/>
        <path d="${strokePath}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </g>
    </svg>`;
  }
};

export const getPinIconCursorSvg = (): string => {
  return generatePinIconSvg("#171717", "white", "", true, 1, true);
};

export const getPinSymbol = (
  customColors?: { fill?: string; stroke?: string },
  hdScale: number = 2,
): __esri.PictureMarkerSymbol => {
  const fillColor = customColors?.fill || "#FF891C";
  const strokeColor = customColors?.stroke || "white";

  const pinSvg = generatePinIconSvg(
    fillColor,
    strokeColor,
    "",
    false,
    hdScale,
    false,
  );

  const base64Svg = btoa(unescape(encodeURIComponent(pinSvg)));
  const svgDataUrl = `data:image/svg+xml;base64,${base64Svg}`;

  const displayWidth = 31;
  const displayHeight = 35;
  const centerY = displayHeight / 2;
  const tipY = hdScale === 1 ? 25.415 : 50.83;
  const tipYDisplay = tipY / hdScale;
  const yoffset = tipYDisplay - centerY;

  return new PictureMarkerSymbol({
    url: svgDataUrl,
    width: displayWidth,
    height: displayHeight,
    xoffset: 0,
    yoffset: yoffset,
    angle: 0,
  });
};
