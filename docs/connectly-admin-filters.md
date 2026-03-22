# Admin reports: filters & “saving tokens” (AI / codebase)

## Single source of truth

- **Reason codes**: `App\Models\Report::REASONS` (PHP) and `REPORT_REASONS` in `resources/js/hooks/useReports.js`.
- **Priority reasons**: `Report::URGENT_REASONS` and `URGENT_REPORT_REASONS` in the same hook file.

When adding a reason, update **both** PHP and JS (or generate one from the other in a build step).

## API query params (lean)

`GET /admin/reports` supports:

| Param | Values |
|--------|--------|
| `status` | `all` (no filter) or `pending`, `reviewed`, `dismissed`, `action_taken` |
| `reportable_type` | `all`, `user`, `post`, `profile_comment` |
| `reason` | `all` or any value from `Report::REASONS` |
| `priority` | `all`, `urgent` (priority queue), `standard` |

Prefer these short params instead of repeating long labels in prompts or docs.

## Notifications

Moderation actions notify via Laravel notifications (`data.type`):

- `report_outcome` — reporter (dismiss / resolved / content removed)
- `moderation_content_removed` — post author (warning)
- `account_suspended` — suspended user

Keep message copy in the notification classes so the API and UI stay aligned.
