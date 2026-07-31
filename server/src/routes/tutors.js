import { Router } from "express";
import { store } from "../data/store.js";
import { requireAuth } from "../middleware/auth.js";
import { notFound } from "../utils/errors.js";

export const tutorsRouter = Router();

tutorsRouter.get("/", requireAuth, (req, res) => {
  const subject = String(req.query.subject || "").toLowerCase();
  const language = String(req.query.language || "").toLowerCase();
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : Infinity;
  const minRating = req.query.minRating ? Number(req.query.minRating) : 0;
  const sort = req.query.sort || "relevance";

  let tutors = store.users.filter((user) => user.role === "tutor" && user.active);
  if (subject) tutors = tutors.filter((tutor) => tutor.subjects?.some((item) => item.toLowerCase().includes(subject)));
  if (language) tutors = tutors.filter((tutor) => tutor.languages?.some((item) => item.toLowerCase().includes(language)));
  tutors = tutors.filter((tutor) => Number(tutor.price || 0) <= maxPrice && Number(tutor.rating || 0) >= minRating);

  if (sort === "rating") tutors.sort((a, b) => b.rating - a.rating);
  if (sort === "price") tutors.sort((a, b) => a.price - b.price);

  res.json({ total: tutors.length, tutors: tutors.map((tutor) => store.userPublic(tutor)) });
});

tutorsRouter.get("/:id", requireAuth, (req, res, next) => {
  try {
    const tutor = store.findUser(req.params.id);
    if (!tutor || tutor.role !== "tutor") throw notFound("Tutor not found");
    const reviews = store.reviews
      .filter((review) => review.tutorId === tutor.id)
      .map((review) => ({ ...review, student: store.userPublic(store.findUser(review.studentId)) }));
    res.json({
      tutor: store.userPublic(tutor),
      availability: store.availability.filter((slot) => slot.tutorId === tutor.id && !slot.booked),
      reviews
    });
  } catch (error) {
    next(error);
  }
});

tutorsRouter.get("/:id/availability", requireAuth, (req, res) => {
  res.json({ slots: store.availability.filter((slot) => slot.tutorId === req.params.id && !slot.booked) });
});
