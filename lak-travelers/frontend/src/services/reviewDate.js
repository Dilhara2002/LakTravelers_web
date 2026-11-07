// displayDate is a calendar date: store UTC midnight and render in UTC everywhere.
export function reviewDate(review) {
  const parse = value => value ? new Date(value) : null;
  const travel = parse(review.displayDate);
  const hasTravelDate = travel && Number.isFinite(travel.getTime());
  const date = hasTravelDate ? travel : parse(review.createdAt);
  if (!date || !Number.isFinite(date.getTime())) return null;
  return {
    label: hasTravelDate ? 'Travel date' : 'Review submitted',
    dateTime: date.toISOString(),
    text: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }),
  };
}
