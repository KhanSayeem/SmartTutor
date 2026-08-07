import {
  AlertCircle,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  Download,
  FileUp,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Search,
  Send,
  ShieldCheck,
  Star,
  User,
  Wallet
} from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api.js";
import { useAuthStore } from "./authStore.js";
import { Link, Navigate, NavLink, Route, Routes, useNavigate, useParams } from "./router.jsx";

const roleHome = {
  student: "/search",
  tutor: "/tutor/dashboard",
  admin: "/admin"
};

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Logo() {
  return (
    <Link to="/" className="brand-logo">
      <span>S</span>
      SmartTutor
    </Link>
  );
}

function Button({ variant = "primary", className, ...props }) {
  return <button className={cx("btn", `btn-${variant}`, className)} {...props} />;
}

function Field({ label, error, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <input className={cx("field", error && "field-error")} {...props} />
      {error ? <span className="mt-2 block text-xs font-semibold text-status-danger">{error}</span> : null}
    </label>
  );
}

function TextArea({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <textarea className="field min-h-28 resize-y" {...props} />
    </label>
  );
}

function Badge({ children, tone = "info" }) {
  const tones = {
    info: "bg-surface-info text-brand-blue",
    student: "bg-surface-student text-brand-navy",
    success: "bg-surface-success text-status-success",
    warning: "bg-surface-warning text-status-warning",
    danger: "bg-surface-danger text-status-danger",
    neutral: "bg-surface-shell text-slate-600"
  };
  return <span className={cx("pill", tones[tone])}>{children}</span>;
}

function Avatar({ user }) {
  return <span className="avatar">{user?.avatar || user?.name?.slice(0, 2).toUpperCase() || "ST"}</span>;
}

function StatusBadge({ status }) {
  const tone = status === "completed" || status === "confirmed" || status === "paid" || status === "active" ? "success" : status === "pending" ? "warning" : "danger";
  return <Badge tone={tone}>{status}</Badge>;
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <section className="card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold">{value}</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-surface-info text-brand-blue">
          <Icon size={22} />
        </div>
      </div>
    </section>
  );
}

function PageTitle({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-extrabold">{title}</h1>
      {subtitle ? <p className="mt-2 max-w-3xl text-sm text-slate-500">{subtitle}</p> : null}
    </div>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button key={tab.value} className={cx("btn", active === tab.value ? "btn-primary" : "btn-neutral")} onClick={() => onChange(tab.value)}>
          {tab.label}
          {tab.count !== undefined ? <span className={cx("pill", active === tab.value ? "bg-white text-brand-blue" : "bg-white text-slate-500")}>{tab.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

function ErrorNotice({ error }) {
  if (!error) return null;
  return (
    <div className="mb-4 flex items-start gap-2 rounded-lg border border-status-danger bg-surface-danger p-3 text-sm font-semibold text-status-danger">
      <AlertCircle size={18} />
      {error.message || String(error)}
    </div>
  );
}

function AppShell({ children }) {
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const links = {
    student: [
      ["/search", "Search"],
      ["/bookings", "My Bookings"],
      ["/messages", "Messages"],
      ["/progress", "Progress"],
      ["/invoices", "Invoices"]
    ],
    tutor: [
      ["/tutor/dashboard", "Dashboard"],
      ["/messages", "Messages"],
      ["/tutor/materials", "Materials"],
      ["/tutor/earnings", "Earnings"]
    ],
    admin: [["/admin", "Admin"]]
  };

  return (
    <>
      <header className="top-nav">
        <div className="nav-inner">
          <Logo />
          <nav className="nav-links">
            {(links[user?.role] || []).map(([path, label]) => (
              <NavLink key={path} to={path} className={({ isActive }) => cx("nav-link", isActive && "active")}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="nav-actions">
            <button
              className="nav-signout"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Sign Out
            </button>
            <div className="relative">
              <button className="profile-trigger" onClick={() => setOpen((value) => !value)} aria-label="Open profile menu">
                <Avatar user={user} />
                <ChevronDown size={16} />
              </button>
              {open ? (
                <div className="dropdown">
                <div className="bg-surface-info p-4">
                  <p className="font-extrabold">{user.name}</p>
                  <p className="text-xs font-semibold capitalize text-slate-500">{user.role}</p>
                </div>
                <button className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-bold hover:bg-surface-shell" onClick={() => navigate("/profile")}>
                  <User size={16} /> My Profile
                </button>
                <button className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-bold hover:bg-surface-shell" onClick={() => navigate("/portal-select")}>
                  <LayoutDashboard size={16} /> Switch Portal
                </button>
                <button
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-bold text-status-danger hover:bg-surface-danger"
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>
      <main className="app-grid">{children}</main>
    </>
  );
}

function ProtectedRoute({ roles, children }) {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={roleHome[user.role] || "/login"} replace />;
  return <AppShell>{children}</AppShell>;
}

function LandingPage() {
  const { user } = useAuthStore();
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-surface-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Logo />
          <div className="flex gap-3">
            <Link className="btn btn-neutral" to="/login">Log In</Link>
            <Link className="btn btn-primary" to={user ? roleHome[user.role] : "/register"}>Sign Up Free</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <section>
          <Badge tone="student">Student and tutor portals</Badge>
          <h1 className="mt-5 text-5xl font-extrabold leading-tight text-brand-navy">SmartTutor</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Find verified tutors, book sessions, message in real time, share materials, track progress, and manage payments through one role-gated learning platform.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="btn btn-primary rounded-[10px] px-5" to="/register">Create Account</Link>
            <Link className="btn btn-secondary rounded-[10px] px-5" to="/login">Log In</Link>
          </div>
        </section>
        <section className="hero-visual p-6">
          <div className="relative z-10 grid gap-4">
            <div className="rounded-xl bg-white p-5 text-slate-900 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar user={{ avatar: "MS" }} />
                  <div>
                    <p className="font-extrabold">Dr. Maya Singh</p>
                    <p className="text-xs font-semibold text-slate-500">Mathematics · Physics</p>
                  </div>
                </div>
                <Badge tone="success">Verified</Badge>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-surface-info p-3"><p className="font-extrabold">4.9</p><p className="text-xs text-slate-500">Rating</p></div>
                <div className="rounded-lg bg-surface-info p-3"><p className="font-extrabold">$45</p><p className="text-xs text-slate-500">Per hour</p></div>
                <div className="rounded-lg bg-surface-info p-3"><p className="font-extrabold">128</p><p className="text-xs text-slate-500">Reviews</p></div>
              </div>
            </div>
            <div className="ml-8 rounded-xl bg-white/95 p-5 text-slate-900 shadow-xl">
              <p className="font-extrabold">Booking Submitted!</p>
              <p className="mt-2 text-sm text-slate-500">Reference ST-1003 · Online session · Aug 3, 4:00 PM</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function AuthLayout({ children }) {
  return (
    <div className="auth-shell">
      <div className="auth-card card p-7">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        {children}
      </div>
    </div>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [role, setRole] = useState("student");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const mutation = useMutation({
    mutationFn: () => {
      if (form.password !== form.confirm) throw new Error("Passwords must match");
      return api("/auth/register", { method: "POST", body: { ...form, role } });
    },
    onSuccess: (data) => {
      setSession(data);
      navigate("/portal-select");
    }
  });

  return (
    <AuthLayout>
      <h1 className="text-center text-3xl font-extrabold">Create Account</h1>
      <p className="mt-2 text-center text-sm text-slate-500">Choose a role and start using SmartTutor.</p>
      <ErrorNotice error={mutation.error} />
      <form
        className="mt-6 grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          {["student", "tutor"].map((item) => (
            <button key={item} type="button" className={cx("card p-4 text-left font-extrabold capitalize", role === item && "border-brand-blue bg-surface-info text-brand-blue")} onClick={() => setRole(item)}>
              {item}
              <span className="mt-1 block text-xs font-semibold text-slate-500">{item === "student" ? "Book and learn" : "Teach and earn"}</span>
            </button>
          ))}
        </div>
        <Field label="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        <Field label="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
        <Field label="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
        <Field label="Confirm password" type="password" value={form.confirm} onChange={(event) => setForm({ ...form, confirm: event.target.value })} required />
        <Button disabled={mutation.isPending}>Create Account</Button>
        <Button type="button" variant="neutral">Continue with Google</Button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500">Already registered? <Link className="font-bold text-brand-blue" to="/login">Log in</Link></p>
    </AuthLayout>
  );
}

function LoginPage({ admin = false }) {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [form, setForm] = useState({ email: admin ? "admin@smarttutor.local" : "", password: "" });
  const mutation = useMutation({
    mutationFn: () => api("/auth/login", { method: "POST", body: form }),
    onSuccess: (data) => {
      if (admin && data.user.role !== "admin") throw new Error("Use an admin account to continue");
      setSession(data);
      navigate(roleHome[data.user.role]);
    }
  });

  return (
    <AuthLayout>
      <h1 className="text-center text-3xl font-extrabold">{admin ? "Admin Login" : "Log In"}</h1>
      <ErrorNotice error={mutation.error} />
      <form
        className="mt-6 grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <Field label="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} error={mutation.error?.details?.credentials} required />
        <Field label="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} error={mutation.error?.details?.credentials} required />
        {!admin ? <Link className="text-right text-sm font-bold text-brand-blue" to="/forgot-password">Forgot password?</Link> : null}
        <Button disabled={mutation.isPending}>Log In</Button>
        {!admin ? <Button type="button" variant="neutral">Continue with Google</Button> : null}
      </form>
      <div className="mt-5 flex justify-between text-sm">
        <Link className="font-bold text-brand-blue" to="/register">Create account</Link>
        {!admin ? <Link className="font-bold text-brand-blue" to="/admin-login">Admin login</Link> : <Link className="font-bold text-brand-blue" to="/login">User login</Link>}
      </div>
    </AuthLayout>
  );
}

function ResetPage() {
  const { token } = useParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      token
        ? api(`/auth/reset-password/${token}`, { method: "POST", body: { password } })
        : api("/auth/forgot-password", { method: "POST", body: { email } })
  });
  return (
    <AuthLayout>
      <h1 className="text-center text-3xl font-extrabold">Password Reset</h1>
      {mutation.isSuccess ? <div className="mt-5 rounded-lg bg-surface-success p-3 text-sm font-bold text-status-success">{mutation.data.message}</div> : null}
      <ErrorNotice error={mutation.error} />
      <form
        className="mt-6 grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        {token ? (
          <Field label="New password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        ) : (
          <Field label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        )}
        <Button disabled={mutation.isPending}>{token ? "Set New Password" : "Send Reset Link"}</Button>
      </form>
      <Link className="mt-5 block text-center text-sm font-bold text-brand-blue" to="/login">Back to login</Link>
    </AuthLayout>
  );
}

function PortalSelectPage() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  const portals = [
    { role: "student", label: "Student Portal", text: "Find tutors, book sessions, and track progress." },
    { role: "tutor", label: "Tutor Portal", text: "Manage bookings, materials, and earnings." },
    { role: "admin", label: "Admin Portal", text: "Review users, payments, and reports." }
  ].filter((item) => item.role !== "admin" || user.role === "admin");
  return (
    <AuthLayout>
      <h1 className="text-center text-3xl font-extrabold">Choose your portal</h1>
      <div className="mt-6 grid gap-3">
        {portals.map((portal) => (
          <Link key={portal.role} to={roleHome[portal.role]} className="card p-5 hover:border-brand-blue">
            <p className="font-extrabold">{portal.label}</p>
            <p className="mt-1 text-sm text-slate-500">{portal.text}</p>
          </Link>
        ))}
      </div>
    </AuthLayout>
  );
}

function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({
    name: user.name || "",
    phone: user.phone || "",
    bio: user.bio || "",
    price: user.price || "",
    subjects: (user.subjects || []).join(", ")
  });
  const mutation = useMutation({
    mutationFn: () =>
      api("/auth/me", {
        method: "PATCH",
        body: { ...form, price: form.price ? Number(form.price) : undefined, subjects: form.subjects.split(",").map((item) => item.trim()).filter(Boolean) }
      }),
    onSuccess: (data) => updateUser(data.user)
  });

  return (
    <>
      <PageTitle title="My Profile" subtitle="Profile details persist through the auth API and feed role-specific screens." />
      <section className="card max-w-3xl p-6">
        <ErrorNotice error={mutation.error} />
        {mutation.isSuccess ? <div className="mb-4 rounded-lg bg-surface-success p-3 text-sm font-bold text-status-success">Profile updated.</div> : null}
        <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
          <Field label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <Field label="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          <Field label="Subjects" value={form.subjects} onChange={(event) => setForm({ ...form, subjects: event.target.value })} />
          {user.role === "tutor" ? <Field label="Hourly rate" type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /> : null}
          <TextArea label="Bio" value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} />
          <Button disabled={mutation.isPending}>Save Profile</Button>
        </form>
      </section>
    </>
  );
}

const searchSubjects = ["Mathematics", "Physics", "Chemistry", "English", "History", "Computer Science"];
const searchLanguages = ["English", "Hindi", "Mandarin", "Spanish"];

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="search-filter">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{label}</option>
        {options.map((option) => (
          <option key={option.value || option} value={option.value || option}>{option.label || option}</option>
        ))}
      </select>
    </label>
  );
}

function tutorBadges(tutor) {
  return [
    Number(tutor.rating || 0) >= 4.8 ? "Top Rated" : null,
    tutor.qualifications?.some((item) => item.toLowerCase().includes("phd")) ? "Expert" : null
  ].filter(Boolean);
}

function tutorExperience(tutor) {
  const match = tutor.bio?.match(/(\d+)\s+years?/i);
  return match ? `${match[1]} yrs experience` : "Experienced tutor";
}

function TutorSearchPage() {
  const [filters, setFilters] = useState({
    q: "",
    subject: "",
    maxPrice: "",
    minRating: "",
    availability: "",
    language: "",
    sort: "relevance"
  });
  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const queryString = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, value]) => value))).toString();
  const { data, isLoading } = useQuery({ queryKey: ["tutors", filters], queryFn: () => api(`/tutors?${queryString}`) });
  const tutors = data?.tutors || [];

  return (
    <div className="tutor-search-page">
      <form className="search-toolbar" onSubmit={(event) => event.preventDefault()}>
        <label className="search-input">
          <span className="sr-only">Search by subject or tutor name</span>
          <Search size={16} />
          <input value={filters.q} onChange={(event) => updateFilter("q", event.target.value)} placeholder="Search by subject, tutor name..." />
        </label>
        <Button className="search-submit" type="submit">Search</Button>
        <FilterSelect label="Subject" value={filters.subject} onChange={(value) => updateFilter("subject", value)} options={searchSubjects} />
        <FilterSelect label="Price" value={filters.maxPrice} onChange={(value) => updateFilter("maxPrice", value)} options={[
          { label: "Under $50", value: "50" },
          { label: "Under $60", value: "60" },
          { label: "Under $70", value: "70" }
        ]} />
        <FilterSelect label="Rating" value={filters.minRating} onChange={(value) => updateFilter("minRating", value)} options={[
          { label: "4.5+", value: "4.5" },
          { label: "4.8+", value: "4.8" },
          { label: "4.9+", value: "4.9" }
        ]} />
        <FilterSelect label="Availability" value={filters.availability} onChange={(value) => updateFilter("availability", value)} options={[
          { label: "Any open slot", value: "available" },
          { label: "Online", value: "online" },
          { label: "In-Person", value: "in-person" }
        ]} />
        <FilterSelect label="Language" value={filters.language} onChange={(value) => updateFilter("language", value)} options={searchLanguages} />
      </form>

      <div className="search-summary">
        <p>{isLoading ? "Loading tutors" : `${data?.total || 0} tutors found`}</p>
        <label>
          <span>Sort by:</span>
          <select value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value)}>
            <option value="relevance">Relevance</option>
            <option value="rating">Rating</option>
            <option value="price">Price</option>
          </select>
        </label>
      </div>

      <div className="tutor-card-grid">
        {tutors.map((tutor) => {
          const badges = tutorBadges(tutor);
          return (
            <article key={tutor.id} className="tutor-result-card">
              <div className="tutor-card-top">
                <Avatar user={tutor} />
                <div className="tutor-card-identity">
                  <h2>{tutor.name}</h2>
                  <p>{tutor.subjects?.join(" • ")}</p>
                  <p className="tutor-rating"><Star size={13} fill="currentColor" /> {tutor.rating} ({tutor.reviewCount} reviews)</p>
                  <p className="tutor-experience">{tutorExperience(tutor)}</p>
                </div>
                {badges.length ? (
                  <div className="tutor-card-badges">
                    {badges.map((badge) => <span key={badge} className="search-badge">{badge}</span>)}
                  </div>
                ) : null}
              </div>
              <div className="tutor-card-divider" />
              <div className="tutor-card-actions">
                <div>
                  <p className="tutor-price">${tutor.price}/hr</p>
                  <p className="tutor-rate-label">per hour</p>
                </div>
                <Link className="btn btn-primary tutor-profile-link" to={`/tutors/${tutor.id}`}>View Profile</Link>
              </div>
            </article>
          );
        })}
      </div>

      {!isLoading && tutors.length === 0 ? (
        <section className="empty-state">
          <h2>No tutors match these filters</h2>
          <p>Try broadening the subject, price, rating, availability, or language filters.</p>
        </section>
      ) : null}
    </div>
  );
}
function BookingWidget({ tutor, availability }) {
  const [slotId, setSlotId] = useState(availability?.[0]?.id || "");
  const [mode, setMode] = useState("Online");
  const [subject, setSubject] = useState(tutor.subjects?.[0] || "");
  const [confirmed, setConfirmed] = useState(null);
  const queryClient = useQueryClient();
  const selected = availability.find((slot) => slot.id === slotId);
  const mutation = useMutation({
    mutationFn: () =>
      api("/bookings", {
        method: "POST",
        body: { tutorId: tutor.id, subject, date: selected.date, startTime: selected.startTime, endTime: selected.endTime, mode }
      }),
    onSuccess: (data) => {
      setConfirmed(data.booking);
      queryClient.invalidateQueries({ queryKey: ["tutor", tutor.id] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    }
  });

  return (
    <aside className="card p-5">
      <h2 className="text-xl font-extrabold">Book a Session</h2>
      <ErrorNotice error={mutation.error} />
      <div className="mt-4 grid gap-3">
        <label>
          <span className="mb-2 block text-sm font-bold">Available slot</span>
          <select className="field" value={slotId} onChange={(event) => setSlotId(event.target.value)}>
            {availability.map((slot) => <option key={slot.id} value={slot.id}>{slot.date} · {slot.startTime}</option>)}
          </select>
        </label>
        <label>
          <span className="mb-2 block text-sm font-bold">Subject</span>
          <select className="field" value={subject} onChange={(event) => setSubject(event.target.value)}>
            {tutor.subjects?.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {["Online", "In-Person"].map((item) => (
            <button key={item} type="button" className={cx("btn", mode === item ? "btn-primary" : "btn-neutral")} onClick={() => setMode(item)}>{item}</button>
          ))}
        </div>
        <div className="rounded-xl bg-surface-shell p-4 text-sm">
          <p className="font-extrabold">Review & Confirm</p>
          <p className="mt-1 text-slate-500">{selected ? `${selected.date}, ${selected.startTime}-${selected.endTime}` : "No slots available"}</p>
          <p className="mt-1 text-slate-500">${tutor.price} · {subject}</p>
        </div>
        <Button disabled={!selected || mutation.isPending} onClick={() => mutation.mutate()}>Continue to Book</Button>
      </div>
      {confirmed ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/45 p-4">
          <div className="card max-w-md p-7 text-center shadow-lg">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface-success text-status-success"><Check size={30} /></div>
            <h3 className="mt-4 text-2xl font-extrabold">Booking Submitted!</h3>
            <p className="mt-2 text-sm text-slate-500">Reference {confirmed.reference}</p>
            <Link className="btn btn-primary mt-5" to="/bookings">Go to My Bookings</Link>
          </div>
        </div>
      ) : null}
    </aside>
  );
}

function TutorProfilePage() {
  const { id } = useParams();
  const [tab, setTab] = useState("overview");
  const { data, isLoading } = useQuery({ queryKey: ["tutor", id], queryFn: () => api(`/tutors/${id}`) });
  if (isLoading) return <p>Loading tutor profile...</p>;
  const { tutor, availability, reviews } = data;
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex gap-4">
              <Avatar user={tutor} />
              <div>
                <h1 className="text-3xl font-extrabold">{tutor.name}</h1>
                <p className="mt-1 font-semibold text-slate-500">{tutor.subjects?.join(" · ")}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="success">Verified</Badge>
                  <Badge tone="warning"><Star size={12} fill="currentColor" /> {tutor.rating} ({tutor.reviewCount})</Badge>
                </div>
              </div>
            </div>
            <Button variant="secondary"><MessageSquare size={17} /> Message</Button>
          </div>
          <Tabs tabs={[{ label: "Overview", value: "overview" }, { label: "Reviews", value: "reviews" }, { label: "Availability", value: "availability" }]} active={tab} onChange={setTab} />
          {tab === "overview" ? (
            <div className="grid gap-5">
              <section><h2 className="text-xl font-extrabold">About</h2><p className="mt-2 text-slate-600">{tutor.bio}</p></section>
              <section><h2 className="text-xl font-extrabold">Qualifications</h2><ul className="mt-2 grid gap-2">{tutor.qualifications?.map((item) => <li key={item} className="rounded-lg bg-surface-shell p-3 text-sm font-semibold">{item}</li>)}</ul></section>
              <section><h2 className="text-xl font-extrabold">Subjects</h2><div className="mt-2 flex flex-wrap gap-2">{tutor.subjects?.map((item) => <Badge key={item} tone="student">{item}</Badge>)}</div></section>
            </div>
          ) : null}
          {tab === "reviews" ? (
            <div className="grid gap-3">
              {reviews.length ? reviews.map((review) => (
                <article key={review.id} className="rounded-xl bg-surface-shell p-4">
                  <p className="font-bold text-status-warning">{"★".repeat(review.rating)}</p>
                  <p className="mt-2 text-sm text-slate-600">{review.comment}</p>
                  <p className="mt-2 text-xs font-bold text-slate-500">{review.student.name}</p>
                </article>
              )) : <p className="text-sm text-slate-500">No reviews yet.</p>}
            </div>
          ) : null}
          {tab === "availability" ? <div className="grid gap-2">{availability.map((slot) => <div key={slot.id} className="rounded-lg bg-surface-info p-3 text-sm font-bold text-brand-blue">{slot.date} · {slot.startTime}-{slot.endTime} · {slot.mode}</div>)}</div> : null}
        </section>
        <BookingWidget tutor={tutor} availability={availability} />
      </div>
    </>
  );
}

function BookingsPage() {
  const [status, setStatus] = useState("all");
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["bookings", status], queryFn: () => api(`/bookings?status=${status}`) });
  const mutation = useMutation({
    mutationFn: ({ id, action }) => api(`/bookings/${id}/${action}`, { method: "PATCH", body: { reason: "Managed from My Bookings" } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings"] })
  });
  const rows = useMemo(() => data?.bookings || [], [data?.bookings]);
  const counts = useMemo(() => {
    const all = rows.length;
    return { all, pending: rows.filter((b) => b.status === "pending").length, confirmed: rows.filter((b) => b.status === "confirmed").length, completed: rows.filter((b) => b.status === "completed").length, cancelled: rows.filter((b) => b.status === "cancelled").length };
  }, [rows]);
  return (
    <>
      <PageTitle title="My Bookings" subtitle="Manage upcoming, pending, completed, and cancelled sessions." />
      <Tabs tabs={["all", "pending", "confirmed", "completed", "cancelled"].map((value) => ({ value, label: value, count: counts[value] }))} active={status} onChange={setStatus} />
      <div className="grid gap-3">
        {rows.map((booking) => (
          <article key={booking.id} className="card flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <div className="flex flex-wrap items-center gap-2"><h2 className="font-extrabold">{booking.subject}</h2><StatusBadge status={booking.status} /></div>
              <p className="mt-1 text-sm text-slate-500">{booking.tutor.name} · {booking.date} · {booking.startTime} · {booking.reference}</p>
            </div>
            <div className="flex gap-2">
              {booking.status !== "cancelled" && booking.status !== "completed" ? <Button variant="danger" onClick={() => mutation.mutate({ id: booking.id, action: "cancel" })}>Cancel</Button> : null}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function MessagesPage() {
  const [selected, setSelected] = useState(null);
  const [body, setBody] = useState("");
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const conversations = useQuery({ queryKey: ["conversations"], queryFn: () => api("/messages/conversations") });
  const activeId = selected || conversations.data?.conversations?.[0]?.id;
  const messages = useQuery({ queryKey: ["messages", activeId], queryFn: () => api(`/messages/conversations/${activeId}/messages`), enabled: Boolean(activeId) });
  const sendMutation = useMutation({
    mutationFn: () => api(`/messages/conversations/${activeId}/messages`, { method: "POST", body: { body } }),
    onSuccess: () => {
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["messages", activeId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  });
  const flagMutation = useMutation({ mutationFn: (id) => api(`/messages/messages/${id}/flag`, { method: "POST", body: { reason: "Flagged from chat" } }) });
  return (
    <>
      <PageTitle title="Messages" subtitle="Conversation inbox, unread state, live-presence contract, reporting, and chat send flow." />
      <div className="grid min-h-[620px] gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="card overflow-hidden">
          <div className="border-b border-surface-border p-4"><Field label="Search conversations" placeholder="Search" /></div>
          {(conversations.data?.conversations || []).map((conversation) => (
            <button key={conversation.id} className={cx("flex w-full gap-3 border-b border-surface-border p-4 text-left hover:bg-surface-shell", activeId === conversation.id && "bg-surface-info")} onClick={() => setSelected(conversation.id)}>
              <Avatar user={conversation.participant} />
              <span className="min-w-0 flex-1">
                <span className="block font-extrabold">{conversation.participant.name}</span>
                <span className="block truncate text-sm text-slate-500">{conversation.lastMessage?.body}</span>
              </span>
              {conversation.unreadCount ? <Badge tone="warning">{conversation.unreadCount}</Badge> : null}
            </button>
          ))}
        </aside>
        <section className="card flex min-h-[620px] flex-col overflow-hidden">
          <div className="border-b border-surface-border p-4 font-extrabold">Chat Window</div>
          <div className="flex-1 space-y-3 overflow-y-auto bg-surface-shell p-4">
            {(messages.data?.messages || []).map((message) => {
              const mine = message.senderId === user.id;
              return (
                <div key={message.id} className={cx("flex", mine ? "justify-end" : "justify-start")}>
                  <div className={cx("max-w-[78%] rounded-2xl p-3 text-sm", mine ? "bg-brand-blue text-white" : "bg-white text-slate-700")}>
                    <p>{message.body}</p>
                    {!mine ? <button className="mt-2 text-xs font-bold text-status-danger" onClick={() => flagMutation.mutate(message.id)}>Flag</button> : null}
                  </div>
                </div>
              );
            })}
          </div>
          <form className="flex gap-2 border-t border-surface-border p-4" onSubmit={(event) => { event.preventDefault(); if (body.trim()) sendMutation.mutate(); }}>
            <input className="field" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Type a message" />
            <Button><Send size={17} /> Send</Button>
          </form>
        </section>
      </div>
    </>
  );
}

function TutorDashboardPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["tutor-bookings"], queryFn: () => api("/bookings") });
  const mutation = useMutation({
    mutationFn: ({ id, action }) => api(`/bookings/${id}/${action}`, { method: "PATCH", body: { notes: "Completed from dashboard" } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tutor-bookings"] })
  });
  const bookings = data?.bookings || [];
  const pending = bookings.filter((booking) => booking.status === "pending");
  const today = bookings.filter((booking) => booking.status === "confirmed" && booking.date === "2026-07-31");
  return (
    <>
      <PageTitle title="Tutor Dashboard" subtitle="Pending booking requests and today's confirmed schedule." />
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 text-xl font-extrabold">Pending Requests</h2>
          <div className="grid gap-3">
            {pending.map((booking) => (
              <article key={booking.id} className="rounded-xl border border-surface-border p-4">
                <div className="flex items-center justify-between gap-3"><p className="font-extrabold">{booking.student.name}</p><StatusBadge status={booking.status} /></div>
                <p className="mt-1 text-sm text-slate-500">{booking.subject} · {booking.date} · {booking.startTime}</p>
                <div className="mt-3 flex gap-2">
                  <Button variant="success" onClick={() => mutation.mutate({ id: booking.id, action: "accept" })}>Accept</Button>
                  <Button variant="danger" onClick={() => mutation.mutate({ id: booking.id, action: "reject" })}>Decline</Button>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="card p-5">
          <h2 className="mb-4 text-xl font-extrabold">Today's Schedule</h2>
          <div className="grid gap-3">
            {today.map((booking) => (
              <article key={booking.id} className="rounded-xl border border-surface-border p-4">
                <p className="font-extrabold">{booking.subject} with {booking.student.name}</p>
                <p className="mt-1 text-sm text-slate-500">{booking.startTime}-{booking.endTime} · {booking.mode}</p>
                <Button className="mt-3" onClick={() => mutation.mutate({ id: booking.id, action: "complete" })}>Start Session</Button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function MaterialsPage() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const materials = useQuery({ queryKey: ["materials"], queryFn: () => api("/materials") });
  const uploadMutation = useMutation({
    mutationFn: () => {
      const form = new FormData();
      form.append("file", file);
      form.append("title", title || file.name);
      form.append("linkedStudentIds", "u-student");
      return api("/materials", { method: "POST", body: form });
    },
    onSuccess: () => {
      setFile(null);
      setTitle("");
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    }
  });
  const deleteMutation = useMutation({ mutationFn: (id) => api(`/materials/${id}`, { method: "DELETE" }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["materials"] }) });
  return (
    <>
      <PageTitle title="Tutor Materials" subtitle="Upload PDF, DOCX, PNG, or MP4 files up to 50MB and link them to students." />
      <section className="card mb-5 p-5">
        <ErrorNotice error={uploadMutation.error} />
        <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto]" onSubmit={(event) => { event.preventDefault(); if (file) uploadMutation.mutate(); }}>
          <Field label="Title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Revision worksheet" />
          <label className="block">
            <span className="mb-2 block text-sm font-bold">File</span>
            <input className="field" type="file" accept=".pdf,.docx,.png,.mp4" onChange={(event) => setFile(event.target.files?.[0])} />
          </label>
          <Button className="self-end" disabled={!file || uploadMutation.isPending}><FileUp size={17} /> Upload</Button>
        </form>
      </section>
      <section className="card table-wrap">
        <table>
          <thead><tr><th>File</th><th>Size</th><th>Date</th><th>Access</th><th></th></tr></thead>
          <tbody>
            {(materials.data?.materials || []).map((material) => (
              <tr key={material.id}>
                <td className="font-bold">{material.title}</td>
                <td>{Math.round(material.size / 1024)} KB</td>
                <td>{material.createdAt.slice(0, 10)}</td>
                <td>{material.public ? "Public" : `${material.linkedStudentIds.length} linked`}</td>
                <td><Button variant="danger" onClick={() => window.confirm("Delete this material?") && deleteMutation.mutate(material.id)}>Delete</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

function StudentProgressPage() {
  const { data } = useQuery({ queryKey: ["student-progress"], queryFn: () => api("/progress/student") });
  return (
    <>
      <PageTitle title="Student Progress" subtitle="Calculated from completed bookings and tutor session notes." />
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <StatCard label="Completed Sessions" value={data?.stats.completedSessions || 0} icon={BookOpen} />
        <StatCard label="Active Subjects" value={data?.stats.activeSubjects || 0} icon={GraduationCap} />
        <StatCard label="Average Progress" value={`${data?.stats.averageProgress || 0}%`} icon={Star} />
      </div>
      <section className="card p-5">
        <h2 className="text-xl font-extrabold">Subject Progress</h2>
        <div className="mt-4 grid gap-4">
          {(data?.subjects || []).map((subject) => (
            <div key={subject.subject}>
              <div className="flex justify-between text-sm font-bold"><span>{subject.subject}</span><span>{subject.progress}%</span></div>
              <div className="mt-2 h-3 rounded-full bg-surface-shell"><div className="h-3 rounded-full bg-brand-blue" style={{ width: `${subject.progress}%` }} /></div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function EarningsPage() {
  const { data } = useQuery({ queryKey: ["earnings"], queryFn: () => api("/progress/earnings") });
  const max = Math.max(...(data?.monthly || []).map((item) => item.amount), 1);
  return (
    <>
      <PageTitle title="Tutor Earnings" subtitle="Reads from the shared Transaction collection." />
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <StatCard label="Total Earnings" value={`$${data?.stats.totalEarnings || 0}`} icon={Wallet} />
        <StatCard label="Paid Sessions" value={data?.stats.paidSessions || 0} icon={Calendar} />
        <StatCard label="Average Session" value={`$${data?.stats.averageSession || 0}`} icon={Star} />
      </div>
      <section className="card p-5">
        <h2 className="text-xl font-extrabold">Monthly Earnings</h2>
        <div className="mt-5 flex h-48 items-end gap-4">
          {(data?.monthly || []).map((item) => <div key={item.month} className="grid flex-1 gap-2 text-center text-xs font-bold"><div className="chart-bar mx-auto w-full" style={{ height: `${Math.max(12, (item.amount / max) * 150)}px` }} /><span>{item.month}</span></div>)}
        </div>
      </section>
    </>
  );
}

function InvoicesPage() {
  const { token } = useAuthStore();
  const { data } = useQuery({ queryKey: ["invoices"], queryFn: () => api("/progress/invoices") });
  async function download(id) {
    const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000/api"}/progress/invoices/${id}/download`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <PageTitle title="Student Invoices" subtitle="Download real receipt data generated from paid transactions." />
      <section className="card mb-5 p-5">
        <p className="text-sm font-semibold text-slate-500">Total paid</p>
        <p className="mt-1 text-3xl font-extrabold">${data?.total || 0}</p>
      </section>
      <section className="card table-wrap">
        <table>
          <thead><tr><th>Invoice</th><th>Tutor</th><th>Subject</th><th>Date</th><th>Amount</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {(data?.invoices || []).map((invoice) => (
              <tr key={invoice.id}>
                <td className="font-bold">{invoice.id}</td>
                <td>{invoice.tutor.name}</td>
                <td>{invoice.subject}</td>
                <td>{invoice.createdAt.slice(0, 10)}</td>
                <td>${invoice.amount}</td>
                <td><StatusBadge status={invoice.status} /></td>
                <td><Button variant="secondary" onClick={() => download(invoice.id)}><Download size={16} /> CSV</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [role, setRole] = useState("all");
  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: () => api("/admin/stats") });
  const users = useQuery({ queryKey: ["admin-users", role], queryFn: () => api(`/admin/users?role=${role}`) });
  const transactions = useQuery({ queryKey: ["admin-transactions"], queryFn: () => api("/admin/transactions") });
  const reports = useQuery({ queryKey: ["admin-reports"], queryFn: () => api("/admin/reports") });
  const userMutation = useMutation({
    mutationFn: ({ id, active }) => api(`/admin/users/${id}`, { method: "PATCH", body: { active } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] })
  });
  return (
    <>
      <PageTitle title="Admin Dashboard" subtitle="Overview, user management, payment management, and flagged-message reports." />
      <div className="mb-5 grid gap-4 md:grid-cols-4">
        <StatCard label="Total Users" value={stats.data?.totalUsers || 0} icon={User} />
        <StatCard label="Active Tutors" value={stats.data?.activeTutors || 0} icon={GraduationCap} />
        <StatCard label="Sessions" value={stats.data?.sessions || 0} icon={Calendar} />
        <StatCard label="Platform Revenue" value={`$${stats.data?.platformRevenue || 0}`} icon={Wallet} />
      </div>
      <section className="card mb-5 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold">User Management</h2>
          <Tabs tabs={["all", "student", "tutor", "admin"].map((value) => ({ value, label: value }))} active={role} onChange={setRole} />
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th></th></tr></thead>
            <tbody>
              {(users.data?.users || []).map((item) => (
                <tr key={item.id}>
                  <td><span className="flex items-center gap-2"><Avatar user={item} /> <b>{item.name}</b></span></td>
                  <td>{item.email}</td>
                  <td><Badge tone={item.role === "student" ? "student" : "info"}>{item.role}</Badge></td>
                  <td><StatusBadge status={item.active ? "active" : "disabled"} /></td>
                  <td>{item.joinedAt}</td>
                  <td><Button variant={item.active ? "danger" : "success"} onClick={() => userMutation.mutate({ id: item.id, active: !item.active })}>{item.active ? "Disable" : "Enable"}</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="card mb-5 p-5">
        <h2 className="mb-4 text-xl font-extrabold">Payment Management</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Student</th><th>Tutor</th><th>Subject</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {(transactions.data?.transactions || []).map((transaction) => (
                <tr key={transaction.id}><td>{transaction.student.name}</td><td>{transaction.tutor.name}</td><td>{transaction.subject}</td><td>${transaction.amount}</td><td>{transaction.createdAt.slice(0, 10)}</td><td><StatusBadge status={transaction.status} /></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="card p-5">
        <h2 className="mb-4 text-xl font-extrabold">Reports</h2>
        {(reports.data?.reports || []).length ? reports.data.reports.map((report) => <div key={report.id} className="rounded-lg bg-surface-danger p-3 text-sm text-status-danger">{report.body}</div>) : <p className="text-sm text-slate-500">No flagged messages.</p>}
      </section>
    </>
  );
}

function App() {
  const { user } = useAuthStore();
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={roleHome[user.role]} replace /> : <LandingPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin-login" element={<LoginPage admin />} />
      <Route path="/forgot-password" element={<ResetPage />} />
      <Route path="/reset-password/:token" element={<ResetPage />} />
      <Route path="/portal-select" element={<PortalSelectPage />} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute roles={["student"]}><TutorSearchPage /></ProtectedRoute>} />
      <Route path="/tutors/:id" element={<ProtectedRoute roles={["student"]}><TutorProfilePage /></ProtectedRoute>} />
      <Route path="/bookings" element={<ProtectedRoute roles={["student"]}><BookingsPage /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute roles={["student", "tutor"]}><MessagesPage /></ProtectedRoute>} />
      <Route path="/progress" element={<ProtectedRoute roles={["student"]}><StudentProgressPage /></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute roles={["student"]}><InvoicesPage /></ProtectedRoute>} />
      <Route path="/tutor/dashboard" element={<ProtectedRoute roles={["tutor"]}><TutorDashboardPage /></ProtectedRoute>} />
      <Route path="/tutor/materials" element={<ProtectedRoute roles={["tutor"]}><MaterialsPage /></ProtectedRoute>} />
      <Route path="/tutor/earnings" element={<ProtectedRoute roles={["tutor"]}><EarningsPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminDashboardPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
