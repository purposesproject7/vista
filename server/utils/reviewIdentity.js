const romanNumbers = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12 };

export function normalizeReviewName(value) {
  const normalized = String(value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  const numbered = normalized.match(/^review_?(\d+|[ivx]+)(?:_\d{4,})?$/);
  if (numbered) return `review_${romanNumbers[numbered[1]] || Number(numbered[1]) || numbered[1]}`;
  return normalized;
}

export function reviewNamesMatch(left, right) {
  if (!left || !right) return false;
  if (String(left).trim() === String(right).trim()) return true;
  // Different generated identities are different reviews, even if their labels coincide.
  const generated = /^review_?(?:\d+|[ivx]+)_\d{4,}$/i;
  if (generated.test(String(left)) && generated.test(String(right))) return false;
  return normalizeReviewName(left) === normalizeReviewName(right);
}

export function resolveReview(reviews, value) {
  const exact = (reviews || []).find(review => review.reviewName === value);
  if (exact) return exact;
  const generated = /^review_?(?:\d+|[ivx]+)_\d{4,}$/i;
  const matches = (reviews || []).filter(review => {
    if (generated.test(String(value)) && generated.test(String(review.reviewName)) && review.reviewName !== value) return false;
    return reviewNamesMatch(review.reviewName, value) || reviewNamesMatch(review.displayName, value);
  });
  if (matches.length > 1) throw new Error(`Ambiguous review identifier: ${value}. Use the review ID.`);
  return matches[0];
}
