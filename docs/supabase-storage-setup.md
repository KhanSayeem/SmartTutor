# Supabase Storage Setup (Free Plan)

SmartTutor uploads avatars (and, later, tutor materials) through
`server/src/services/storage.js`. That module talks to Supabase Storage over its
REST API when credentials are present, and falls back to a local placeholder
when they are not, so the app runs with no Supabase account at all.

## Why not Firebase

The backlog originally specified Firebase Storage. Supabase is used instead: the
project already has Supabase connected, and its free plan covers what SmartTutor
needs. Nothing in this repo requires a paid plan.

## Cost note

Creating a project inside an organization that is on the **Pro** plan bills
**$10/month per project**. To stay free, create the SmartTutor project inside an
organization on the **Free** plan (a Supabase account may hold several
organizations; Free allows 2 active projects and 1 GB of storage).

## One-time setup

1. In the Supabase dashboard, create a **new organization** and pick the **Free**
   plan, then create a project inside it (for example `SmartTutor`).
2. Create a storage bucket named `smarttutor-uploads` and mark it **public**.
   Avatars are meant to be visible to other users; writes stay server-side.
3. Copy `Project URL` and the `service_role` key from Project Settings -> API.
4. Put them in `server/.env` (never commit this file):

   ```
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   SUPABASE_STORAGE_BUCKET=smarttutor-uploads
   ```

5. Restart the API. `storageMode` flips from `stub` to `supabase` automatically.

## Storage policies

The server uploads with the `service_role` key, which bypasses RLS, so no INSERT
policy is required for the app to work. Public read is what makes the returned
URL resolvable. If the bucket is created as private instead, add:

```sql
create policy "Public read for smarttutor uploads"
on storage.objects for select
to anon, authenticated
using ( bucket_id = 'smarttutor-uploads' );
```

Do not add an anonymous INSERT policy. The `service_role` key must stay on the
server and must never reach the browser bundle.

## Security notes

- `SUPABASE_SERVICE_ROLE_KEY` is a secret. It belongs in `server/.env` and in the
  host's environment settings, never in `client/`, never in git.
- Avatar uploads are capped at 2 MB and restricted to PNG, JPEG, and WebP by
  `validateAvatar` in `server/src/utils/fileValidation.js`.
- Uploads are stored under `avatars/<userId>/`, so one user cannot overwrite
  another's file by guessing a name.
