"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface StarRatingProps {
  gameId: string;
  gameSlug: string;
  avgRating: number;
  ratingCount: number;
  initialUserRating?: number;
  isAuthenticated: boolean;
  size?: "sm" | "md" | "lg";
}

export function StarRating({
  gameId,
  gameSlug,
  avgRating,
  ratingCount,
  initialUserRating = 0,
  isAuthenticated,
  size = "md",
}: StarRatingProps) {
  const router = useRouter();
  const [hover, setHover] = useState(0);
  const [userRating, setUserRating] = useState(initialUserRating);
  const [pending, setPending] = useState(false);

  const starSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-6 w-6",
  };

  async function handleRate(value: number) {
    if (!isAuthenticated) {
      router.push(`/login?from=/games/${gameSlug}`);
      return;
    }

    if (pending) return;

    setPending(true);
    try {
      const response = await fetch("/api/user/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, value }),
      });

      if (response.ok) {
        setUserRating(value);
        router.refresh();
      }
    } catch (err) {
      console.error("Erro ao avaliar:", err);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = (hover || userRating || avgRating) >= star;
          const isHalf = !hover && !userRating && avgRating > star - 1 && avgRating < star;
          
          return (
            <button
              key={star}
              type="button"
              disabled={pending}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              onClick={() => handleRate(star)}
              className={`relative transition-transform duration-150 hover:scale-125 focus:outline-none disabled:cursor-wait ${starSizes[size]}`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`h-full w-full ${
                  isFilled 
                    ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" 
                    : isHalf 
                      ? "text-amber-400" 
                      : "fill-slate-800 text-slate-800"
                } transition-colors duration-200`}
              >
                {isHalf ? (
                  <>
                    <path
                      d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27z"
                      fill="currentColor"
                      fillOpacity="0.2"
                    />
                    <path
                      d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27V2z"
                      fill="currentColor"
                    />
                  </>
                ) : (
                  <path
                    d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27z"
                    fill="currentColor"
                  />
                )}
              </svg>
            </button>
          );
        })}
        {ratingCount > 0 && (
          <span className="ml-1 text-[10px] font-bold text-slate-500">
            ({avgRating.toFixed(1)})
          </span>
        )}
      </div>
    </div>
  );
}
