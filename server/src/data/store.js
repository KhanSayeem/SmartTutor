import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

const passwordHash = bcrypt.hashSync("Password123!", 10);
const now = new Date("2026-07-31T03:00:00.000Z");

const users = [
  {
    id: "u-student",
    name: "Avery Chen",
    email: "student@smarttutor.local",
    passwordHash,
    role: "student",
    active: true,
    avatar: "AC",
    joinedAt: "2026-04-12",
    phone: "+61 400 000 101",
    subjects: ["Mathematics", "Physics"]
  },
  {
    id: "u-tutor",
    name: "Dr. Maya Singh",
    email: "tutor@smarttutor.local",
    passwordHash,
    role: "tutor",
    active: true,
    avatar: "MS",
    joinedAt: "2026-02-08",
    subjects: ["Mathematics", "Physics", "Chemistry"],
    languages: ["English", "Hindi"],
    price: 45,
    verified: true,
    bio:
      "Patient STEM tutor with 8 years of university teaching experience and a practical exam-prep approach.",
    qualifications: ["PhD Applied Mathematics", "Graduate Certificate in Education"],
    availabilitySummary: "Weekdays after 4pm, Saturday mornings"
  },
  {
    id: "u-tutor-2",
    name: "Samuel Brooks",
    email: "samuel@smarttutor.local",
    passwordHash,
    role: "tutor",
    active: true,
    avatar: "SB",
    joinedAt: "2026-03-19",
    subjects: ["English", "History"],
    languages: ["English"],
    price: 38,
    verified: true,
    bio: "Essay writing, source analysis, and senior-school study skills specialist.",
    qualifications: ["MEd Literacy", "BA History"],
    availabilitySummary: "Evenings and Sundays"
  },
  {
    id: "u-student-2",
    name: "Liam Ortiz",
    email: "liam@smarttutor.local",
    passwordHash,
    role: "student",
    active: true,
    avatar: "LO",
    joinedAt: "2026-05-02",
    phone: "+61 400 000 102",
    subjects: ["Physics"]
  },
  {
    id: "u-student-3",
    name: "Priya Nair",
    email: "priya@smarttutor.local",
    passwordHash,
    role: "student",
    active: true,
    avatar: "PN",
    joinedAt: "2026-05-21",
    phone: "+61 400 000 103",
    subjects: ["Chemistry", "Mathematics"]
  },
  {
    id: "u-admin",
    name: "Manish KC",
    email: "admin@smarttutor.local",
    passwordHash,
    role: "admin",
    active: true,
    avatar: "MK",
    joinedAt: "2026-01-15"
  }
];

const availability = [
  { id: "slot-1", tutorId: "u-tutor", date: "2026-08-03", startTime: "16:00", endTime: "17:00", mode: "Online", booked: false },
  { id: "slot-2", tutorId: "u-tutor", date: "2026-08-04", startTime: "18:00", endTime: "19:00", mode: "Online", booked: false },
  { id: "slot-3", tutorId: "u-tutor", date: "2026-08-05", startTime: "17:00", endTime: "18:00", mode: "In-Person", booked: false },
  { id: "slot-4", tutorId: "u-tutor-2", date: "2026-08-06", startTime: "19:00", endTime: "20:00", mode: "Online", booked: false },
  { id: "slot-5", tutorId: "u-tutor", date: "2026-08-05", startTime: "19:00", endTime: "20:00", mode: "Online", booked: false },
  { id: "slot-6", tutorId: "u-tutor", date: "2026-08-07", startTime: "16:00", endTime: "17:00", mode: "Online", booked: false },
  { id: "slot-7", tutorId: "u-tutor", date: "2026-08-10", startTime: "16:00", endTime: "17:00", mode: "Online", booked: false },
  { id: "slot-8", tutorId: "u-tutor", date: "2026-08-12", startTime: "18:00", endTime: "19:00", mode: "In-Person", booked: false },
  { id: "slot-9", tutorId: "u-tutor", date: "2026-08-14", startTime: "17:00", endTime: "18:00", mode: "Online", booked: false },
  { id: "slot-10", tutorId: "u-tutor-2", date: "2026-08-11", startTime: "19:00", endTime: "20:00", mode: "Online", booked: false }
];

const bookings = [
  {
    id: "bk-1001",
    reference: "ST-1001",
    studentId: "u-student",
    tutorId: "u-tutor",
    subject: "Mathematics",
    date: "2026-08-03",
    startTime: "16:00",
    endTime: "17:00",
    mode: "Online",
    amount: 45,
    status: "pending",
    createdAt: "2026-07-30T10:00:00.000Z"
  },
  {
    id: "bk-1000",
    reference: "ST-1000",
    studentId: "u-student",
    tutorId: "u-tutor",
    subject: "Physics",
    date: "2026-07-31",
    startTime: "18:00",
    endTime: "19:00",
    mode: "Online",
    amount: 45,
    status: "confirmed",
    createdAt: "2026-07-26T09:30:00.000Z"
  },
  {
    id: "bk-0999",
    reference: "ST-0999",
    studentId: "u-student",
    tutorId: "u-tutor",
    subject: "Mathematics",
    date: "2026-07-18",
    startTime: "10:00",
    endTime: "11:00",
    mode: "Online",
    amount: 45,
    status: "completed",
    notes: "Strong progress on quadratic equations.",
    createdAt: "2026-07-11T08:10:00.000Z"
  },
  {
    id: "bk-0998",
    reference: "ST-0998",
    studentId: "u-student-2",
    tutorId: "u-tutor",
    subject: "Physics",
    date: "2026-07-09",
    startTime: "17:00",
    endTime: "18:00",
    mode: "Online",
    amount: 45,
    status: "completed",
    createdAt: "2026-07-02T08:00:00.000Z"
  },
  {
    id: "bk-0997",
    reference: "ST-0997",
    studentId: "u-student-3",
    tutorId: "u-tutor",
    subject: "Chemistry",
    date: "2026-06-27",
    startTime: "16:00",
    endTime: "17:00",
    mode: "In-Person",
    amount: 45,
    status: "completed",
    createdAt: "2026-06-20T08:00:00.000Z"
  },
  {
    id: "bk-0996",
    reference: "ST-0996",
    studentId: "u-student-2",
    tutorId: "u-tutor",
    subject: "Mathematics",
    date: "2026-06-14",
    startTime: "10:00",
    endTime: "11:00",
    mode: "Online",
    amount: 45,
    status: "completed",
    createdAt: "2026-06-07T08:00:00.000Z"
  },
  {
    id: "bk-0995",
    reference: "ST-0995",
    studentId: "u-student-3",
    tutorId: "u-tutor-2",
    subject: "English",
    date: "2026-06-20",
    startTime: "19:00",
    endTime: "20:00",
    mode: "Online",
    amount: 38,
    status: "completed",
    createdAt: "2026-06-13T08:00:00.000Z"
  },
  {
    id: "bk-0994",
    reference: "ST-0994",
    studentId: "u-student",
    tutorId: "u-tutor",
    subject: "Physics",
    date: "2026-07-05",
    startTime: "17:00",
    endTime: "18:00",
    mode: "Online",
    amount: 45,
    status: "completed",
    notes: "Worked through projectile motion problems.",
    createdAt: "2026-06-28T08:00:00.000Z"
  },
  {
    id: "bk-0993",
    reference: "ST-0993",
    studentId: "u-student",
    tutorId: "u-tutor",
    subject: "Mathematics",
    date: "2026-06-25",
    startTime: "10:00",
    endTime: "11:00",
    mode: "Online",
    amount: 45,
    status: "completed",
    notes: "Reviewed factoring and the quadratic formula.",
    createdAt: "2026-06-18T08:00:00.000Z"
  },
  {
    id: "bk-0992",
    reference: "ST-0992",
    studentId: "u-student",
    tutorId: "u-tutor",
    subject: "Chemistry",
    date: "2026-06-10",
    startTime: "16:00",
    endTime: "17:00",
    mode: "In-Person",
    amount: 45,
    status: "completed",
    notes: "Introduced mole calculations and stoichiometry.",
    createdAt: "2026-06-03T08:00:00.000Z"
  },
  {
    id: "bk-0991",
    reference: "ST-0991",
    studentId: "u-student",
    tutorId: "u-tutor",
    subject: "Mathematics",
    date: "2026-08-05",
    startTime: "16:00",
    endTime: "17:00",
    mode: "Online",
    amount: 45,
    status: "completed",
    notes: "Timed practice on past-paper algebra questions.",
    createdAt: "2026-07-29T08:00:00.000Z"
  }
];

const transactions = [
  {
    id: "txn-0999",
    bookingId: "bk-0999",
    studentId: "u-student",
    tutorId: "u-tutor",
    subject: "Mathematics",
    amount: 45,
    status: "paid",
    createdAt: "2026-07-18T11:05:00.000Z"
  },
  {
    id: "txn-0998",
    bookingId: "bk-0998",
    studentId: "u-student-2",
    tutorId: "u-tutor",
    subject: "Physics",
    amount: 45,
    status: "paid",
    createdAt: "2026-07-09T11:05:00.000Z"
  },
  {
    id: "txn-0997",
    bookingId: "bk-0997",
    studentId: "u-student-3",
    tutorId: "u-tutor",
    subject: "Chemistry",
    amount: 45,
    status: "paid",
    createdAt: "2026-06-27T11:05:00.000Z"
  },
  {
    id: "txn-0996",
    bookingId: "bk-0996",
    studentId: "u-student-2",
    tutorId: "u-tutor",
    subject: "Mathematics",
    amount: 45,
    status: "paid",
    createdAt: "2026-06-14T11:05:00.000Z"
  },
  {
    id: "txn-0995",
    bookingId: "bk-0995",
    studentId: "u-student-3",
    tutorId: "u-tutor-2",
    subject: "English",
    amount: 38,
    status: "paid",
    createdAt: "2026-06-20T11:05:00.000Z"
  },
  {
    id: "txn-0994",
    bookingId: "bk-0994",
    studentId: "u-student",
    tutorId: "u-tutor",
    subject: "Physics",
    amount: 45,
    status: "paid",
    createdAt: "2026-07-05T11:05:00.000Z"
  },
  {
    id: "txn-0993",
    bookingId: "bk-0993",
    studentId: "u-student",
    tutorId: "u-tutor",
    subject: "Mathematics",
    amount: 45,
    status: "paid",
    createdAt: "2026-06-25T11:05:00.000Z"
  },
  {
    id: "txn-0992",
    bookingId: "bk-0992",
    studentId: "u-student",
    tutorId: "u-tutor",
    subject: "Chemistry",
    amount: 45,
    status: "paid",
    createdAt: "2026-06-10T11:05:00.000Z"
  },
  {
    id: "txn-0991",
    bookingId: "bk-0991",
    studentId: "u-student",
    tutorId: "u-tutor",
    subject: "Mathematics",
    amount: 45,
    status: "paid",
    createdAt: "2026-08-05T11:05:00.000Z"
  }
];

const conversations = [
  {
    id: "conv-1",
    participantIds: ["u-student", "u-tutor"],
    bookingId: "bk-1000",
    unreadBy: ["u-student"],
    updatedAt: "2026-07-30T12:12:00.000Z"
  }
];

const messages = [
  {
    id: "msg-1",
    conversationId: "conv-1",
    senderId: "u-tutor",
    body: "I added a practice worksheet before our session.",
    attachments: [],
    flagged: false,
    createdAt: "2026-07-30T12:12:00.000Z"
  },
  {
    id: "msg-2",
    conversationId: "conv-1",
    senderId: "u-student",
    body: "Thanks, I will review it tonight.",
    attachments: [],
    flagged: false,
    createdAt: "2026-07-30T12:14:00.000Z"
  }
];

const materials = [
  {
    id: "mat-1",
    title: "Algebra revision worksheet.pdf",
    mimeType: "application/pdf",
    size: 124000,
    uploaderId: "u-tutor",
    linkedStudentIds: ["u-student"],
    public: false,
    storagePath: "demo/algebra-revision.pdf",
    createdAt: "2026-07-25T10:30:00.000Z"
  }
];

const reviews = [
  {
    id: "rev-1",
    tutorId: "u-tutor",
    studentId: "u-student",
    bookingId: "bk-0999",
    rating: 5,
    comment: "Clear explanations and practical exam strategies.",
    createdAt: "2026-07-19"
  },
  {
    id: "rev-2",
    tutorId: "u-tutor",
    studentId: "u-student-2",
    bookingId: "bk-0998",
    rating: 4,
    comment: "Great at breaking down mechanics problems. Would have liked a few more practice questions.",
    createdAt: "2026-07-10"
  },
  {
    id: "rev-3",
    tutorId: "u-tutor",
    studentId: "u-student-3",
    bookingId: "bk-0997",
    rating: 5,
    comment: "Turned titration calculations from my worst topic into my most reliable one.",
    createdAt: "2026-06-28"
  },
  {
    id: "rev-4",
    tutorId: "u-tutor",
    studentId: "u-student-2",
    bookingId: "bk-0996",
    rating: 3,
    comment: "Solid session, though we ran short on time for the last worked example.",
    createdAt: "2026-06-15"
  },
  {
    // Attached to a booking that is still pending, so it must never surface on the profile.
    id: "rev-5",
    tutorId: "u-tutor",
    studentId: "u-student",
    bookingId: "bk-1001",
    rating: 1,
    comment: "Placeholder review on an unfinished booking.",
    createdAt: "2026-07-30"
  },
  {
    id: "rev-6",
    tutorId: "u-tutor-2",
    studentId: "u-student-3",
    bookingId: "bk-0995",
    rating: 5,
    comment: "Rebuilt my essay structure from scratch and my marks jumped a grade.",
    createdAt: "2026-06-21"
  },
  {
    id: "rev-7",
    tutorId: "u-tutor",
    studentId: "u-student",
    bookingId: "bk-0994",
    rating: 5,
    comment: "Projectile motion finally clicked once we worked through it step by step.",
    createdAt: "2026-07-06"
  },
  {
    id: "rev-8",
    tutorId: "u-tutor",
    studentId: "u-student",
    bookingId: "bk-0993",
    rating: 4,
    comment: "Good refresher on factoring, would like more worked examples next time.",
    createdAt: "2026-06-26"
  },
  {
    id: "rev-9",
    tutorId: "u-tutor",
    studentId: "u-student",
    bookingId: "bk-0992",
    rating: 5,
    comment: "Stoichiometry finally makes sense — great pacing.",
    createdAt: "2026-06-11"
  },
  {
    id: "rev-10",
    tutorId: "u-tutor",
    studentId: "u-student",
    bookingId: "bk-0991",
    rating: 5,
    comment: "Past-paper practice was exactly what I needed before the mocks.",
    createdAt: "2026-08-06"
  }
];

export const store = {
  users,
  availability,
  bookings,
  transactions,
  conversations,
  messages,
  materials,
  reviews,
  resetTokens: [],
  presence: new Map([
    ["u-student", { online: true, updatedAt: now.toISOString() }],
    ["u-tutor", { online: true, updatedAt: now.toISOString() }]
  ]),
  // Derive from the highest reference in play; a length-based counter repeats
  // itself as soon as the booking list is filtered or trimmed.
  // A user counts as online while a request from them landed inside this
  // window. The client polls every 4s, so a closed tab reads offline in ~12s.
  presenceWindowMs: 12000,
  typingWindowMs: 5000,
  typing: new Map(),
  markSeen(userId) {
    this.presence.set(userId, { online: true, updatedAt: new Date().toISOString() });
  },
  isOnline(userId) {
    const entry = this.presence.get(userId);
    if (!entry?.updatedAt) return false;
    return Date.now() - new Date(entry.updatedAt).getTime() <= this.presenceWindowMs;
  },
  markTyping(conversationId, userId) {
    this.typing.set(`${conversationId}:${userId}`, Date.now());
  },
  isTyping(conversationId, userId) {
    const at = this.typing.get(`${conversationId}:${userId}`);
    return Boolean(at) && Date.now() - at <= this.typingWindowMs;
  },
  nextReference() {
    const highest = this.bookings.reduce((max, booking) => {
      const value = Number(String(booking.reference || "").replace("ST-", ""));
      return Number.isFinite(value) && value > max ? value : max;
    }, 1000);
    return `ST-${highest + 1}`;
  },
  userPublic(user) {
    if (!user) return null;
    const { passwordHash: _passwordHash, ...safeUser } = user;
    if (safeUser.role !== "tutor") return safeUser;
    const summary = this.reviewSummary(safeUser.id);
    return { ...safeUser, rating: summary.average, reviewCount: summary.count };
  },
  // Only reviews attached to a completed booking with the same tutor count as real feedback.
  tutorReviews(tutorId) {
    return this.reviews
      .filter((review) => {
        if (review.tutorId !== tutorId) return false;
        const booking = this.bookings.find((item) => item.id === review.bookingId);
        return Boolean(booking) && booking.status === "completed" && booking.tutorId === tutorId;
      })
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  },
  reviewSummary(tutorId) {
    const reviews = this.tutorReviews(tutorId);
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let total = 0;
    for (const review of reviews) {
      const rating = Math.min(5, Math.max(1, Math.round(Number(review.rating) || 0)));
      breakdown[rating] += 1;
      total += rating;
    }
    const count = reviews.length;
    return { count, average: count ? Math.round((total / count) * 10) / 10 : 0, breakdown };
  },
  findUserByEmail(email) {
    return this.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  },
  findUser(id) {
    return this.users.find((user) => user.id === id);
  },
  // Match on the booking first and on an exact participant set second. The old
  // rule OR'd the two, so any thread that merely contained both people won —
  // accepting a second booking between the same pair returned the first
  // booking's thread, and a missing bookingId matched an unrelated pair's.
  createConversation(participantIds, bookingId = null) {
    const ids = [...new Set(participantIds)].filter(Boolean).sort();
    if (ids.length < 2) throw new Error("A conversation needs at least two distinct participants");

    const sameParticipants = (conversation) => {
      const other = [...new Set(conversation.participantIds)].sort();
      return other.length === ids.length && other.every((id, index) => id === ids[index]);
    };

    if (bookingId) {
      const byBooking = this.conversations.find(
        (conversation) => conversation.bookingId === bookingId && sameParticipants(conversation)
      );
      if (byBooking) return byBooking;
    }

    const unbound = this.conversations.find((conversation) => sameParticipants(conversation) && !conversation.bookingId);
    if (unbound) {
      if (bookingId) unbound.bookingId = bookingId;
      return unbound;
    }

    const conversation = {
      id: `conv-${nanoid(8)}`,
      participantIds: ids,
      bookingId: bookingId || null,
      unreadBy: [],
      updatedAt: new Date().toISOString()
    };
    this.conversations.push(conversation);
    return conversation;
  },
  shapeBooking(booking) {
    return {
      ...booking,
      student: this.userPublic(this.findUser(booking.studentId)),
      tutor: this.userPublic(this.findUser(booking.tutorId))
    };
  },
  shapeTransaction(transaction) {
    return {
      ...transaction,
      student: this.userPublic(this.findUser(transaction.studentId)),
      tutor: this.userPublic(this.findUser(transaction.tutorId)),
      booking: this.bookings.find((booking) => booking.id === transaction.bookingId)
    };
  }
};
