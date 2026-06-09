# Backend API Reference

> Base URL: `http://localhost:5000/api/v1`  
> All protected routes require `Authorization: Bearer <accessToken>` header.  
> All responses follow the standard envelope below.

---

## Standard Response Envelope

```ts
// Success
{
  "success": true,
  "message": "Human-readable message",
  "data": <T>,          // present on most endpoints
  "meta": {             // present on paginated endpoints
    "total": number,
    "page": number,
    "limit": number,
    "totalPages": number
  }
}

// Error
{
  "success": false,
  "message": "Error description",
  "errors": string[]    // present on validation failures (400)
}
```

**HTTP Status Codes used:**
| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request / Validation failed |
| 401 | Unauthorized (missing/expired token) |
| 403 | Forbidden (wrong role or locked account) |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 413 | Request body too large |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

## Rate Limiting

| Limiter | Window | Max Requests |
|---------|--------|-------------|
| `globalLimiter` | 15 min | 200 |
| `authLimiter` | 15 min | 10 (skips successful) |
| `strictLimiter` | 60 min | 5 |
| `writeLimiter` | 15 min | 60 (skips GET) |

---

## Auth Module

### `POST /auth/register`
**Rate limit:** `authLimiter`  
**Auth required:** No

**Request body:**
```json
{
  "name": "string (2–100 chars, required)",
  "email": "string (valid email, required)",
  "password": "string (8–100 chars, must have uppercase + lowercase + digit + special char, required)"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Registered",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "avatar": null,
      "isActive": true,
      "isEmailVerified": false,
      "failedLoginAttempts": 0,
      "lockedUntil": null,
      "passwordChangedAt": null,
      "lastLoginAt": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

**Notes:**
- Sends welcome email (fire-and-forget, non-fatal)
- `password` and `refreshTokenHash` are NEVER returned in any user object

---

### `POST /auth/login`
**Rate limit:** `authLimiter`  
**Auth required:** No

**Request body:**
```json
{
  "email": "string (valid email, required)",
  "password": "string (required)"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { /* same User shape as register */ },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

**Error cases:**
- `401` — "Invalid email or password" (wrong credentials, constant-time compare)
- `403` — "Account locked. Retry in Xmin." (5+ failed attempts → 30 min lock)
- `403` — "Account disabled. Contact support." (isActive = false)

---

### `POST /auth/refresh`
**Rate limit:** `authLimiter`  
**Auth required:** No

**Request body:**
```json
{ "refreshToken": "eyJ..." }
```

**Response 200:**
```json
{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."   // New refresh token (rotation)
  }
}
```

**Notes:**
- Refresh tokens rotate on every use (new token issued)
- Reuse of an old refresh token revokes ALL tokens and returns 401
- Access token expires in 15 min; refresh token expires in 7 days

---

### `POST /auth/logout`
**Auth required:** Yes

**Response 200:**
```json
{ "success": true, "message": "Logged out" }
```

---

### `GET /auth/me`
**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "message": "Profile",
  "data": { /* User object — no password or refreshTokenHash */ }
}
```

---

### `PUT /auth/change-password`
**Rate limit:** `strictLimiter` (5/hour)  
**Auth required:** Yes

**Request body:**
```json
{
  "currentPassword": "string (required)",
  "newPassword": "string (8–100 chars, same pattern as register, required)"
}
```

**Response 200:**
```json
{ "success": true, "message": "Password changed. Please log in again." }
```

**Notes:**
- All refresh tokens are revoked after password change
- Sends security alert email (fire-and-forget)

---

### `POST /auth/avatar`
**Auth required:** Yes  
**Content-Type:** `multipart/form-data`  
**Field name:** `avatar`  
**Max size:** 5 MB  
**Allowed types:** JPEG, PNG, WebP, GIF (validated via magic bytes)

**Response 200:**
```json
{
  "success": true,
  "message": "Avatar updated",
  "data": { "avatar": "https://res.cloudinary.com/..." }
}
```

---

## Workspace Module

### `GET /workspaces`
**Auth required:** Yes

Returns all workspaces the authenticated user is a member of.

**Response 200:**
```json
{
  "success": true,
  "message": "Workspaces",
  "data": [
    {
      "id": 1,
      "name": "My Team",
      "slug": "my-team",
      "description": "Team workspace",
      "logo": null,
      "ownerId": 1,
      "isPersonal": false,
      "myRole": "owner",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Notes:** `myRole` is injected by the service (not a DB column).

---

### `POST /workspaces`
**Rate limit:** `writeLimiter`  
**Auth required:** Yes

**Request body:**
```json
{
  "name": "string (2–100 chars, required)",
  "description": "string (optional)"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Workspace created",
  "data": {
    "id": 1,
    "name": "My Team",
    "slug": "my-team",          // auto-generated, unique (appends -1, -2 if collision)
    "description": null,
    "logo": null,
    "ownerId": 1,
    "isPersonal": false,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Notes:**
- Creator is auto-added as `owner` member
- Slug auto-generated from name (lowercased, hyphenated, unique)

---

### `GET /workspaces/:workspaceId`
**Auth required:** Yes  
**Role required:** viewer, member, admin, or owner

**Response 200:**
```json
{
  "success": true,
  "message": "Workspace",
  "data": {
    "id": 1,
    "name": "My Team",
    "slug": "my-team",
    "description": null,
    "logo": null,
    "ownerId": 1,
    "isPersonal": false,
    "members": [
      {
        "id": 1,
        "workspaceId": 1,
        "userId": 1,
        "role": "owner",
        "invitedBy": null,
        "joinedAt": "2024-01-01T00:00:00.000Z",
        "user": {
          "id": 1,
          "name": "John Doe",
          "email": "john@example.com",
          "avatar": null
        }
      }
    ],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### `PATCH /workspaces/:workspaceId`
**Rate limit:** `writeLimiter`  
**Auth required:** Yes  
**Role required:** admin or owner

**Request body (all optional):**
```json
{
  "name": "string (2–100 chars)",
  "description": "string"
}
```

**Response 200:** Updated workspace object.

---

### `DELETE /workspaces/:workspaceId`
**Auth required:** Yes  
**Role required:** owner only

**Response 200:**
```json
{ "success": true, "message": "Workspace deleted" }
```

---

### `GET /workspaces/:workspaceId/members`
**Auth required:** Yes  
**Role required:** viewer+

**Response 200:**
```json
{
  "success": true,
  "message": "Members",
  "data": [
    {
      "id": 1,
      "workspaceId": 1,
      "userId": 1,
      "role": "owner",
      "invitedBy": null,
      "joinedAt": "...",
      "user": { "id": 1, "name": "...", "email": "...", "avatar": null }
    }
  ]
}
```

---

### `POST /workspaces/:workspaceId/members`
**Rate limit:** `writeLimiter`  
**Auth required:** Yes  
**Role required:** admin or owner

**Request body:**
```json
{
  "email": "string (valid email, required)",
  "role": "admin | member | viewer (optional, default: member)"
}
```

**Response 201:** New WorkspaceMember object.

**Error cases:**
- `404` — User not found (email not registered)
- `409` — User is already a member

---

### `PATCH /workspaces/:workspaceId/members/:userId`
**Auth required:** Yes  
**Role required:** admin or owner

**Request body:**
```json
{ "role": "admin | member | viewer (required)" }
```

**Error cases:**
- `403` — Cannot change owner role

---

### `DELETE /workspaces/:workspaceId/members/:userId`
**Auth required:** Yes  
**Role required:** admin or owner

**Special behavior:** An owner cannot leave (must transfer ownership or delete workspace first).

---

## Board Module

All board routes are nested under `/workspaces/:workspaceId/boards`.

### `GET /workspaces/:workspaceId/boards`
**Auth required:** Yes  
**Role required:** workspace viewer+

**Response 200:**
```json
{
  "success": true,
  "message": "Boards",
  "data": [
    {
      "id": 1,
      "workspaceId": 1,
      "createdById": 1,
      "name": "Product Roadmap",
      "description": null,
      "background": "#0052CC",
      "visibility": "workspace",
      "isClosed": false,
      "isStarred": false,
      "position": 0,
      "members": [ /* BoardMember[] with user */ ],
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

### `POST /workspaces/:workspaceId/boards`
**Rate limit:** `writeLimiter`  
**Auth required:** Yes  
**Role required:** workspace member+

**Request body:**
```json
{
  "name": "string (1–200 chars, required)",
  "description": "string (optional)",
  "background": "string (CSS color or URL, optional, default: #0052CC)",
  "visibility": "private | workspace | public (optional, default: workspace)"
}
```

**Response 201:** Board object.

**Notes:**
- Creator auto-added as board `admin`
- 3 default lists created: "To Do", "In Progress", "Done"

---

### `GET /workspaces/:workspaceId/boards/:boardId`
**Auth required:** Yes  
**Role required:** board viewer+

**Response 200:** Full board with `members[]` and `lists[]` (each list includes its `cards[]`).

---

### `PATCH /workspaces/:workspaceId/boards/:boardId`
**Rate limit:** `writeLimiter`  
**Auth required:** Yes  
**Role required:** board admin

**Request body (all optional):**
```json
{
  "name": "string",
  "description": "string",
  "background": "string",
  "visibility": "private | workspace | public"
}
```

---

### `DELETE /workspaces/:workspaceId/boards/:boardId`
**Auth required:** Yes  
**Role required:** board admin

---

### `POST /workspaces/:workspaceId/boards/:boardId/close`
**Auth required:** Yes  
**Role required:** board admin

Sets `isClosed = true`. Board no longer appears in listings.

---

### Board Member endpoints
Same pattern as workspace members, scoped to `/boards/:boardId/members`.  
Roles: `admin | member | viewer`

---

## List Module

All under `/workspaces/:workspaceId/boards/:boardId/lists`.

### `GET .../lists`
Returns all non-archived lists ordered by position, each with their non-archived cards.

### `POST .../lists`
```json
{ "name": "string (1–200 chars, required)" }
```
Auto-assigns position as `max + 65536`.

### `PATCH .../lists/reorder`
```json
{ "orderedIds": [3, 1, 2] }
```
Sets positions to `index * 65536` in a transaction.

### `PATCH .../lists/:listId`
```json
{ "name": "string (1–200 chars)" }
```

### `POST .../lists/:listId/archive`
Sets `isArchived = true`.

### `DELETE .../lists/:listId`
**Role required:** board admin  
Hard deletes (cascades to cards).

---

## Card Module

Cards live at two mount points:

| Path | Purpose |
|------|---------|
| `/workspaces/:wId/boards/:bId/lists/:lId/cards` | Per-list CRUD |
| `/workspaces/:wId/boards/:bId/cards` | Board-level search/stats/bulk |

### `GET .../lists/:listId/cards`
**Query params:**
| Param | Type | Default |
|-------|------|---------|
| `page` | number | 1 |
| `limit` | number | 50 (max 100) |
| `search` | string | — |
| `priority` | `critical\|high\|medium\|low` | — |
| `assigneeId` | number | — |

**Response 200:**
```json
{
  "success": true,
  "message": "Cards",
  "data": [ /* Card[] */ ],
  "meta": { "total": 10, "page": 1, "limit": 50, "totalPages": 1 }
}
```

---

### `POST .../lists/:listId/cards`
```json
{
  "title": "string (1–500 chars, required)",
  "description": "string (optional)",
  "priority": "critical | high | medium | low (optional, default: medium)",
  "dueDate": "ISO string (optional)",
  "labels": "string[] (optional)",
  "tags": "string[] (optional)"
}
```

**Response 201:** Card object.

---

### Card Object (full shape)
```ts
{
  id: number,
  listId: number,
  boardId: number,
  createdById: number,
  title: string,
  description: string | null,
  status: "open" | "in_progress" | "in_review" | "done" | "archived",
  priority: "critical" | "high" | "medium" | "low",
  position: number,            // float, for ordering
  dueDate: string | null,      // ISO date
  startDate: string | null,
  completedAt: string | null,  // auto-set when status → "done"
  labels: string[],            // color codes / names
  tags: string[],
  checklist: [
    { id: "uuid", text: "string", completed: boolean }
  ],
  attachments: string[],       // URLs
  coverImage: string | null,
  estimateHours: number | null,
  isArchived: boolean,
  isWatched: boolean,
  creator: { id, name, email, avatar },
  assignees: [
    { id, cardId, userId, user: { id, name, email, avatar } }
  ],
  createdAt: string,
  updatedAt: string
}
```

---

### `GET .../lists/:listId/cards/:cardId`
Returns single card with `creator` and `assignees` included.

---

### `PATCH .../lists/:listId/cards/:cardId`
All fields optional:
```json
{
  "title": "string",
  "description": "string | null",
  "status": "open | in_progress | in_review | done | archived",
  "priority": "critical | high | medium | low",
  "dueDate": "ISO string | null",
  "startDate": "ISO string | null",
  "labels": "string[]",
  "tags": "string[]",
  "estimateHours": "number | null",
  "coverImage": "string | null"
}
```

**Note:** Setting `status = "done"` auto-sets `completedAt` to now. Setting any other status clears `completedAt`.

---

### `PATCH .../lists/:listId/cards/:cardId/move`
```json
{
  "targetListId": number,    // required
  "position": number         // optional, auto-assigned if omitted
}
```

---

### `PATCH .../lists/:listId/cards/reorder`
```json
{ "orderedIds": [5, 2, 8, 1] }
```

---

### `DELETE .../lists/:listId/cards/:cardId`
Hard delete.

### `POST .../lists/:listId/cards/:cardId/archive`
Sets `isArchived = true`.

### `POST .../lists/:listId/cards/:cardId/restore`
Sets `isArchived = false` (finds archived card).

---

### `POST .../lists/:listId/cards/:cardId/cover`
**Content-Type:** `multipart/form-data`  
**Field:** `cover`  
Old cover image auto-deleted from Cloudinary.

**Response 200:**
```json
{ "data": { "coverImage": "https://res.cloudinary.com/..." } }
```

---

### Assignees

**`POST .../cards/:cardId/assignees`**
```json
{ "userId": number }
```
Also creates notification + sends email to assigned user.

**`DELETE .../cards/:cardId/assignees/:userId`**
Removes assignment.

---

### Checklist

**`POST .../cards/:cardId/checklist`**
```json
{ "text": "string (1–500 chars)" }
```
Returns updated `checklist` array.

**`PATCH .../cards/:cardId/checklist/:itemId`**
```json
{ "text": "string (optional)", "completed": "boolean (optional)" }
```

**`DELETE .../cards/:cardId/checklist/:itemId`**

---

### Board-level card endpoints

**`GET /boards/:boardId/cards/search?q=string`**
- Minimum 2 chars
- Searches title, description, tags
- Returns max 50 results ordered by `updatedAt DESC`

**`GET /boards/:boardId/cards/stats`**
```json
{
  "data": {
    "total": 42,
    "byStatus": [
      { "status": "open", "count": "10" },
      { "status": "done", "count": "32" }
    ],
    "overdue": 3,
    "doneThisWeek": 5
  }
}
```

**`PATCH /boards/:boardId/cards/bulk/move`**
```json
{
  "cardIds": [1, 2, 3],       // max 50
  "targetListId": number
}
```

---

## Comment Module

Mounted at `/workspaces/:wId/boards/:bId/cards/:cardId/comments`.

### `GET .../comments`
Returns top-level comments (parentId = null) with nested `replies[]`.

**Comment object:**
```ts
{
  id: number,
  cardId: number,
  userId: number,
  parentId: number | null,
  content: string,
  mentions: number[],       // extracted user IDs from @[Name](id) syntax
  isEdited: boolean,
  isDeleted: boolean,       // soft-deleted: content becomes "[deleted]"
  author: { id, name, email, avatar },
  replies: Comment[],       // only on top-level comments
  createdAt: string,
  updatedAt: string
}
```

### `POST .../comments`
```json
{
  "content": "string (1–10000 chars, required)",
  "parentId": "number (optional, max 1 level nesting)"
}
```

**Mention syntax:** `@[John Doe](42)` — userId 42 gets a notification.

**Notifications sent:**
- Card creator notified when someone else comments
- All `@mentioned` users notified

### `PATCH .../comments/:commentId`
```json
{ "content": "string (1–10000 chars)" }
```
Only the comment author can edit. Sets `isEdited = true`.

### `DELETE .../comments/:commentId`
Only the comment author or system admin can delete. Soft-deletes (preserves thread structure).

---

## Notification Module

### `GET /notifications`
**Query params:** `page`, `limit`, `unreadOnly=true`

**Notification object:**
```ts
{
  id: number,
  userId: number,
  actorId: number | null,
  type: "card_assigned" | "card_due_soon" | "card_overdue" | "card_moved"
       | "card_commented" | "board_invite" | "workspace_invite" | "mention",
  title: string,
  body: string,
  entityType: "card" | "board" | "workspace" | "comment",
  entityId: number,
  isRead: boolean,
  readAt: string | null,
  actor: { id, name, avatar } | null,
  createdAt: string,
  updatedAt: string
}
```

### `GET /notifications/unread-count`
```json
{ "data": { "count": 5 } }
```

### `PATCH /notifications/mark-all-read`
```json
{ "data": { "updated": 5 } }
```

### `PATCH /notifications/:notifId/read`
Marks one notification as read.

### `DELETE /notifications/:notifId`
Hard deletes.

---

## Todo Module

### `GET /todos`
**Query params:** `page`, `limit`, `status`, `priority`, `search`

**Todo object:**
```ts
{
  id: number,
  userId: number,
  title: string,
  description: string | null,
  status: "pending" | "in_progress" | "completed",
  priority: "low" | "medium" | "high",
  dueDate: string | null,
  createdAt: string,
  updatedAt: string
}
```

### `GET /todos/stats`
```json
{
  "data": {
    "total": 10,
    "pending": 4,
    "in_progress": 3,
    "completed": 3
  }
}
```

### `GET /todos/:id`
### `POST /todos`
```json
{
  "title": "string (1–200 chars, required)",
  "description": "string (optional)",
  "priority": "low | medium | high (optional, default: medium)",
  "dueDate": "ISO string (optional)"
}
```

### `PUT /todos/:id`
```json
{
  "title": "string",
  "description": "string",
  "status": "pending | in_progress | completed",
  "priority": "low | medium | high",
  "dueDate": "ISO string | null"
}
```

### `DELETE /todos/:id`

---

## Admin Module

**All routes require:** `Authorization: Bearer <token>` with role `super_admin` or `admin`.  
Base: `/admin`

### `GET /admin/stats`
System-wide counts.

### `GET /admin/users`
**Query params:** `page`, `limit`, `search`, `role`

### `GET /admin/users/:userId`
### `PATCH /admin/users/:userId`
```json
{
  "role": "super_admin | admin | user",
  "isActive": boolean
}
```

### `DELETE /admin/users/:userId`
**Requires:** `super_admin` role only.

### `POST /admin/users/:userId/lock`
```json
{ "minutes": "number (1–10080, default: 30)" }
```

### `POST /admin/users/:userId/unlock`
Clears `lockedUntil` and resets `failedLoginAttempts`.

---

## WebSocket / Socket.IO

**URL:** `NEXT_PUBLIC_SOCKET_URL` (same host as API, no `/api/v1` prefix)

### Authentication
```js
const socket = io(SOCKET_URL, {
  auth: { token: accessToken },
  transports: ["websocket", "polling"]
});
```

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `board:join` | `{ boardId: number }` | Join a board room (access-checked server-side) |
| `board:leave` | `{ boardId: number }` | Leave a board room |
| `card:typing` | `{ cardId: number, boardId: number }` | Broadcast typing indicator |

### Server → Client Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `card:created` | `{ card, listId }` | Card created |
| `card:updated` | `{ card } or { cardId, field }` | Card updated |
| `card:moved` | `{ cardId, fromListId, toListId, position }` | Card moved |
| `card:deleted` | `{ cardId }` | Card deleted or archived |
| `card:assigned` | `{ cardId, userId }` | User assigned to card |
| `list:created` | `{ list }` | List created |
| `list:updated` | `{ list }` | List renamed |
| `list:deleted` | `{ listId }` | List deleted |
| `list:reordered` | `{ orderedIds }` | Lists reordered |
| `comment:created` | `{ comment, cardId }` | Comment added |
| `comment:updated` | `{ comment }` | Comment edited |
| `comment:deleted` | `{ commentId, cardId }` | Comment soft-deleted |
| `board:updated` | `{ board }` | Board settings changed |
| `board:member_joined` | `{ userId }` | Member invited to board |
| `board:member_left` | `{ userId }` | Member removed |
| `presence:online` | `{ userId, boardId }` | User joined board room |
| `presence:offline` | `{ userId, boardId }` | User left board room |
| `presence:viewing` | `{ userId, boardId }` | User is viewing the board |
| `notification:new` | `{ id, type, title, body, entityType, entityId, createdAt }` | Push to personal room |
| `card:typing` | `{ userId, cardId }` | Someone is typing in a card |
| `error` | `{ message }` | Socket error (e.g. access denied) |

### Personal Room
Each authenticated user is auto-joined to `user:<id>` room.  
`notification:new` events are sent to this room.

---

## Role & Permission Matrix

### System Roles (`user.role`)
| Role | Access |
|------|--------|
| `super_admin` | Bypasses all workspace/board access checks; can delete any user |
| `admin` | Can access admin panel; cannot delete users |
| `user` | Normal user |

### Workspace Roles
| Role | Rank | Can do |
|------|------|--------|
| `owner` | 4 | Everything; delete workspace; transfer ownership |
| `admin` | 3 | Invite/remove members; create boards |
| `member` | 2 | Create boards; view all boards |
| `viewer` | 1 | View only |

### Board Roles
| Role | Rank | Can do |
|------|------|--------|
| `admin` | 3 | Full CRUD on board, lists, cards; manage members |
| `member` | 2 | Create/edit/move/delete cards and lists |
| `viewer` | 1 | Read-only |

**Fallback rule:** Workspace `owner`/`admin` get board `admin` access. Workspace `member` gets board `member` access.  
Public boards (`visibility = "public"`) allow `viewer` access to anyone.

---

## File Upload Rules
- **Accepted types:** JPEG, PNG, WebP, GIF
- **Max size:** 5 MB
- **Validation:** Two-layer — Content-Type header + magic byte detection (prevents renamed .exe)
- **Storage:** Cloudinary (auto-optimized)
- **Old files:** Auto-deleted on replace (avatars and card covers)

---

## Error Handling Notes for Frontend

1. **401 on any request** → Try refresh. If refresh fails → force logout.
2. **403** → Show "Access denied" — do not retry.
3. **409** on register → "Email already in use".
4. **429** → Show "Too many requests, slow down" with `retryAfter` from response.
5. **Validation errors (400)** → `response.errors` is `string[]` — display each one.
6. **`lockedUntil`** on 403 login → Parse minutes remaining from message.
7. **Socket error event** → `{ message: "Access denied" }` — do not crash, just log.