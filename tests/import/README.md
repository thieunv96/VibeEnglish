# Import test fixtures

Sample files for the admin bulk-import flow at `/admin/import`.

| File | Shape | Contents |
|---|---|---|
| `01-single-lesson.json` | single object | 1 lesson (conversations) |
| `02-single-exercise.json` | single object | 1 mcq exercise (vocabulary) |
| `03-array-mixed.json` | array | 1 lesson + 1 fill exercise |
| `04-wrapper.yaml` | `{lessons, exercises}` | 2 lessons + 1 match exercise |
| `05-batch-lessons.yml` | array | 3 lessons (different categories / levels) |
| `06-with-invalid.json` | wrapper | 1 valid lesson, 1 invalid lesson (bad slug, bad level, empty segments), 1 valid exercise — exercises the error report |

## How to try

1. Sign in as an admin.
2. Go to `/admin/import`.
3. Select all six files in the picker.
4. Click **Preview** — you'll see each record tagged `new`, `update`, or `invalid` (06 has one invalid).
5. Click **Confirm import** — valid rows are upserted.
6. Visit `/admin/lessons` and `/admin/exercises` to see the new records.

Reruns are idempotent: previously imported slugs flip from `new` to `update` on the next preview, and `created` to `updated` on the next commit.
