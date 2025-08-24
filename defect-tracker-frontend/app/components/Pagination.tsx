'use client'

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

// Generate compact page numbers with ellipses
const getPageNumbers = (current: number, total: number): (number | string)[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | string)[] = [1];
  if (current > 4) pages.push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 3) pages.push("...");
  pages.push(total);

  return pages;
};

// Generate mobile page numbers (simpler, fewer numbers)
const getMobilePageNumbers = (current: number, total: number): (number | string)[] => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | string)[] = [];
  
  if (current <= 3) {
    // Near the beginning
    pages.push(1, 2, 3);
    if (total > 4) pages.push("...");
    pages.push(total);
  } else if (current >= total - 2) {
    // Near the end
    pages.push(1);
    pages.push("...");
    pages.push(total - 2, total - 1, total);
  } else {
    // In the middle
    pages.push(1);
    pages.push("...");
    pages.push(current - 1, current, current + 1);
    pages.push("...");
    pages.push(total);
  }

  return pages;
};

const Pagination = ({ currentPage, totalPages }: PaginationProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const changePage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    router.push(`?${params.toString()}`);
  };

  const pageNumbers = getPageNumbers(currentPage, totalPages);
  const mobilePageNumbers = getMobilePageNumbers(currentPage, totalPages);

  const buttonClass = "px-4 py-2 text-sm font-medium rounded-md";
  const mobileButtonClass = "px-3 py-1.5 text-xs font-medium rounded-md";
  const navButtonClass =
    "flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50";
  const mobileNavButtonClass =
    "flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50";

  return (
    <div className="flex items-center justify-between mt-6">
      {/* Desktop Pagination */}
      <div className="hidden md:flex items-center justify-between w-full">
        <button
          onClick={() => changePage(currentPage - 1)}
          disabled={currentPage === 1}
          className={navButtonClass}
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>

        <div className="flex items-center gap-2">
          {pageNumbers.map((num, idx) =>
            typeof num === "number" ? (
              <button
                key={idx}
                onClick={() => changePage(num)}
                className={`${buttonClass} ${
                  currentPage === num
                    ? "bg-blue-500 text-white"
                    : "text-gray-800 bg-white border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {num}
              </button>
            ) : (
              <span key={idx} className="px-2 text-gray-500">
                …
              </span>
            )
          )}
        </div>

        <button
          onClick={() => changePage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={navButtonClass}
        >
          Next
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile Pagination */}
      <div className="md:hidden flex items-center justify-between w-full">
        <button
          onClick={() => changePage(currentPage - 1)}
          disabled={currentPage === 1}
          className={mobileNavButtonClass}
        >
          <ArrowLeft className="w-3 h-3" />
          <span className="hidden sm:inline">Önceki</span>
        </button>

        <div className="flex items-center gap-1">
          {mobilePageNumbers.map((num, idx) =>
            typeof num === "number" ? (
              <button
                key={idx}
                onClick={() => changePage(num)}
                className={`${mobileButtonClass} ${
                  currentPage === num
                    ? "bg-blue-500 text-white"
                    : "text-gray-800 bg-white border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {num}
              </button>
            ) : (
              <span key={idx} className="px-1 text-gray-500 text-xs">
                …
              </span>
            )
          )}
        </div>

        <button
          onClick={() => changePage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={mobileNavButtonClass}
        >
          <span className="hidden sm:inline">Sonraki</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
