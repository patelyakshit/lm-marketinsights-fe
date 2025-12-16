import React from "react";

const ListContent: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center h-full">
      <span
        className="text-[14px]"
        style={{
          fontFamily: "Switzer, sans-serif",
          color: "#7e7977",
          letterSpacing: "-0.084px",
        }}
      >
        Upcoming
      </span>
    </div>
  );
};

export default ListContent;
