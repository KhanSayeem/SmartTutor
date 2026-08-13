# SmartTutor Session Continuation Handoff (2026-08-14)

## Instruction to the new session

**Continue the SmartTutor ICT302 backlog work.** Keep making autonomous "best
fit" engineering decisions on ambiguous issues, the same way this session
did — commit and push without asking, keep GitHub issues open, work through
the remaining backlog in priority order (see "What's left" below). Only stop
and ask the user when you hit something genuinely only they can decide —
account creation on a new service, a real architecture pivot, spending real
money, or anything outside a free tier. Everything else: just do it.

## Current State

- Repo: `C:\Users\Hi\.codex\worktrees\64ba\SmartTutor`
- Branch: `codex/issue-64-reviews-tab`, kept fast-forward-identical to `main`
  all session — every push went to both. Verify with:
  `git log --oneline -1 origin/main` vs `origin/codex/issue-64-reviews-tab`;
  they should match. If they've diverged, `main` is authoritative going
  forward — either branch is fine to keep working from, just push to both
  the same way this session did (`git push origin <branch>` then
  `git push origin <branch>:main`).
- Working tree: clean at handoff time.
- Local dev servers were left running in this worktree: client on `:5173`
  (Vite), server on `:4000` (Express/nodemon). Check `netstat -ano | grep
  ':5173\|:4000'` before starting new ones — starting a second instance on
  the same port will just fail loudly, not silently conflict.

## The backlog tracker

73 GitHub issues total, from `SmartTutor_ICT302_Implementation_Backlog.pdf`.
**Issues are never closed** — completion is tracked via labels
(`status:todo` / `status:partial` / `status:completed`) plus a detailed
comment on the issue. This is a deliberate, established convention — do not
close issues even when fully done.

**At handoff: 63 completed, 6 partial, 4 todo.**

### What's left (in recommended order)

1. **#41 — Connect real-time delivery.** Written in the backlog as
   "Connect Firebase Firestore for real-time delivery," but that premise is
   now stale: this session moved file storage off Firebase onto Supabase
   Storage per the user's "no paid tools, free tiers only" instruction (see
   #57's audit trail), and messaging currently works via polling, not a
   push mechanism. Implementing this needs a real decision — either (a) a
   real database + Supabase Realtime, or (b) a lighter WebSocket/SSE layer
   bolted onto the existing Express server, or (c) determining the current
   polling-based UX is sufficient and this issue should be re-scoped.
   **Don't silently build one of these — flag the tradeoff to the user
   first**, the same way deployment options were researched and presented
   before executing.
2. **#47 — Add file attachment upload to messages.** Clean feature build,
   no blockers. The materials upload pattern (`server/src/routes/materials.js`,
   `validateUpload()` in `server/src/utils/fileValidation.js`,
   `saveUploadedFile()` in `server/src/services/storage.js`) is the
   template to reuse — same Supabase-Storage-with-local-placeholder-fallback
   approach, same MIME/size validation shape.
3. **#50 — Add file upload progress bar.** Depends on #47 existing first
   (there's no upload to show progress on yet). Frontend-only once #47 lands
   — `XMLHttpRequest` `upload.onprogress` or a fetch-with-`ReadableStream`
   approach, since native `fetch()` doesn't expose upload progress.
4. **#53 — Messaging speed + file upload test pass.** Blocked on #47 and
   #50 both existing — can't test a feature that isn't built yet.

### The 6 "partial" issues — do not try to fully close these piecemeal

`#11, #28, #34, #56, #57, #73` are all honestly left `status:partial`
because they hit one of two repo-wide gaps that no single issue should
paper over:

- **MongoDB persistence is not wired.** The entire app runs on an
  in-memory seeded store (`server/src/data/store.js`). `mongoose` is a
  listed dependency but unused. This is documented, known, and intentional
  until there's a real decision to migrate — don't half-fix one collection's
  persistence without addressing this for the whole app.
- **The original ICT301 ERD/Figma source is unavailable** for a couple of
  specific acceptance criteria (e.g. #56's DB-diagram-vs-code diff, #73's
  full compliance check) — these were left open rather than fabricated
  evidence against a document nobody has access to.

If you want to move these forward, that's a database-architecture
conversation with the user first, not more piecemeal code.

## Live production deployment (new this session)

- **Backend**: `https://smarttutor-brxm.onrender.com` — Render, free web
  service tier. Deployed via `render.yaml` (Blueprint, committed at repo
  root). Health check: `GET /health` → `{"ok":true,"service":"smarttutor-api"}`.
  API routes are under `/api/*` — the bare root `GET /` correctly 404s,
  that's not a bug.
- **Frontend**: `https://smart-tutor-client-five.vercel.app` — Vercel, free
  Hobby tier. Root Directory `client/`, config in `client/vercel.json`
  (build/output dirs + the SPA catch-all rewrite to `index.html` — **do not
  remove that rewrite**, every client-side route 404s on Vercel without it
  since only `/` is a real static file).
- **CORS**: `CLIENT_ORIGIN` env var on Render is set to the exact Vercel
  URL. Verified via preflight — `access-control-allow-origin` reflects the
  real origin, not a wildcard.
- **Env vars intentionally left unset on Render**: `MONGODB_URI`,
  `SMTP_HOST/PORT/USER/PASS`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
  The app degrades gracefully without all of these — emails log to console
  (`[dev-mail]` prefix) instead of sending, materials fall back to a local
  placeholder URL instead of real Supabase-hosted files. This is the same
  behavior as local dev, not a production-only gap.
- **Free-tier tradeoff worth knowing**: Render's free instance fully stops
  (not pauses) after 15 minutes of inactivity. The in-memory store resets to
  seed data on every cold start — anything created during a demo session
  disappears once the instance sleeps and wakes again. Acceptable for a
  grading demo; would matter if this needed to hold state long-term.
- **Supabase Storage is still not connected anywhere** (local or prod) —
  this remains blocked on the repo owner creating a **Free**-plan Supabase
  org+project (their existing "FCC" org is on Pro, which bills per project
  created). Setup steps are in `docs/supabase-storage-setup.md`. Don't
  attempt this yourself; account/org creation on an external service is the
  user's call.

Full production smoke-test evidence is in the GitHub comments on #21, #40,
#55, #72 — real API calls and real browser walkthroughs against the live
URLs, not just "the code looks right."

## Test credentials (seeded, same locally and in production)

All passwords: `Password123!`

- `student@smarttutor.local` — Avery Chen, student
- `tutor@smarttutor.local` — Dr. Maya Singh, tutor
- `liam@smarttutor.local` / `priya@smarttutor.local` — secondary students
- `admin@smarttutor.local` — admin (log in via `/admin-login`, not `/login`)

## Bugs found and fixed this session — useful pattern knowledge

These are worth knowing about even if you're not touching the same code,
because the underlying patterns can recur elsewhere in the app:

1. **CSS Grid implicit-track-sizing overflow.** A `<div className="grid
   lg:grid-cols-[...]">` with no *base* `grid-cols-N` falls back to an
   implicit single-column track below the `lg` breakpoint — and implicit
   grid tracks size to their content's **max-content** width, not the
   container. A non-wrapping flex row inside (e.g. avatar + name + button)
   silently grew the whole page wider than the viewport at mobile widths.
   Fix: always pair a responsive `lg:grid-cols-[...]` with an explicit base
   `grid-cols-1` (Tailwind's `grid-cols-N` compiles to `minmax(0, 1fr)`
   tracks, which don't have this problem). Hit this twice — tutor profile
   page and the tutor booking-requests dashboard.
2. **`width: 100vw` causes real horizontal scroll** on any platform with a
   non-overlay scrollbar, because `100vw` includes the scrollbar's own
   width while the visible viewport (`clientWidth`) doesn't. A full-bleed
   element using the `width:100vw; margin-left:50%; transform:translateX(-50%)`
   trick to escape a centered container will overflow by exactly the
   scrollbar width. Fixed with a systemic `overflow-x: hidden` on
   `html, body` (scoped to X only — verify any future fix doesn't
   accidentally clip vertical scroll too).
3. **Design tokens can fail WCAG AA even when they're the literal
   Figma-specified values.** The status-color tokens (success/warning/
   danger, used for badges and pills app-wide) trace directly to a Figma
   node comment (`App.jsx:919`, node `10:15`) and still failed 4.5:1
   contrast against their own tint backgrounds by a wide margin (as low as
   2.01:1). When an issue's explicit acceptance criterion is a WCAG contrast
   check, that criterion wins over pixel-matching Figma — darken the token,
   document it as a deliberate deviation, move on. Same for the muted-gray
   token (`--muted` / `text-slate-500`), which was borderline-failing
   (~4.3:1) against the page's own shell background even outside any badge
   context.
4. **Testing keyboard focus indicators in a headless/automated browser
   tab is easy to get wrong.** Calling `element.focus()` via
   `page.evaluate()` sets `document.activeElement` but does NOT make
   `document.hasFocus()` true if the tab itself lacks OS-level window
   focus — and `:focus` CSS matching (and therefore any focus-ring styling)
   silently fails to apply in that state, producing a false "no visible
   focus indicator" reading that has nothing to do with the actual app.
   **Always verify keyboard interaction with real `page.keyboard.press()`
   calls** (Tab, Enter, Escape), not synthetic `.focus()` — this session hit
   the false positive once and caught it by cross-checking with real key
   presses.
5. **Modals had no Escape-key dismissal anywhere in the app.** Added a
   shared `useEscapeToClose(onClose)` hook (near the top of `App.jsx`,
   right after the `cx()` helper) and wired it into all four dismissible
   modals (`RescheduleModal`, `CancelModal`, `DeleteMaterialModal`,
   `EditUserModal`). Deliberately did **not** add a visible close/X button
   — every modal already has an equivalent neutral "keep/cancel" button,
   and there's no Figma frame showing an X affordance to match against.
   Reuse this hook for any new modal.

## Reusable audit tooling (copy-paste ready)

For any future "mobile + accessibility pass" issue, this JS snippet run via
Playwright's `browser_evaluate` at 320px viewport catches the exact classes
of bugs this session found — horizontal overflow, WCAG contrast failures
(proper relative-luminance calculation, not just eyeballing), and sub-44px
touch targets:

```js
() => {
  function luminance(r,g,b){const a=[r,g,b].map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});return a[0]*0.2126+a[1]*0.7152+a[2]*0.0722;}
  function contrast(rgb1,rgb2){const l1=luminance(...rgb1)+0.05,l2=luminance(...rgb2)+0.05;return l1>l2?l1/l2:l2/l1;}
  function parseColor(str){const m=str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);return m?[+m[1],+m[2],+m[3]]:null;}
  function getBgColor(el){let node=el;while(node){const c=getComputedStyle(node).backgroundColor;const rgb=parseColor(c);if(rgb&&c!=='rgba(0, 0, 0, 0)')return rgb;node=node.parentElement;}return [255,255,255];}
  const result = {};
  result.overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth ? {yes:true, scrollWidth: document.documentElement.scrollWidth} : {yes:false};
  const targets=[];
  document.querySelectorAll('button, a, input, select, textarea, [role="button"]').forEach(el=>{const r=el.getBoundingClientRect();if(r.width===0&&r.height===0)return;targets.push({tag:el.tagName,text:(el.textContent||el.value||'').trim().slice(0,20),w:Math.round(r.width),h:Math.round(r.height)});});
  result.smallTargets = targets.filter(t=>t.h<44||t.w<44);
  const contrastFails=[];
  document.querySelectorAll('body *').forEach(el=>{
    if(el.children.length>0 && el.tagName!=='A' && el.tagName!=='BUTTON')return;
    const text=el.textContent?.trim();if(!text)return;
    const style=getComputedStyle(el);const fg=parseColor(style.color);if(!fg)return;
    const bg=getBgColor(el);const ratio=contrast(fg,bg);
    const fontSize=parseFloat(style.fontSize);const bold=parseInt(style.fontWeight)>=700;
    const isLarge=fontSize>=24||(fontSize>=18.66&&bold);const threshold=isLarge?3:4.5;
    if(ratio<threshold)contrastFails.push({text:text.slice(0,30),tag:el.tagName,ratio:ratio.toFixed(2),threshold});
  });
  result.contrastFails = contrastFails;
  return JSON.stringify(result, null, 1);
}
```

Note: a `smallTargets` or `contrastFails` hit on a `disabled` button is a
false positive — WCAG 1.4.3 exempts inactive controls from contrast
requirements. Always re-check the *enabled* state before calling it a bug
(this session caught exactly this on the messaging Send button).

## Standing user instructions (from earlier in this session — still apply)

- **No paid tools anywhere in this project.** Free tiers only, always.
  Verify current free-tier terms via web search before recommending a
  service — they change (Railway and Fly.io both quietly dropped their free
  tiers; this was researched fresh this session, don't rely on older
  assumptions).
- **Never ask before committing or pushing.** Just do it. This extends to
  merging the working branch into `main` when appropriate.
- **Blanket approval for migrations, deploys, and pushes** was given
  explicitly for this project.
- **Keep making autonomous "best fit" decisions on ambiguous issues.**
  Only stop for something genuinely only the user can do — most commonly
  this has meant creating an account/org on an external service (Supabase,
  Render, Vercel) or a real architecture/scope decision with tradeoffs.
- **GitHub issues stay open, always.** Completion is `status:completed`
  label + detailed comment, never closing the issue.
- Prior session note still relevant: light verification was fine for one
  early issue (#64) per explicit user request; every issue since has had
  real automated tests and/or live verification, and that's the expected
  bar going forward unless told otherwise.

## Required reading (unchanged from prior handoffs)

- `AGENTS.md` — Figma-source-of-truth contract, shadcn status (still not
  configured), handoff convention.
- `docs/github-issue-tracker-summary.md` — tracker mechanics.
- This file.

Figma file key `QoW89JeNwFX7nFV7kyVbEy` remains the source of truth for UI
structure/spacing/colors/typography — inspect the relevant node before any
new UI work, same as before. The one established exception: an issue's
explicit WCAG/accessibility acceptance criterion overrides a Figma color
value when they conflict (see bug #3 above) — document it when this happens,
don't silently diverge.

## Prompt for the new session

Continue the SmartTutor ICT302 backlog from
`C:\Users\Hi\.codex\worktrees\64ba\SmartTutor`, branch
`codex/issue-64-reviews-tab` (kept in sync with `main`).

First read `AGENTS.md`, `docs/github-issue-tracker-summary.md`, and this
handoff file in full.

63 of 73 tracked issues are `status:completed`. The remaining 4 open
(`status:todo`) issues are, in order: #41 (real-time delivery — flag the
Firebase-vs-Supabase-vs-polling tradeoff to the user before building
anything, don't just pick one), #47 (file attachment upload to messages —
clean build, reuse the materials upload pattern), #50 (upload progress bar,
depends on #47), #53 (test pass, depends on #47+#50). The other 6
(`status:partial`) are correctly left partial pending a real MongoDB
persistence decision or unavailable source documents — don't try to
piecemeal-fix those without raising the underlying gap with the user first.

Production is live: backend on Render (`https://smarttutor-brxm.onrender.com`),
frontend on Vercel (`https://smart-tutor-client-five.vercel.app`), verified
working end to end. Keep both in mind when making changes — a push to
`main` auto-redeploys the Vercel frontend; the Render backend needs no
redeploy for frontend-only changes.

Keep the established conventions: detailed commit messages explaining WHY
(with `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`), push
without asking, post a detailed GitHub comment plus label update on every
issue you touch, keep issues open, and write real tests/do real live
verification rather than light checks unless told otherwise.
