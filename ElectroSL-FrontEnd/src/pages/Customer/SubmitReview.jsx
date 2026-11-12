
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function SubmitReview() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (rating === 0) {
      setMessage('Please select a star rating before submitting.');
      return;
    }

    if (!review.trim()) {
      setMessage('Please write a review before submitting.');
      return;
    }

    setSubmitted(true);
    setMessage(
      'Thank you! Your review is ready. Backend review submission will be connected after API integration.'
    );

    console.log({
      jobReference: 'JOB-2026-001',
      rating,
      review
    });
  };

  return (
    <div className="page-container review-page">
      <Link to="/customer/home" className="back-link">
        ← Back to Dashboard
      </Link>

      <div className="review-header">
        <h1 className="page-title">Submit Job Review</h1>
        <p>Share your experience and help us improve our service.</p>
      </div>

      <div className="review-card">
        <div className="review-job-info">
          <span>Completed Job</span>
          <h2>Electrical Wiring Repair</h2>
          <p>Job Reference: JOB-2026-001</p>
          <p>Electrician: Kasun Perera</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rating-section">
            <h3>Rate Your Experience</h3>
            <p>Select a rating from 1 to 5 stars.</p>

            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`rating-star ${
                    star <= (hoverRating || rating) ? 'active' : ''
                  }`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  disabled={submitted}
                  aria-label={`Rate ${star} out of 5 stars`}
                >
                  ★
                </button>
              ))}
            </div>

            <p className="rating-label">
              {rating === 0
                ? 'No rating selected'
                : `${rating} out of 5 stars`}
            </p>
          </div>

          <div className="review-text-section">
            <label htmlFor="reviewText">Write Your Review</label>
            <textarea
              id="reviewText"
              value={review}
              onChange={(event) => setReview(event.target.value)}
              placeholder="Tell us about your experience with the electrician..."
              rows="6"
              maxLength="500"
              disabled={submitted}
            />
            <span className="review-character-count">
              {review.length}/500 characters
            </span>
          </div>

          {message && (
            <div
              className={`review-message ${
                submitted ? 'success' : 'error'
              }`}
            >
              {message}
            </div>
          )}

          {!submitted && (
            <button type="submit" className="submit-review-button">
              Submit Review
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
