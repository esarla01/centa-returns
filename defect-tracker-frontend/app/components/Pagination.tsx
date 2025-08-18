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

  const buttonClass = "px-4 py-2 text-sm font-medium rounded-md";
  const navButtonClass =
    "flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50";

  return (
    <div className="flex items-center justify-between mt-6">
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
                  ? "bg-primary text-gray-500"
                  : "text-gray-800 bg-white hover:bg-gray-50"
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
  );
};

export default Pagination;
