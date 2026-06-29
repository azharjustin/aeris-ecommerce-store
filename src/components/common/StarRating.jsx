export default function StarRating({ rating, reviews }) {
  return (
    <div className="product-card-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={`star ${star <= Math.round(rating) ? 'filled' : 'empty'}`}>
          ★
        </span>
      ))}
      {reviews !== undefined && <span className="rating-count">({reviews})</span>}
    </div>
  )
}
