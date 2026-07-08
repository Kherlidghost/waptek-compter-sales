"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { reviewStorageKey, sampleReviews, type LocalReview } from "@/lib/customer-flow";

export function ReviewSection({ product }: { product: Product }) {
  const [reviews, setReviews] = useState<LocalReview[]>(sampleReviews);
  const [name, setName] = useState("Fatima Ahmed");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const value = window.localStorage.getItem(reviewStorageKey);
    if (value) {
      try {
        setReviews(JSON.parse(value) as LocalReview[]);
      } catch {
        setReviews(sampleReviews);
      }
    }
  }, []);

  const productReviews = useMemo(() => reviews.filter((review) => review.productId === product.id), [product.id, reviews]);

  function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!comment.trim()) return;

    const nextReviews = [{ productId: product.id, name, rating, comment }, ...reviews];
    setReviews(nextReviews);
    window.localStorage.setItem(reviewStorageKey, JSON.stringify(nextReviews));
    setComment("");
  }

  return (
    <section className="mx-auto mt-10 max-w-6xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <p className="text-sm font-bold uppercase text-emerald-700">Reviews</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Customer feedback</h2>
          <div className="mt-5 grid gap-3">
            {productReviews.length === 0 ? (
              <p className="text-sm text-slate-600">No reviews yet for this product.</p>
            ) : (
              productReviews.map((review, index) => (
                <article key={`${review.name}-${index}`} className="rounded-md bg-slate-50 p-4">
                  <p className="font-bold text-slate-950">{review.name}</p>
                  <p className="mt-1 text-sm text-amber-700">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{review.comment}</p>
                </article>
              ))
            )}
          </div>
        </div>
        <form onSubmit={submitReview} className="grid h-fit gap-3 rounded-lg bg-slate-50 p-4">
          <p className="font-bold text-slate-950">Write a review</p>
          <input
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            value={name}
          />
          <select
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            onChange={(event) => setRating(Number(event.target.value))}
            value={rating}
          >
            {[5, 4, 3, 2, 1].map((item) => (
              <option key={item} value={item}>{item} stars</option>
            ))}
          </select>
          <textarea
            className="min-h-24 rounded-md border border-slate-300 p-3 text-sm"
            onChange={(event) => setComment(event.target.value)}
            placeholder="Share your product experience"
            value={comment}
          />
          <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white" type="submit">
            Submit review
          </button>
        </form>
      </div>
    </section>
  );
}
