# Data Model: User Authentication & App Shell

## Entities

### User
- `id`: UUID (Primary Key)
- `username`: String (Unique)
- `password_hash`: String (Argon2id)
- `full_name`: String
- `role`: String (e.g., "admin")
- `avatar_url`: String (Optional)
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Session
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key -> User.id)
- `token`: String (Unique)
- `last_accessed`: Timestamp
- `expires_at`: Timestamp (Optional, but spec says "no inactivity timeout")
- `created_at`: Timestamp

### AuditLog
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key -> User.id)
- `event_type`: Enum ("login_success", "login_failure", "logout", "password_change")
- `timestamp`: Timestamp
- `metadata`: JSON (e.g., user-agent or IP if relevant, though local only)

## Relationships
- A **User** can have many **Sessions** (though spec says "single user", multiple sessions might exist across app runs).
- A **User** can have many **AuditLogs**.
