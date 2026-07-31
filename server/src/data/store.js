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
    rating: 4.9,
    reviewCount: 128,
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
    rating: 4.7,
    reviewCount: 84,
    verified: true,
    bio: "Essay writing, source analysis, and senior-school study skills specialist.",
    qualifications: ["MEd Literacy", "BA History"],
    availabilitySummary: "Evenings and Sundays"
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
  { id: "slot-4", tutorId: "u-tutor-2", date: "2026-08-06", startTime: "19:00", endTime: "20:00", mode: "Online", booked: false }
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
  nextReference() {
    return `ST-${1000 + this.bookings.length + 1}`;
  },
  userPublic(user) {
    if (!user) return null;
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  },
  findUserByEmail(email) {
    return this.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  },
  findUser(id) {
    return this.users.find((user) => user.id === id);
  },
  createConversation(participantIds, bookingId) {
    const existing = this.conversations.find(
      (conversation) =>
        conversation.bookingId === bookingId ||
        participantIds.every((id) => conversation.participantIds.includes(id))
    );
    if (existing) return existing;
    const conversation = {
      id: `conv-${nanoid(8)}`,
      participantIds,
      bookingId,
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
