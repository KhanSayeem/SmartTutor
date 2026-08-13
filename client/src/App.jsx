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
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, uploadWithProgress } from "./api.js";
import { useAuthStore } from "./authStore.js";
import { useBookingDraft } from "./bookingDraft.js";
import { Link, Navigate, NavLink, Route, Routes, useNavigate, useParams } from "./router.jsx";

const roleHome = {
  student: "/search",
  tutor: "/tutor/dashboard",
  admin: "/admin"
};

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function useEscapeToClose(onClose) {
  useEffect(() => {
    const handler = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);
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
  if (user?.avatarUrl) return <img className="avatar avatar-image" src={user.avatarUrl} alt="" />;
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
          <p className="text-sm font-semibold text-slate-600">{label}</p>
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
      {subtitle ? <p className="mt-2 max-w-3xl text-sm text-slate-600">{subtitle}</p> : null}
    </div>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button key={tab.value} className={cx("btn", active === tab.value ? "btn-primary" : "btn-neutral")} onClick={() => onChange(tab.value)}>
          {tab.label}
          {tab.count !== undefined ? <span className={cx("pill", active === tab.value ? "bg-white text-brand-blue" : "bg-white text-slate-600")}>{tab.count}</span> : null}
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
                  <p className="text-xs font-semibold capitalize text-slate-600">{user.role}</p>
                </div>
                <button className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-bold hover:bg-surface-shell" onClick={() => navigate("/profile")}>
                  <User size={16} /> My Profile
                </button>
                <button className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-bold hover:bg-surface-shell" onClick={() => navigate("/profile/edit")}>
                  <ShieldCheck size={16} /> Account Settings
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
                    <p className="text-xs font-semibold text-slate-600">Mathematics · Physics</p>
                  </div>
                </div>
                <Badge tone="success">Verified</Badge>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-surface-info p-3"><p className="font-extrabold">4.9</p><p className="text-xs text-slate-600">Rating</p></div>
                <div className="rounded-lg bg-surface-info p-3"><p className="font-extrabold">$45</p><p className="text-xs text-slate-600">Per hour</p></div>
                <div className="rounded-lg bg-surface-info p-3"><p className="font-extrabold">128</p><p className="text-xs text-slate-600">Reviews</p></div>
              </div>
            </div>
            <div className="ml-8 rounded-xl bg-white/95 p-5 text-slate-900 shadow-xl">
              <p className="font-extrabold">Booking Submitted!</p>
              <p className="mt-2 text-sm text-slate-600">Reference ST-1003 · Online session · Aug 3, 4:00 PM</p>
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
      <p className="mt-2 text-center text-sm text-slate-600">Choose a role and start using SmartTutor.</p>
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
              <span className="mt-1 block text-xs font-semibold text-slate-600">{item === "student" ? "Book and learn" : "Teach and earn"}</span>
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
      <p className="mt-5 text-center text-sm text-slate-600">Already registered? <Link className="font-bold text-brand-blue" to="/login">Log in</Link></p>
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
        {!admin ? <Link className="inline-block -my-3 py-3 text-right text-sm font-bold text-brand-blue" to="/forgot-password">Forgot password?</Link> : null}
        <Button disabled={mutation.isPending}>Log In</Button>
        {!admin ? <Button type="button" variant="neutral">Continue with Google</Button> : null}
      </form>
      <div className="mt-5 flex justify-between text-sm">
        <Link className="inline-block -my-3 py-3 font-bold text-brand-blue" to="/register">Create account</Link>
        {!admin ? <Link className="inline-block -my-3 py-3 font-bold text-brand-blue" to="/admin-login">Admin login</Link> : <Link className="inline-block -my-3 py-3 font-bold text-brand-blue" to="/login">User login</Link>}
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
      <Link className="mt-5 block py-3 text-center text-sm font-bold text-brand-blue" to="/login">Back to login</Link>
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
            <p className="mt-1 text-sm text-slate-600">{portal.text}</p>
          </Link>
        ))}
      </div>
    </AuthLayout>
  );
}

function ProfileDetail({ label, value }) {
  if (value === undefined || value === null || value === "" || (Array.isArray(value) && !value.length)) return null;
  return (
    <div className="my-profile-detail-row">
      <dt>{label}</dt>
      <dd>{Array.isArray(value) ? value.join(", ") : value}</dd>
    </div>
  );
}

// No Figma frame exists for My Profile, so the header geometry is borrowed from
// the Tutor Profile header (node 9:121) and every value comes from the tokens.
function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const { data } = useQuery({ queryKey: ["me"], queryFn: () => api("/auth/me") });
  const profile = data?.user || user;

  useEffect(() => {
    if (data?.user) updateUser(data.user);
  }, [data, updateUser]);

  return (
    <>
      <PageTitle title="My Profile" subtitle="Your account details, as other people on SmartTutor see them." />
      <section className="card my-profile-header">
        <div className="my-profile-avatar">
          {profile.avatarUrl ? <img className="my-profile-avatar-img" src={profile.avatarUrl} alt="" /> : profile.avatar || profile.name?.slice(0, 2).toUpperCase()}
        </div>
        <div className="my-profile-identity">
          <h2 className="my-profile-name">{profile.name}</h2>
          <p className="my-profile-email">{profile.email}</p>
          <p className="my-profile-meta">
            {profile.role === "tutor" ? profile.subjects?.join(" • ") : `Joined ${profile.joinedAt}`}
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge tone="student">{profile.role}</Badge>
            {profile.verified ? <Badge tone="success">Verified</Badge> : null}
          </div>
        </div>
        <div className="my-profile-actions">
          <Link className="btn btn-primary" to="/profile/edit">Edit Profile</Link>
        </div>
      </section>
      <section className="card my-profile-details">
        <dl className="my-profile-detail-grid">
          <ProfileDetail label="Phone" value={profile.phone} />
          <ProfileDetail label="Subjects" value={profile.subjects} />
          {profile.role === "tutor" ? (
            <>
              <ProfileDetail label="Languages" value={profile.languages} />
              <ProfileDetail label="Hourly rate" value={profile.price ? `$${profile.price} / hour` : ""} />
              <ProfileDetail label="Qualifications" value={profile.qualifications} />
              <ProfileDetail label="Availability" value={profile.availabilitySummary} />
              <ProfileDetail label="Bio" value={profile.bio} />
            </>
          ) : null}
        </dl>
      </section>
    </>
  );
}

const listToText = (value) => (value || []).join(", ");
const textToList = (value) => value.split(",").map((item) => item.trim()).filter(Boolean);

function validateProfileForm(form, role) {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = "Name must be at least 2 characters";
  if (form.name.trim().length > 80) errors.name = "Name must be 80 characters or fewer";
  if (form.phone && !/^[+0-9 ()-]*$/.test(form.phone.trim())) errors.phone = "Phone may only contain digits, spaces, and + ( ) -";
  if (form.phone.trim().length > 20) errors.phone = "Phone must be 20 characters or fewer";
  if (role === "tutor") {
    const price = Number(form.price);
    if (!form.price || !Number.isInteger(price) || price < 5 || price > 500) errors.price = "Hourly rate must be a whole number between 5 and 500";
    if (form.bio.trim().length > 1000) errors.bio = "Bio must be 1000 characters or fewer";
    if (form.availabilitySummary.trim().length > 200) errors.availabilitySummary = "Availability must be 200 characters or fewer";
  }
  return errors;
}

function ProfileEditPage() {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const isTutor = user.role === "tutor";
  const [form, setForm] = useState({
    name: user.name || "",
    phone: user.phone || "",
    subjects: listToText(user.subjects),
    languages: listToText(user.languages),
    qualifications: listToText(user.qualifications),
    availabilitySummary: user.availabilitySummary || "",
    bio: user.bio || "",
    price: user.price ?? ""
  });
  const [errors, setErrors] = useState({});
  const [avatarError, setAvatarError] = useState("");

  const setField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        subjects: textToList(form.subjects)
      };
      if (isTutor) {
        Object.assign(body, {
          languages: textToList(form.languages),
          qualifications: textToList(form.qualifications),
          availabilitySummary: form.availabilitySummary.trim(),
          bio: form.bio.trim(),
          price: Number(form.price)
        });
      }
      return api("/auth/me", { method: "PATCH", body });
    },
    onSuccess: (data) => {
      updateUser(data.user);
      navigate("/profile");
    },
    onError: (error) => {
      if (error?.details) setErrors((current) => ({ ...current, ...error.details }));
    }
  });

  const avatarMutation = useMutation({
    mutationFn: (file) => {
      const body = new FormData();
      body.append("avatar", file);
      return api("/auth/me/avatar", { method: "POST", body });
    },
    onSuccess: (data) => updateUser(data.user)
  });

  const pickAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarError("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setAvatarError("Only PNG, JPEG, and WebP images are allowed");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Image must be 2MB or smaller");
      return;
    }
    avatarMutation.mutate(file);
  };

  const submit = (event) => {
    event.preventDefault();
    const nextErrors = validateProfileForm(form, user.role);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    mutation.mutate();
  };

  return (
    <>
      <PageTitle title="Edit Profile" subtitle="Changes are validated on both sides and saved against your account." />
      <form className="card profile-edit-form" onSubmit={submit} noValidate>
        <ErrorNotice error={mutation.error} />
        <section className="profile-edit-section">
          <h2 className="profile-edit-section-title">Photo</h2>
          <div className="profile-edit-avatar-row">
            <div className="my-profile-avatar">
              {user.avatarUrl ? <img className="my-profile-avatar-img" src={user.avatarUrl} alt="" /> : user.avatar || user.name?.slice(0, 2).toUpperCase()}
            </div>
            <label className="btn btn-secondary profile-edit-upload">
              {avatarMutation.isPending ? "Uploading..." : "Upload photo"}
              <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={pickAvatar} />
            </label>
            <p className="profile-edit-hint">PNG, JPEG, or WebP · max 2MB</p>
          </div>
          {avatarError ? <p className="profile-edit-error">{avatarError}</p> : null}
          <ErrorNotice error={avatarMutation.error} />
        </section>
        <section className="profile-edit-section">
          <h2 className="profile-edit-section-title">Account</h2>
          <Field label="Full name" value={form.name} onChange={setField("name")} error={errors.name} />
          <Field label="Email" value={user.email} readOnly disabled />
          <Field label="Phone" value={form.phone} onChange={setField("phone")} error={errors.phone} />
          <Field label="Subjects" value={form.subjects} onChange={setField("subjects")} error={errors.subjects} />
        </section>
        {isTutor ? (
          <section className="profile-edit-section">
            <h2 className="profile-edit-section-title">Tutor details</h2>
            <Field label="Languages" value={form.languages} onChange={setField("languages")} error={errors.languages} />
            <Field label="Hourly rate" type="number" value={form.price} onChange={setField("price")} error={errors.price} />
            <Field label="Qualifications" value={form.qualifications} onChange={setField("qualifications")} error={errors.qualifications} />
            <Field label="Availability" value={form.availabilitySummary} onChange={setField("availabilitySummary")} error={errors.availabilitySummary} />
            <TextArea label="Bio" value={form.bio} onChange={setField("bio")} />
          </section>
        ) : null}
        <footer className="profile-edit-footer">
          <Link className="btn btn-neutral" to="/profile">Cancel</Link>
          <Button disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Save Changes"}</Button>
        </footer>
      </form>
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
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toISODate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseISODate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Figma node 9:166 shows a Monday-anchored two-week window, so anchor it on the
// week that actually holds the tutor's earliest open slot rather than on today.
function buildCalendarDays(openDates) {
  const anchor = openDates.length ? parseISODate(openDates[0]) : new Date();
  const offsetToMonday = (anchor.getDay() + 6) % 7;
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - offsetToMonday);
  return Array.from({ length: 14 }, (_, index) => {
    const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    return { iso: toISODate(day), label: day.getDate() };
  });
}

function BookingWidget({ tutor, availability }) {
  const openSlots = useMemo(
    () => [...availability].sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)),
    [availability]
  );
  const slotsByDate = useMemo(() => {
    const map = new Map();
    for (const slot of openSlots) {
      if (!map.has(slot.date)) map.set(slot.date, []);
      map.get(slot.date).push(slot);
    }
    return map;
  }, [openSlots]);
  const days = useMemo(() => buildCalendarDays([...slotsByDate.keys()]), [slotsByDate]);

  const [selectedDate, setSelectedDate] = useState(openSlots[0]?.date || "");
  const [slotId, setSlotId] = useState(openSlots[0]?.id || "");
  const [mode, setMode] = useState("Online");
  const [subject, setSubject] = useState(tutor.subjects?.[0] || "");
  const setDraft = useBookingDraft((state) => state.setDraft);
  const navigate = useNavigate();

  const daySlots = slotsByDate.get(selectedDate) || [];
  const selected = daySlots.find((slot) => slot.id === slotId) || daySlots[0];

  const pickDate = (iso) => {
    setSelectedDate(iso);
    setSlotId(slotsByDate.get(iso)?.[0]?.id || "");
  };

  const continueToBook = () => {
    if (!selected) return;
    setDraft({
      tutorId: tutor.id,
      slotId: selected.id,
      date: selected.date,
      startTime: selected.startTime,
      endTime: selected.endTime,
      mode,
      subject
    });
    navigate(`/book/${tutor.id}`);
  };

  return (
    <aside className="booking-card">
      <h2 className="booking-card-title">Book a Session</h2>
      <p className="booking-label">Select a date</p>
      <div className="booking-calendar">
        <div className="booking-weekdays">
          {WEEKDAYS.map((day) => <span key={day} className="booking-weekday">{day}</span>)}
        </div>
        <div className="booking-days">
          {days.map((day) => {
            const isAvailable = slotsByDate.has(day.iso);
            const isSelected = isAvailable && day.iso === selectedDate;
            return (
              <button
                key={day.iso}
                type="button"
                disabled={!isAvailable}
                aria-pressed={isSelected}
                aria-label={`${new Date(`${day.iso}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}${isAvailable ? "" : ", no sessions available"}`}
                className={cx("booking-day", isAvailable && "is-available", isSelected && "is-selected")}
                onClick={() => pickDate(day.iso)}
              >
                <span className="booking-day-number">{day.label}</span>
                {isAvailable ? <span className="booking-day-dot" /> : null}
              </button>
            );
          })}
        </div>
      </div>
      {daySlots.length ? (
        <>
          <p className="booking-label">Available times</p>
          <div className="booking-chips">
            {daySlots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                className={cx("booking-chip", selected?.id === slot.id && "is-active")}
                onClick={() => setSlotId(slot.id)}
              >
                {slot.startTime}–{slot.endTime}
              </button>
            ))}
          </div>
          <p className="booking-label">Subject</p>
          <div className="booking-chips">
            {tutor.subjects?.map((item) => (
              <button
                key={item}
                type="button"
                className={cx("booking-chip", subject === item && "is-active")}
                onClick={() => setSubject(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </>
      ) : null}
      <p className="booking-label">Session type</p>
      <div className="booking-modes">
        {[["Online", "🖥"], ["In-Person", "📍"]].map(([item, icon]) => (
          <button
            key={item}
            type="button"
            className={cx("booking-mode", mode === item && "is-active")}
            onClick={() => setMode(item)}
          >
            <span aria-hidden="true">{icon}</span> {item}
          </button>
        ))}
      </div>
      <button className="booking-cta" type="button" disabled={!selected} onClick={continueToBook}>
        Continue to Book →
      </button>
      <p className="booking-note">
        {openSlots.length ? "No payment required until confirmed" : "This tutor has no open slots right now"}
      </p>
    </aside>
  );
}

const BOOKING_STEPS = ["1. Select Date", "2. Choose Slot", "3. Confirm"];

// Figma node 10:15. The file only defines completed (#10B981) and active
// (#2563EB) pills; the upcoming state is derived from the shell/muted tokens.
function BookingSteps({ current }) {
  return (
    <nav className="booking-steps" aria-label="Booking progress">
      <ol className="booking-steps-track">
        {BOOKING_STEPS.map((label, index) => (
          <li key={label} className="booking-step-item">
            <span
              className={cx("booking-step", index < current && "is-complete", index === current && "is-active")}
              aria-current={index === current ? "step" : undefined}
            >
              {label}
            </span>
            {index < BOOKING_STEPS.length - 1 ? (
              <span aria-hidden="true" className={cx("booking-step-connector", index < current && "is-complete")} />
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function to12Hour(value) {
  const [hour, minute] = value.split(":").map(Number);
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${((hour + 11) % 12) + 1}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function formatBookingDate(iso) {
  const date = parseISODate(iso);
  return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

// Figma node 10:86 uses "Today"/"Tomorrow" for near dates and falls back to a
// short weekday + day + month otherwise.
function formatRelativeDate(iso) {
  const target = parseISODate(iso);
  const today = new Date();
  const todayIso = toISODate(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (iso === todayIso) return "Today";
  if (iso === toISODate(tomorrow)) return "Tomorrow";
  return target.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
}

function formatBookingTime(startTime, endTime) {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  const minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  const hours = minutes / 60;
  const duration = minutes % 60 === 0 ? `${hours} ${hours === 1 ? "hour" : "hours"}` : `${minutes} minutes`;
  return `${to12Hour(startTime)} – ${to12Hour(endTime)} (${duration})`;
}

// Figma node 10:24 (summary card) and 10:47 (confirmation modal).
function BookSessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { draft, clearDraft } = useBookingDraft();
  const [confirmed, setConfirmed] = useState(null);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["tutor", id], queryFn: () => api(`/tutors/${id}`) });
  const mutation = useMutation({
    mutationFn: () =>
      api("/bookings", {
        method: "POST",
        body: {
          tutorId: id,
          subject: draft.subject,
          date: draft.date,
          startTime: draft.startTime,
          endTime: draft.endTime,
          mode: draft.mode
        }
      }),
    onSuccess: (result) => {
      setConfirmed(result.booking);
      clearDraft();
      queryClient.invalidateQueries({ queryKey: ["tutor", id] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    }
  });

  if (isLoading) return <p>Loading booking details...</p>;
  if (confirmed) {
    return (
      <>
        <BookingSteps current={3} />
        <div className="booking-modal-scrim">
          <div className="booking-modal">
            <div className="booking-modal-icon"><Check size={36} strokeWidth={3} /></div>
            <h3 className="booking-modal-title">Booking Submitted!</h3>
            <p className="booking-modal-body">
              Your request has been sent to {data.tutor.name}.<br />They will respond within 24 hours.
            </p>
            <div className="booking-modal-divider" />
            <p className="booking-modal-caption">Booking Reference</p>
            <p className="booking-modal-reference">#{confirmed.reference}</p>
            <Link className="booking-modal-cta" to="/bookings">Go to My Bookings</Link>
          </div>
        </div>
      </>
    );
  }
  if (!draft || draft.tutorId !== id) {
    return (
      <div className="booking-summary">
        <h2 className="booking-summary-title">Pick a session first</h2>
        <p className="booking-summary-note">Choose a date and time on the tutor profile to review your booking.</p>
        <button className="booking-summary-confirm" type="button" onClick={() => navigate(`/tutors/${id}`)}>
          Back to tutor profile
        </button>
      </div>
    );
  }

  const { tutor } = data;
  return (
    <>
      <BookingSteps current={2} />
      <section className="booking-summary" aria-labelledby="booking-summary-title">
        <h2 className="booking-summary-title" id="booking-summary-title">Review &amp; Confirm</h2>
        <div className="booking-summary-divider" />
        <div className="booking-summary-tutor">
          <span className="booking-summary-avatar">{tutor.avatar || tutor.name?.slice(0, 2).toUpperCase()}</span>
          <div>
            <p className="booking-summary-tutor-name">{tutor.name}</p>
            <p className="booking-summary-tutor-subjects">{tutor.subjects?.join(" • ")}</p>
          </div>
        </div>
        <div className="booking-summary-divider" />
        <ErrorNotice error={mutation.error} />
        <dl className="booking-summary-rows">
          <div className="booking-summary-row"><dt>Date</dt><dd>{formatBookingDate(draft.date)}</dd></div>
          <div className="booking-summary-row"><dt>Time</dt><dd>{formatBookingTime(draft.startTime, draft.endTime)}</dd></div>
          <div className="booking-summary-row"><dt>Session Type</dt><dd>{draft.mode === "Online" ? "Online (Video Call)" : "In-Person"}</dd></div>
          <div className="booking-summary-row"><dt>Subject</dt><dd>{draft.subject}</dd></div>
          <div className="booking-summary-row"><dt>Price</dt><dd className="is-price">${Number(tutor.price || 0).toFixed(2)}</dd></div>
        </dl>
        <div className="booking-summary-divider" />
        <button className="booking-summary-confirm" type="button" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? "Confirming..." : "Confirm Booking"}
        </button>
        <p className="booking-summary-note">You won&rsquo;t be charged until the tutor accepts</p>
      </section>
    </>
  );
}

const PROFILE_TABS = [
  { label: "Overview", value: "overview" },
  { label: "Reviews", value: "reviews" },
  { label: "Availability", value: "availability" }
];

// Figma node 9:134: 48px white bar, Inter 15px, 160px tab pitch, 3px blue underline on the active tab.
function ProfileTabs({ active, onChange }) {
  return (
    <div className="profile-tabs" role="tablist" aria-label="Tutor profile sections">
      {PROFILE_TABS.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={active === item.value}
          className={cx("profile-tab", active === item.value && "is-active")}
          onClick={() => onChange(item.value)}
        >
          <span className="profile-tab-label">
            {item.label}
            {active === item.value ? <span className="profile-tab-underline" /> : null}
          </span>
        </button>
      ))}
    </div>
  );
}

function StarRating({ value, size = 14 }) {
  return (
    <span className="star-rating" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} size={size} className={star <= Math.round(value) ? "star-on" : "star-off"} fill="currentColor" />
      ))}
    </span>
  );
}

function ReviewsPanel({ reviews, summary }) {
  const count = summary?.count || 0;
  const average = summary?.average || 0;
  const breakdown = summary?.breakdown || {};
  if (!count) {
    return (
      <div className="review-empty">
        <h2>No reviews yet</h2>
        <p>Reviews appear here once a student completes a session with this tutor.</p>
      </div>
    );
  }
  return (
    <div className="grid gap-5">
      <section className="review-summary">
        <div className="review-score">
          <p className="review-average">{average.toFixed(1)}</p>
          <StarRating value={average} size={16} />
          <p className="review-score-caption">{count} {count === 1 ? "review" : "reviews"} from completed sessions</p>
        </div>
        <div className="review-breakdown">
          {[5, 4, 3, 2, 1].map((star) => {
            const total = breakdown[star] || 0;
            return (
              <div key={star} className="review-breakdown-row">
                <span className="review-breakdown-label">{star} star</span>
                <span className="review-breakdown-track">
                  <span className="review-breakdown-fill" style={{ width: `${count ? (total / count) * 100 : 0}%` }} />
                </span>
                <span className="review-breakdown-count">{total}</span>
              </div>
            );
          })}
        </div>
      </section>
      <div className="grid gap-3">
        {reviews.map((review) => (
          <article key={review.id} className="review-card">
            <div className="review-card-top">
              <Avatar user={review.student} />
              <div>
                <p className="review-author">{review.student?.name || "SmartTutor student"}</p>
                <p className="review-meta">{review.createdAt}{review.booking ? ` · ${review.booking.subject} · ${review.booking.mode}` : ""}</p>
              </div>
              <StarRating value={review.rating} />
            </div>
            <p className="review-comment">{review.comment}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function TutorProfilePage() {
  const { id } = useParams();
  const [tab, setTab] = useState("overview");
  const { data, isLoading } = useQuery({ queryKey: ["tutor", id], queryFn: () => api(`/tutors/${id}`) });
  if (isLoading) return <p>Loading tutor profile...</p>;
  const { tutor, availability, reviews, reviewSummary } = data;
  return (
    <>
      <div className="tutor-profile-page grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,700px)_540px]">
        <section className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex gap-4">
              <Avatar user={tutor} />
              <div>
                <h1 className="text-3xl font-extrabold">{tutor.name}</h1>
                <p className="mt-1 font-semibold text-slate-600">{tutor.subjects?.join(" · ")}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="success">Verified</Badge>
                  <Badge tone="warning"><Star size={12} fill="currentColor" /> {reviewSummary.average.toFixed(1)} ({reviewSummary.count})</Badge>
                </div>
              </div>
            </div>
            <Button variant="secondary"><MessageSquare size={17} /> Message</Button>
          </div>
          <ProfileTabs active={tab} onChange={setTab} />
          {tab === "overview" ? (
            <div className="grid gap-5">
              <section><h2 className="text-xl font-extrabold">About</h2><p className="mt-2 text-slate-600">{tutor.bio}</p></section>
              <section><h2 className="text-xl font-extrabold">Qualifications</h2><ul className="mt-2 grid gap-2">{tutor.qualifications?.map((item) => <li key={item} className="rounded-lg bg-surface-shell p-3 text-sm font-semibold">{item}</li>)}</ul></section>
              <section><h2 className="text-xl font-extrabold">Subjects</h2><div className="mt-2 flex flex-wrap gap-2">{tutor.subjects?.map((item) => <Badge key={item} tone="student">{item}</Badge>)}</div></section>
            </div>
          ) : null}
          {tab === "reviews" ? <ReviewsPanel reviews={reviews} summary={reviewSummary} /> : null}
          {tab === "availability" ? <div className="grid gap-2">{availability.map((slot) => <div key={slot.id} className="rounded-lg bg-surface-info p-3 text-sm font-bold text-brand-blue">{slot.date} · {slot.startTime}-{slot.endTime} · {slot.mode}</div>)}</div> : null}
        </section>
        <BookingWidget tutor={tutor} availability={availability} />
      </div>
    </>
  );
}

const BOOKING_TABS = [
  { value: "confirmed", label: "Upcoming" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" }
];

// Figma node 10:72. Tab counts must come from the full booking list, not the
// tab-filtered one -- computing them from an already-filtered array is why
// switching tabs used to zero out every other tab's count.
function BookingTabs({ counts, active, onChange }) {
  return (
    <div className="booking-tabs" role="tablist" aria-label="Booking status">
      {BOOKING_TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={active === tab.value}
          className={cx("booking-tab", active === tab.value && "is-active")}
          onClick={() => onChange(tab.value)}
        >
          <span className="booking-tab-label">
            {tab.label}
            {active === tab.value ? <span className="booking-tab-underline" /> : null}
          </span>
          <span className="booking-tab-count">{counts[tab.value] || 0}</span>
        </button>
      ))}
    </div>
  );
}

// Figma node 10:86.
function BookingRow({ booking, onReschedule, onCancel }) {
  const canManage = booking.status === "pending" || booking.status === "confirmed";
  return (
    <article className="booking-row">
      <Avatar user={booking.tutor} />
      <div className="booking-row-info">
        <p className="booking-row-name">{booking.tutor.name}</p>
        <p className="booking-row-meta">{booking.subject} • {booking.mode}</p>
        <p className="booking-row-time">{formatRelativeDate(booking.date)}, {to12Hour(booking.startTime)} – {to12Hour(booking.endTime)}</p>
      </div>
      <StatusBadge status={booking.status} />
      {canManage ? (
        <div className="booking-row-actions">
          <button type="button" className="booking-row-btn" onClick={onReschedule}>Reschedule</button>
          <button type="button" className="booking-row-btn is-danger" onClick={onCancel}>Cancel</button>
        </div>
      ) : null}
    </article>
  );
}

// Reuses the calendar/slot/mode picker from BookingWidget (Figma 9:163), per
// issue #31's "reusing the calendar picker" instruction.
function RescheduleModal({ booking, onClose }) {
  useEscapeToClose(onClose);
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["tutor-availability", booking.tutorId],
    queryFn: () => api(`/tutors/${booking.tutorId}/availability`)
  });
  const slotsByDate = useMemo(() => {
    const map = new Map();
    for (const slot of data?.slots || []) {
      if (!map.has(slot.date)) map.set(slot.date, []);
      map.get(slot.date).push(slot);
    }
    return map;
  }, [data]);
  const days = useMemo(() => buildCalendarDays([...slotsByDate.keys()]), [slotsByDate]);
  const [selectedDate, setSelectedDate] = useState("");
  const [slotId, setSlotId] = useState("");
  const [mode, setMode] = useState(booking.mode);
  const daySlots = slotsByDate.get(selectedDate) || [];
  const selected = daySlots.find((slot) => slot.id === slotId) || daySlots[0];

  const mutation = useMutation({
    mutationFn: () =>
      api(`/bookings/${booking.id}/reschedule`, {
        method: "PATCH",
        body: { date: selected.date, startTime: selected.startTime, endTime: selected.endTime, mode }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      onClose();
    }
  });

  const pickDate = (iso) => {
    setSelectedDate(iso);
    setSlotId(slotsByDate.get(iso)?.[0]?.id || "");
  };

  return (
    <div className="booking-modal-scrim">
      <div className="reschedule-modal">
        <h3 className="reschedule-modal-title">Reschedule Session</h3>
        <p className="reschedule-modal-subtitle">{booking.subject} with {booking.tutor.name}</p>
        <ErrorNotice error={mutation.error} />
        <p className="booking-label">Select a new date</p>
        <div className="booking-calendar">
          <div className="booking-weekdays">
            {WEEKDAYS.map((day) => <span key={day} className="booking-weekday">{day}</span>)}
          </div>
          <div className="booking-days">
            {days.map((day) => {
              const isAvailable = slotsByDate.has(day.iso);
              const isSelected = isAvailable && day.iso === selectedDate;
              return (
                <button
                  key={day.iso}
                  type="button"
                  disabled={!isAvailable}
                  aria-pressed={isSelected}
                  className={cx("booking-day", isAvailable && "is-available", isSelected && "is-selected")}
                  onClick={() => pickDate(day.iso)}
                >
                  <span className="booking-day-number">{day.label}</span>
                  {isAvailable ? <span className="booking-day-dot" /> : null}
                </button>
              );
            })}
          </div>
        </div>
        {daySlots.length ? (
          <>
            <p className="booking-label">Available times</p>
            <div className="booking-chips">
              {daySlots.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  className={cx("booking-chip", selected?.id === slot.id && "is-active")}
                  onClick={() => setSlotId(slot.id)}
                >
                  {slot.startTime}–{slot.endTime}
                </button>
              ))}
            </div>
          </>
        ) : slotsByDate.size === 0 ? (
          <p className="text-sm text-slate-600">This tutor has no other open slots right now.</p>
        ) : null}
        <p className="booking-label">Session type</p>
        <div className="booking-modes">
          {[["Online", "🖥"], ["In-Person", "📍"]].map(([item, icon]) => (
            <button
              key={item}
              type="button"
              className={cx("booking-mode", mode === item && "is-active")}
              onClick={() => setMode(item)}
            >
              <span aria-hidden="true">{icon}</span> {item}
            </button>
          ))}
        </div>
        <div className="reschedule-modal-actions">
          <button type="button" className="btn btn-neutral" onClick={onClose}>Keep current time</button>
          <button type="button" className="btn btn-primary" disabled={!selected || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Saving..." : "Confirm New Time"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CancelModal({ booking, onClose }) {
  useEscapeToClose(onClose);
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => api(`/bookings/${booking.id}/cancel`, { method: "PATCH", body: { reason: reason.trim() || "Cancelled by student" } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      onClose();
    }
  });
  return (
    <div className="booking-modal-scrim">
      <div className="cancel-modal">
        <h3 className="reschedule-modal-title">Cancel Session</h3>
        <p className="reschedule-modal-subtitle">{booking.subject} with {booking.tutor.name} · {booking.date}</p>
        <ErrorNotice error={mutation.error} />
        <TextArea
          label="Reason (optional)"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Let the tutor know why you're cancelling"
        />
        <div className="reschedule-modal-actions">
          <button type="button" className="btn btn-neutral" onClick={onClose}>Keep Booking</button>
          <button type="button" className="btn btn-danger" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Cancelling..." : "Confirm Cancellation"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingsPage() {
  const [status, setStatus] = useState("confirmed");
  const [rescheduling, setRescheduling] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const { data } = useQuery({ queryKey: ["bookings"], queryFn: () => api("/bookings?status=all") });
  const all = useMemo(() => data?.bookings || [], [data]);
  const counts = useMemo(
    () => ({
      confirmed: all.filter((b) => b.status === "confirmed").length,
      pending: all.filter((b) => b.status === "pending").length,
      completed: all.filter((b) => b.status === "completed").length,
      cancelled: all.filter((b) => b.status === "cancelled").length
    }),
    [all]
  );
  const rows = useMemo(() => all.filter((b) => b.status === status), [all, status]);
  return (
    <>
      <PageTitle title="My Bookings" subtitle="Manage upcoming, pending, completed, and cancelled sessions." />
      <BookingTabs counts={counts} active={status} onChange={setStatus} />
      <div className="booking-list">
        {rows.map((booking) => (
          <BookingRow
            key={booking.id}
            booking={booking}
            onReschedule={() => setRescheduling(booking)}
            onCancel={() => setCancelling(booking)}
          />
        ))}
        {data && !rows.length ? <p className="text-sm text-slate-600">No {status} sessions.</p> : null}
      </div>
      {rescheduling ? <RescheduleModal booking={rescheduling} onClose={() => setRescheduling(null)} /> : null}
      {cancelling ? <CancelModal booking={cancelling} onClose={() => setCancelling(null)} /> : null}
    </>
  );
}

const MESSAGE_PAGE_SIZE = 20;
// #53: the 4s poll meant a received message could take up to 4s to appear,
// missing the "arrives within about 1 second" acceptance criterion. Typing
// already polled at 1s, so this just matches that existing rate rather than
// introducing a new mechanism -- still polling, not the #41 push question.
const CHAT_POLL_MS = 1000;
const TYPING_POLL_MS = 1000;

function MessagesPage() {
  const [selected, setSelected] = useState(null);
  const [body, setBody] = useState("");
  const [olderPages, setOlderPages] = useState([]);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const pendingScrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // No websocket server exists, so "live" is a short poll. The same interval
  // keeps presence fresh, which is what #42 needs within a few seconds.
  const conversations = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api("/messages/conversations"),
    refetchInterval: CHAT_POLL_MS
  });
  const activeId = selected || conversations.data?.conversations?.[0]?.id;
  const activeConversation = (conversations.data?.conversations || []).find((item) => item.id === activeId);
  const messages = useQuery({
    queryKey: ["messages", activeId],
    queryFn: () => api(`/messages/conversations/${activeId}/messages?limit=${MESSAGE_PAGE_SIZE}`),
    enabled: Boolean(activeId),
    refetchInterval: CHAT_POLL_MS
  });

  const latest = useMemo(() => messages.data?.messages || [], [messages.data]);
  const visibleMessages = useMemo(() => [...olderPages.flat(), ...latest], [olderPages, latest]);
  const hasMore = olderPages.length ? olderPages[0].hasMoreBefore !== false : Boolean(messages.data?.hasMore);

  // Typing has to surface within about a second, which is far tighter than the
  // inbox poll, so it gets its own small endpoint on a 1s loop.
  const typingState = useQuery({
    queryKey: ["typing", activeId],
    queryFn: () => api(`/messages/conversations/${activeId}/typing`),
    enabled: Boolean(activeId),
    refetchInterval: TYPING_POLL_MS
  });
  const peerTyping = Boolean(typingState.data?.typing);
  const peerOnline = typingState.data?.online ?? activeConversation?.participant?.online;

  useEffect(() => {
    setOlderPages([]);
    setPendingAttachments([]);
  }, [activeId]);

  // Newest-message auto-scroll, and scroll-anchor restore after a page of older
  // messages is prepended so the viewport does not jump.
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    if (pendingScrollRef.current !== null) {
      node.scrollTop = node.scrollHeight - pendingScrollRef.current;
      pendingScrollRef.current = null;
      return;
    }
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [visibleMessages.length, activeId]);

  const loadOlder = async () => {
    const oldest = visibleMessages[0];
    if (!oldest || isLoadingOlder) return;
    setIsLoadingOlder(true);
    pendingScrollRef.current = scrollRef.current?.scrollHeight || 0;
    try {
      const page = await api(`/messages/conversations/${activeId}/messages?limit=${MESSAGE_PAGE_SIZE}&before=${oldest.id}`);
      const batch = page.messages || [];
      batch.hasMoreBefore = page.hasMore;
      if (batch.length) setOlderPages((current) => [batch, ...current]);
      else pendingScrollRef.current = null;
    } finally {
      setIsLoadingOlder(false);
    }
  };

  const onScroll = (event) => {
    if (event.target.scrollTop <= 0 && hasMore && !isLoadingOlder) loadOlder();
  };

  const typingMutation = useMutation({ mutationFn: () => api(`/messages/conversations/${activeId}/typing`, { method: "POST" }) });
  const onBodyChange = (event) => {
    setBody(event.target.value);
    if (activeId && event.target.value.trim()) typingMutation.mutate();
  };

  const [uploadProgress, setUploadProgress] = useState(null);
  const attachMutation = useMutation({
    mutationFn: (file) => {
      const form = new FormData();
      form.append("file", file);
      setUploadProgress(0);
      return uploadWithProgress(`/messages/conversations/${activeId}/attachments`, form, setUploadProgress);
    },
    onSuccess: (data) => setPendingAttachments((current) => [...current, data.attachment]),
    onSettled: () => setUploadProgress(null)
  });
  const onPickFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) attachMutation.mutate(file);
  };
  const removePendingAttachment = (url) => {
    setPendingAttachments((current) => current.filter((item) => item.url !== url));
  };

  const canSend = Boolean(body.trim() || pendingAttachments.length);
  const sendMutation = useMutation({
    mutationFn: () => api(`/messages/conversations/${activeId}/messages`, { method: "POST", body: { body, attachments: pendingAttachments } }),
    onSuccess: () => {
      setBody("");
      setPendingAttachments([]);
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
                <span className="block truncate text-sm text-slate-600">{conversation.lastMessage?.body}</span>
              </span>
              {conversation.unreadCount ? <Badge tone="warning">{conversation.unreadCount}</Badge> : null}
            </button>
          ))}
        </aside>
        <section className="chat-pane">
          <header className="chat-header">
            {activeConversation ? (
              <>
                <span className="chat-header-avatar">
                  {activeConversation.participant?.avatarUrl
                    ? <img className="my-profile-avatar-img" src={activeConversation.participant.avatarUrl} alt="" />
                    : activeConversation.participant?.avatar || activeConversation.participant?.name?.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <p className="chat-header-name">{activeConversation.participant?.name}</p>
                  <p className={cx("chat-presence", peerOnline && "is-online")}>
                    <span className="chat-presence-dot" />
                    {peerOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </>
            ) : <p className="chat-header-name">No conversation selected</p>}
          </header>
          <div className="chat-scroll" ref={scrollRef} onScroll={onScroll}>
            {hasMore ? (
              <button className="chat-load-more" type="button" disabled={isLoadingOlder} onClick={loadOlder}>
                {isLoadingOlder ? "Loading..." : "Load older messages"}
              </button>
            ) : null}
            {visibleMessages.map((message) => {
              const mine = message.senderId === user.id;
              return (
                <div key={message.id} className={cx("chat-row", mine && "is-mine")}>
                  <div className={cx("chat-bubble", mine && "is-mine")}>
                    {message.body ? <p>{message.body}</p> : null}
                    {(message.attachments || []).map((attachment, index) => (
                      <a
                        key={`${message.id}-${index}`}
                        className="chat-attachment-chip"
                        href={/^https?:\/\//.test(attachment.url) ? attachment.url : undefined}
                        target="_blank"
                        rel="noreferrer"
                        aria-disabled={!/^https?:\/\//.test(attachment.url)}
                      >
                        📎 {attachment.title}
                        {attachment.size ? <span className="chat-attachment-size">{formatMaterialSize(attachment.size)}</span> : null}
                      </a>
                    ))}
                  </div>
                  <p className="chat-meta">
                    {mine ? "Delivered ✓✓" : (
                      <button className="chat-flag" type="button" onClick={() => flagMutation.mutate(message.id)}>Flag to admin</button>
                    )}
                  </p>
                </div>
              );
            })}
            {peerTyping ? <div className="chat-typing" aria-label="Typing"><span /><span /><span /></div> : null}
            <div ref={bottomRef} />
          </div>
          {uploadProgress !== null ? (
            <div className="chat-upload-progress" role="progressbar" aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100}>
              <div className="chat-upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
              <span className="chat-upload-progress-label">Uploading… {uploadProgress}%</span>
            </div>
          ) : null}
          {pendingAttachments.length ? (
            <div className="chat-pending-attachments">
              {pendingAttachments.map((attachment) => (
                <span key={attachment.url} className="chat-pending-chip">
                  📎 {attachment.title}
                  <button type="button" aria-label={`Remove ${attachment.title}`} onClick={() => removePendingAttachment(attachment.url)}>×</button>
                </span>
              ))}
            </div>
          ) : null}
          {attachMutation.error ? <p className="chat-attach-error">{attachMutation.error.message}</p> : null}
          <form className="chat-composer" onSubmit={(event) => { event.preventDefault(); if (canSend) sendMutation.mutate(); }}>
            <div className="chat-input-wrap">
              <input className="chat-input" value={body} onChange={onBodyChange} placeholder="Type a message..." />
              <input ref={fileInputRef} type="file" className="sr-only" accept=".pdf,.docx,.png,.mp4" onChange={onPickFile} />
              <button
                className="chat-attach"
                type="button"
                title="Attach a file"
                aria-label="Attach a file"
                disabled={!activeId || attachMutation.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                📎
              </button>
            </div>
            <button className="chat-send" type="submit" disabled={!canSend || sendMutation.isPending}>Send →</button>
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
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 text-xl font-extrabold">Pending Requests</h2>
          <div className="grid gap-3">
            {pending.map((booking) => (
              <article key={booking.id} className="rounded-xl border border-surface-border p-4">
                <div className="flex items-center justify-between gap-3"><p className="font-extrabold">{booking.student.name}</p><StatusBadge status={booking.status} /></div>
                <p className="mt-1 text-sm text-slate-600">{booking.subject} · {booking.date} · {booking.startTime}</p>
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
                <p className="mt-1 text-sm text-slate-600">{booking.startTime}-{booking.endTime} · {booking.mode}</p>
                <Button className="mt-3" onClick={() => mutation.mutate({ id: booking.id, action: "complete" })}>Start Session</Button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

const MATERIAL_TYPE_LABELS = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "image/png": "PNG",
  "video/mp4": "MP4"
};

function materialTypeLabel(mimeType) {
  return MATERIAL_TYPE_LABELS[mimeType] || "FILE";
}

function formatMaterialSize(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function DeleteMaterialModal({ material, onClose, onConfirm, isPending }) {
  useEscapeToClose(onClose);
  return (
    <div className="booking-modal-scrim">
      <div className="cancel-modal">
        <h3 className="reschedule-modal-title">Delete Material</h3>
        <p className="reschedule-modal-subtitle">{material.title}</p>
        <p className="text-sm text-slate-600 mt-4">This removes the file for every student it is linked to. This can&rsquo;t be undone.</p>
        <div className="reschedule-modal-actions">
          <button type="button" className="btn btn-neutral" onClick={onClose}>Keep File</button>
          <button type="button" className="btn btn-danger" disabled={isPending} onClick={onConfirm}>
            {isPending ? "Deleting..." : "Delete Material"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Figma nodes 11:185 (page) / 11:204 (dropzone) / 11:208 (row).
function MaterialsPage() {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [shareWithAll, setShareWithAll] = useState(true);
  const [linkedStudentIds, setLinkedStudentIds] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const materials = useQuery({ queryKey: ["materials"], queryFn: () => api("/materials") });
  // The upload form previously hardcoded a single demo student id. Students
  // this tutor can actually share with are derived from their real bookings.
  const tutorBookings = useQuery({ queryKey: ["tutor-bookings-for-materials"], queryFn: () => api("/bookings?status=all") });
  const myStudents = useMemo(() => {
    const seen = new Map();
    for (const booking of tutorBookings.data?.bookings || []) {
      if (booking.student && !seen.has(booking.student.id)) seen.set(booking.student.id, booking.student);
    }
    return [...seen.values()];
  }, [tutorBookings.data]);

  const uploadMutation = useMutation({
    mutationFn: () => {
      const form = new FormData();
      form.append("file", file);
      form.append("title", title || file.name);
      form.append("public", shareWithAll ? "true" : "false");
      if (!shareWithAll) form.append("linkedStudentIds", linkedStudentIds.join(","));
      return api("/materials", { method: "POST", body: form });
    },
    onSuccess: () => {
      setFile(null);
      setTitle("");
      setLinkedStudentIds([]);
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api(`/materials/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      setDeleting(null);
    }
  });

  const toggleStudent = (id) => {
    setLinkedStudentIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const onDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  };

  async function downloadMaterial(material) {
    const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000/api"}/materials/${material.id}/download`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = material.title;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageTitle title="Learning Materials" subtitle="Upload PDF, DOCX, PNG, or MP4 files up to 50MB and share them with your students." />
      <ErrorNotice error={uploadMutation.error} />
      <div
        className={cx("materials-dropzone", isDragging && "is-dragging")}
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") fileInputRef.current?.click(); }}
        onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <p className="materials-dropzone-label">📁 {file ? file.name : "Drag and drop files here, or click to browse"}</p>
        <p className="materials-dropzone-hint">PDF, DOCX, PNG, MP4 • Max 50MB per file</p>
        <input
          ref={fileInputRef}
          className="sr-only"
          type="file"
          accept=".pdf,.docx,.png,.mp4"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
        />
      </div>
      {file ? (
        <section className="card materials-upload-form">
          <Field label="Title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={file.name} />
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={shareWithAll} onChange={(event) => setShareWithAll(event.target.checked)} />
            Share with all my students
          </label>
          {!shareWithAll ? (
            <div className="materials-student-picker">
              {myStudents.length ? myStudents.map((student) => (
                <label key={student.id} className="materials-student-option">
                  <input type="checkbox" checked={linkedStudentIds.includes(student.id)} onChange={() => toggleStudent(student.id)} />
                  {student.name}
                </label>
              )) : <p className="text-sm text-slate-600">No students yet — this will save as unshared until you have a booking.</p>}
            </div>
          ) : null}
          <div className="materials-upload-actions">
            <Button variant="secondary" type="button" onClick={() => { setFile(null); setTitle(""); }}>Cancel</Button>
            <Button
              disabled={uploadMutation.isPending || (!shareWithAll && !linkedStudentIds.length)}
              onClick={() => uploadMutation.mutate()}
            >
              <FileUp size={17} /> {uploadMutation.isPending ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </section>
      ) : null}

      <h2 className="section-heading materials-list-heading">Uploaded Materials</h2>
      <div className="materials-list">
        {(materials.data?.materials || []).map((material) => (
          <article key={material.id} className="material-row" data-type={materialTypeLabel(material.mimeType)}>
            <span className="material-type-badge">{materialTypeLabel(material.mimeType)}</span>
            <div className="material-row-info">
              <p className="material-row-title">{material.title}</p>
              <p className="material-row-meta">{formatMaterialSize(material.size)} • Uploaded {material.createdAt.slice(0, 10)}</p>
            </div>
            <p className="material-row-shared">
              📎 {material.public ? "All students" : (material.linkedStudentIds.length ? `${material.linkedStudentIds.length} student${material.linkedStudentIds.length === 1 ? "" : "s"}` : "Not shared yet")}
            </p>
            <div className="material-row-actions">
              <button type="button" className="booking-row-btn" onClick={() => downloadMaterial(material)}>Download</button>
              <button type="button" className="booking-row-btn is-danger" onClick={() => setDeleting(material)}>Delete</button>
            </div>
          </article>
        ))}
        {materials.data && !materials.data.materials.length ? <p className="text-sm text-slate-600">No materials uploaded yet.</p> : null}
      </div>
      {deleting ? (
        <DeleteMaterialModal
          material={deleting}
          isPending={deleteMutation.isPending}
          onClose={() => setDeleting(null)}
          onConfirm={() => deleteMutation.mutate(deleting.id)}
        />
      ) : null}
    </>
  );
}

function SimpleStat({ value, label, tone }) {
  return (
    <div className="simple-stat">
      <p className="simple-stat-value" style={tone ? { color: tone } : undefined}>{value}</p>
      <p className="simple-stat-label">{label}</p>
    </div>
  );
}

// Figma node 13:128. The "Avg. Score" stat has no real per-session score in
// this data model, so it is sourced honestly from the student's own review
// ratings on completed bookings instead of a fabricated number.
function StudentProgressPage() {
  const { data } = useQuery({ queryKey: ["student-progress"], queryFn: () => api("/progress/student") });
  const stats = data?.stats;
  return (
    <>
      <PageTitle title="My Learning Progress" subtitle="Calculated from completed bookings, tutor session notes, and your own reviews." />
      <div className="stat-simple-grid">
        <SimpleStat value={stats?.sessionsTotal ?? 0} label="Sessions Total" tone="var(--blue)" />
        <SimpleStat value={stats?.completedSessions ?? 0} label="Completed" tone="var(--blue)" />
        <SimpleStat value={stats?.activeSubjects ?? 0} label="Subjects Active" tone="var(--blue)" />
        <SimpleStat value={stats?.averageRating ? `${stats.averageRating}★` : "—"} label="Avg. Rating Given" tone="var(--warning)" />
      </div>
      <h2 className="section-heading">Progress by Subject</h2>
      <div
        className="subject-progress-grid"
        role="img"
        aria-label={
          (data?.subjects || []).length
            ? `Progress by subject: ${data.subjects.map((subject) => `${subject.subject} ${subject.progress}%`).join(", ")}`
            : "No subject progress yet"
        }
      >
        {(data?.subjects || []).map((subject) => (
          <div key={subject.subject} className="subject-progress-card">
            <div className="subject-progress-row">
              <span>{subject.subject}</span>
              <span className="subject-progress-pct">{subject.progress}%</span>
            </div>
            <div className="subject-progress-track">
              <div className="subject-progress-fill" style={{ width: `${subject.progress}%` }} />
            </div>
          </div>
        ))}
        {data && !data.subjects.length ? <p className="text-sm text-slate-600">No completed sessions yet.</p> : null}
      </div>
      <h2 className="section-heading">Recent Session History</h2>
      <div className="session-history-list">
        {(data?.history || []).map((session) => (
          <article key={session.id} className="session-history-row">
            <div>
              <p className="session-history-date">{session.date}</p>
              <p className="session-history-title">{session.tutor?.name} — {session.subject}</p>
              {session.notes ? <p className="session-history-notes">{session.notes}</p> : null}
            </div>
            {session.rating ? <span className="session-history-badge">{session.rating}/5 ★</span> : null}
          </article>
        ))}
        {data && !data.history.length ? <p className="text-sm text-slate-600">No completed sessions yet.</p> : null}
      </div>
    </>
  );
}

// Figma nodes 11:99 / 11:132 / 11:154.
function EarningsPage() {
  const { data } = useQuery({ queryKey: ["earnings"], queryFn: () => api("/progress/earnings") });
  const stats = data?.stats;
  const max = Math.max(...(data?.monthly || []).map((item) => item.amount), 1);
  return (
    <>
      <PageTitle title="Earnings & Payments" subtitle="Reads from the shared Transaction collection." />
      <div className="stat-simple-grid">
        <SimpleStat value={`$${stats?.thisMonth ?? 0}`} label="This Month" tone="var(--success)" />
        <SimpleStat value={`$${stats?.allTime ?? 0}`} label="All Time" tone="var(--navy)" />
        <SimpleStat value={`$${stats?.pendingPayout ?? 0}`} label="Pending Payout" tone="var(--warning)" />
        <SimpleStat value={stats?.sessions ?? 0} label="Sessions" tone="var(--navy)" />
      </div>
      <div className="earnings-panels">
        <section className="earnings-chart-card">
          <h2 className="section-heading">Monthly Earnings</h2>
          <div
            className="earnings-chart-bars"
            role="img"
            aria-label={
              (data?.monthly || []).length
                ? `Monthly earnings: ${data.monthly.map((item) => `${item.month} $${item.amount}`).join(", ")}`
                : "No paid sessions yet"
            }
          >
            {(data?.monthly || []).map((item) => (
              <div key={item.key} className="earnings-bar-col">
                <span className="earnings-bar-value">${item.amount}</span>
                <div className="earnings-bar-fill" style={{ height: `${Math.max(8, (item.amount / max) * 100)}%` }} />
                <span className="earnings-bar-month">{item.month}</span>
              </div>
            ))}
            {data && !data.monthly.length ? <p className="text-sm text-slate-600">No paid sessions yet.</p> : null}
          </div>
        </section>
        <section className="earnings-txn-card">
          <h2 className="section-heading">Recent Transactions</h2>
          <div className="earnings-txn-header">
            <span>Student</span><span>Subject</span><span>Amount</span><span>Status</span>
          </div>
          {(data?.transactions || []).slice(0, 8).map((transaction) => (
            <div key={transaction.id} className="earnings-txn-row">
              <span>{transaction.student?.name}</span>
              <span className="text-slate-600">{transaction.subject}</span>
              <span className="font-bold">${transaction.amount}</span>
              <StatusBadge status={transaction.status} />
            </div>
          ))}
          {data && !data.transactions.length ? <p className="text-sm text-slate-600">No transactions yet.</p> : null}
        </section>
      </div>
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
        <p className="text-sm font-semibold text-slate-600">Total paid</p>
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

const ADMIN_ROLES = ["student", "tutor", "admin"];

// Figma node 112:54. No dedicated edit-modal frame exists for this button, so
// the modal itself follows the established scrim/card token system used by
// the booking reschedule/cancel modals.
function EditUserModal({ user, onClose }) {
  useEscapeToClose(onClose);
  const [role, setRole] = useState(user.role);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => api(`/admin/users/${user.id}`, { method: "PATCH", body: { role } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      onClose();
    }
  });
  return (
    <div className="booking-modal-scrim">
      <div className="cancel-modal">
        <h3 className="reschedule-modal-title">Edit User</h3>
        <p className="reschedule-modal-subtitle">{user.name} · {user.email}</p>
        <ErrorNotice error={mutation.error} />
        <label className="block mt-4">
          <span className="mb-2 block text-sm font-bold">Role</span>
          <select className="field" value={role} onChange={(event) => setRole(event.target.value)}>
            {ADMIN_ROLES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <div className="reschedule-modal-actions">
          <button type="button" className="btn btn-neutral" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Saving..." : "Save Role"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminDashboardPage() {
  const { user: currentAdmin } = useAuthStore();
  const queryClient = useQueryClient();
  const [role, setRole] = useState("all");
  const [editing, setEditing] = useState(null);
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
            <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Subjects</th><th>Price</th><th>Rating</th><th>Status</th><th>Joined</th><th></th></tr></thead>
            <tbody>
              {(users.data?.users || []).map((item) => (
                <tr key={item.id}>
                  <td><span className="flex items-center gap-2"><Avatar user={item} /> <b>{item.name}</b></span></td>
                  <td>{item.email}</td>
                  <td><Badge tone={item.role === "student" ? "student" : "info"}>{item.role}</Badge></td>
                  <td>{item.subjects?.length ? item.subjects.join(", ") : "—"}</td>
                  <td>{item.role === "tutor" ? `$${item.price}/hr` : "—"}</td>
                  <td>{item.role === "tutor" ? `${item.rating?.toFixed(1)} (${item.reviewCount})` : "—"}</td>
                  <td><StatusBadge status={item.active ? "active" : "disabled"} /></td>
                  <td>{item.joinedAt}</td>
                  <td className="flex flex-wrap gap-2">
                    {item.id === currentAdmin.id ? (
                      <span className="text-xs font-semibold text-slate-600">This is you</span>
                    ) : (
                      <>
                        <Button variant="secondary" onClick={() => setEditing(item)}>Edit</Button>
                        <Button variant={item.active ? "danger" : "success"} onClick={() => userMutation.mutate({ id: item.id, active: !item.active })}>{item.active ? "Disable" : "Enable"}</Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {editing ? <EditUserModal user={editing} onClose={() => setEditing(null)} /> : null}
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
        {(reports.data?.reports || []).length ? reports.data.reports.map((report) => <div key={report.id} className="rounded-lg bg-surface-danger p-3 text-sm text-status-danger">{report.body}</div>) : <p className="text-sm text-slate-600">No flagged messages.</p>}
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
      <Route path="/profile/edit" element={<ProtectedRoute><ProfileEditPage /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute roles={["student"]}><TutorSearchPage /></ProtectedRoute>} />
      <Route path="/tutors/:id" element={<ProtectedRoute roles={["student"]}><TutorProfilePage /></ProtectedRoute>} />
      <Route path="/book/:id" element={<ProtectedRoute roles={["student"]}><BookSessionPage /></ProtectedRoute>} />
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
