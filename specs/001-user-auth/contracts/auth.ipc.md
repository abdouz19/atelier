# IPC Contract: Authentication

## Channels (Main Process -> Renderer)
- `AUTH_SESSION_EXPIRED`: Emitted when the session is no longer valid.

## Channels (Renderer -> Main Process)

### `auth:login`
- **Description**: Authenticate user with username and password.
- **Payload**:
  ```ts
  {
    username: string;
    password: password;
  }
  ```
- **Response**:
  ```ts
  {
    success: boolean;
    data?: {
      user: User;
      sessionToken: string;
    };
    error?: string;
  }
  ```

### `auth:logout`
- **Description**: Terminate the current session.
- **Payload**: `{}`
- **Response**: `{ success: boolean; }`

### `auth:checkSession`
- **Description**: Check if the current session is valid on app boot.
- **Payload**: `{}`
- **Response**:
  ```ts
  {
    success: boolean;
    data?: { user: User };
  }
  ```

### `user:changePassword`
- **Description**: Update the authenticated user's password.
- **Payload**:
  ```ts
  {
    currentPassword: string;
    newPassword: string;
  }
  ```
- **Response**: `{ success: boolean; error?: string; }`
