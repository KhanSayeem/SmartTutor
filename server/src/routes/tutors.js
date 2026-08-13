import { Router } from "express";
import { store } from "../data/store.js";
import { requireAuth } from "../middleware/auth.js";
import { notFound } from "../utils/errors.js";

export const tutorsRouter = Router();

tutorsRouter.get("/", requireAuth, (req, res) => {
  const query = String(req.query.q || "").toLowerCase();
  const subject = String(req.query.subject || "").toLowerCase();
  const language = String(req.query.language || "").toLowerCase();
  const availability = String(req.query.availability || "").toLowerCase();
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : Infinity;
  const minRating = req.query.minRating ? Number(req.query.minRating) : 0;
  const sort = req.query.sort || "relevance";

  let tutors = store.users.filter((user) => user.role === "tutor" && user.active);
  if (query) {
    tutors = tutors.filter((tutor) =>
      [tutor.name, tutor.bio, ...(tutor.subjects || [])].some((item) => item?.toLowerCase().includes(query))
    );
  }
  if (subject) tutors = tutors.filter((tutor) => tutor.subjects?.some((item) => item.toLowerCase().includes(subject)));
  if (language) tutors = tutors.filter((tutor) => tutor.languages?.some((item) => item.toLowerCase().includes(language)));
  if (availability) {
    tutors = tutors.filter((tutor) =>
      store.availability.some(
        (slot) =>
          slot.tutorId === tutor.id &&
          !slot.booked &&
          (availability === "available" || slot.mode.toLowerCase() === availability)
      )
    );
  }
  const cards = tutors
    .map((tutor) => store.userPublic(tutor))
    .filter((tutor) => Number(tutor.price || 0) <= maxPrice && Number(tutor.rating || 0) >= minRating);

  if (sort === "rating") cards.sort((a, b) => b.rating - a.rating);
  if (sort === "price") cards.sort((a, b) => a.price - b.price);

  res.json({ total: cards.length, tutors: cards });
});

tutorsRouter.get("/:id", requireAuth, (req, res, next) => {
  try {
    const tutor = store.findUser(req.params.id);
    if (!tutor || tutor.role !== "tutor") throw notFound("Tutor not found");
    const reviews = store.tutorReviews(tutor.id).map((review) => {
      const booking = store.bookings.find((item) => item.id === review.bookingId);
      return {
        ...review,
        student: store.reviewerPublic(store.findUser(review.studentId)),
        booking: booking ? { id: booking.id, subject: booking.subject, date: booking.date, mode: booking.mode } : null
      };
    });
    res.json({
      tutor: store.userPublic(tutor),
      availability: store.availability.filter((slot) => slot.tutorId === tutor.id && !slot.booked),
      reviews,
      reviewSummary: store.reviewSummary(tutor.id)
    });
  } catch (error) {
    next(error);
  }
});

tutorsRouter.get("/:id/availability", requireAuth, (req, res) => {
  res.json({ slots: store.availability.filter((slot) => slot.tutorId === req.params.id && !slot.booked) });
});
