import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "./ui/pagination";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (_page: number) => void;
  isTransparent?: boolean;
}

const PaginationComponent = ({
  currentPage = 1,
  totalPages,
  onPageChange,
  isTransparent = false,
}: PaginationProps) => {
  const getVisiblePages = () => {
    const maxPagesToShow = 4;
    let pages = [];

    if (totalPages <= maxPagesToShow) {
      pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      pages.push(1);

      const leftSide = Math.max(currentPage - 1, 2);
      const rightSide = Math.min(currentPage + 1, totalPages - 1);

      if (leftSide > 2) {
        pages.push("...");
      }

      for (let i = leftSide; i <= rightSide; i++) {
        pages.push(i);
      }

      if (rightSide < totalPages - 1) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <Pagination>
      <PaginationContent
        className={`${isTransparent ? "bg-transparent" : "bg-white"} rounded-md p-1 flex items-center gap-1`}
      >
        <PaginationItem>
          <div
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            className={`p-1 ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-100 rounded-full"}`}
          >
            <ChevronLeft className="h-4 w-4 text-gray-500" />
          </div>
        </PaginationItem>

        {getVisiblePages().map((page, index) => (
          <PaginationItem key={index}>
            {page === "..." ? (
              <span className="px-1 text-xs">...</span>
            ) : (
              <PaginationLink
                onClick={() => onPageChange(page as number)}
                className={`rounded-full hover:bg-gray-100 text-xs cursor-pointer h-[32px] w-[32px] ${
                  currentPage === page
                    ? "bg-[#F1F5F9] text-[#2F45FF]"
                    : "text-[#64748B]"
                }`}
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <div
            onClick={() =>
              currentPage < totalPages && onPageChange(currentPage + 1)
            }
            className={`p-1 ${
              currentPage === totalPages
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer hover:bg-gray-100 rounded-full"
            }`}
          >
            <ChevronRight className="h-4 w-4 text-gray-500" />
          </div>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default PaginationComponent;
