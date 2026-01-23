# SOLID Principles for React and TypeScript

This guide explains how to apply SOLID principles to React and TypeScript code in our project, with practical examples and patterns.

> **Project Example**: See how our `csvLoader.ts` utility implements SOLID principles in [csvLoader-solid-example.md](./csvLoader-solid-example.md)

## Overview of SOLID Principles

SOLID is an acronym for five design principles that make software more maintainable, flexible, and understandable:

- **S**ingle Responsibility Principle
- **O**pen/Closed Principle
- **L**iskov Substitution Principle
- **I**nterface Segregation Principle
- **D**ependency Inversion Principle

These principles are language-agnostic but require specific adaptations for React and TypeScript.

## 1. Single Responsibility Principle (SRP)

> A component or hook should have only one reason to change.

### React Application

**Problem:**

```tsx
// ❌ Bad: Component doing too many things
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) throw new Error("Failed to fetch user");
        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [userId]);

  function handleUpdateUser(updates: Partial<User>) {
    // More API calls and state updates...
  }

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <h2>{user?.name}</h2>
      <UserForm user={user} onSubmit={handleUpdateUser} />
      <UserActivity userId={userId} />
    </div>
  );
}
```

**Solution:**

```tsx
// ✅ Good: Extract data fetching to a custom hook
function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetching logic moved here
    // ...
  }, [userId]);

  const updateUser = useCallback(
    async (updates: Partial<User>) => {
      // Update logic here
      // ...
    },
    [userId]
  );

  return { user, loading, error, updateUser };
}

// ✅ Good: Component only handles rendering
function UserProfile({ userId }: { userId: string }) {
  const { user, loading, error, updateUser } = useUser(userId);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <h2>{user?.name}</h2>
      <UserForm user={user} onSubmit={updateUser} />
      <UserActivity userId={userId} />
    </div>
  );
}
```

### Key SRP Patterns for React

1. **Extract API calls into custom hooks**

   - Keep data fetching and manipulation separate from rendering
   - Create reusable hooks like `useUser`, `useVocabularyList`, etc.

2. **Separate container and presentational components**

   - Container components handle data and logic
   - Presentational components handle rendering only

3. **Use context for cross-cutting concerns**
   - Authentication, themes, user preferences, etc.
   - Keep business logic separate from UI components

## 2. Open/Closed Principle (OCP)

> Software entities should be open for extension but closed for modification.

### React Application

**Problem:**

```tsx
// ❌ Bad: Component requires modification for new notification types
function NotificationList({ notifications }: { notifications: Notification[] }) {
  return (
    <ul>
      {notifications.map((notification) => {
        if (notification.type === "message") {
          return <MessageNotification key={notification.id} notification={notification} />;
        } else if (notification.type === "friend_request") {
          return <FriendRequestNotification key={notification.id} notification={notification} />;
        }
        // Adding new types requires modifying this component
        return null;
      })}
    </ul>
  );
}
```

**Solution:**

```tsx
// ✅ Good: Map of notification components
const NOTIFICATION_COMPONENTS: Record<string, React.FC<{ notification: Notification }>> = {
  message: MessageNotification,
  friend_request: FriendRequestNotification,
  system: SystemNotification,
  // Adding new types just requires adding to this map
};

// Default component for unknown types
const DefaultNotification: React.FC<{ notification: Notification }> = ({ notification }) => (
  <li>Unknown notification: {notification.type}</li>
);

// ✅ Good: Component is closed for modification but open for extension
function NotificationList({ notifications }: { notifications: Notification[] }) {
  return (
    <ul>
      {notifications.map((notification) => {
        const NotificationComponent =
          NOTIFICATION_COMPONENTS[notification.type] || DefaultNotification;

        return <NotificationComponent key={notification.id} notification={notification} />;
      })}
    </ul>
  );
}
```

### Key OCP Patterns for React

1. **Component Maps**

   - Use objects to map types to components
   - Allows adding new variants without modifying existing code

2. **Render Props and Higher-Order Components**

   - Pass rendering logic as props
   - Wrap components to extend functionality

3. **Plugin Architecture**
   - Create extension points for custom behavior
   - Register handlers for different scenarios

## 3. Liskov Substitution Principle (LSP)

> Subtypes must be substitutable for their base types without altering program correctness.

### React Application

**Problem:**

```tsx
// ❌ Bad: Derived component breaks expectations
interface ButtonProps {
  onClick: () => void;
  label: string;
}

function Button({ onClick, label }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}

// This component breaks LSP by ignoring the onClick prop
function DisabledButton({ label }: ButtonProps) {
  // Still requires onClick
  return <button disabled>{label}</button>;
}

// This could cause unexpected behavior
const MyComponent = () => {
  const handleClick = () => console.log("Clicked!");

  // onClick won't work here even though props match ButtonProps
  return <DisabledButton onClick={handleClick} label="Click Me" />;
};
```

**Solution:**

```tsx
// ✅ Good: Base interface properly extended
interface ButtonProps {
  label: string;
  onClick?: () => void;
}

function Button({ onClick, label }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}

interface DisabledButtonProps {
  label: string;
  // No onClick required
}

function DisabledButton({ label }: DisabledButtonProps) {
  return <button disabled>{label}</button>;
}

// Or better, make the base component adaptable
function ImprovedButton({
  onClick,
  label,
  disabled = false,
}: ButtonProps & { disabled?: boolean }) {
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled}>
      {label}
    </button>
  );
}
```

### Key LSP Patterns for React

1. **Proper Prop Typing**

   - Make optional props truly optional with `?`
   - Avoid props that might be ignored in subtypes

2. **Composition over Inheritance**

   - Favor component composition over class inheritance
   - Use higher-order components or hooks for shared behavior

3. **Consistent Behavior Across Component Variants**
   - Ensure similar components respond to the same props consistently
   - Document any deliberate deviations

## 4. Interface Segregation Principle (ISP)

> No component should be forced to depend on props it doesn't use.

### React Application

**Problem:**

```tsx
// ❌ Bad: Monolithic props interface
interface UserComponentProps {
  user: User;
  posts: Post[];
  comments: Comment[];
  friends: User[];
  onUpdateUser: (user: User) => void;
  onDeleteUser: () => void;
  onCreatePost: (post: Post) => void;
  onDeletePost: (postId: string) => void;
  // Many more props...
}

// Components using this interface need all props
function UserProfile(props: UserComponentProps) {
  // Only uses user and onUpdateUser
  return <div>{/* ... */}</div>;
}
```

**Solution:**

```tsx
// ✅ Good: Segregated interfaces
interface UserDisplayProps {
  user: User;
}

interface UserActionsProps {
  onUpdateUser: (user: User) => void;
  onDeleteUser: () => void;
}

// Components only depend on props they need
function UserHeader({ user }: UserDisplayProps) {
  return <h2>{user.name}</h2>;
}

function UserActions({ onUpdateUser, onDeleteUser }: UserActionsProps) {
  return <div>{/* ... */}</div>;
}

// Compose them in a parent component
function UserProfile({
  user,
  posts,
  onUpdateUser,
  onDeleteUser,
  onCreatePost,
  onDeletePost,
}: UserDisplayProps & UserActionsProps & UserPostsProps) {
  return (
    <div>
      <UserHeader user={user} />
      <UserActions onUpdateUser={onUpdateUser} onDeleteUser={onDeleteUser} />
      <UserPosts posts={posts} onCreatePost={onCreatePost} onDeletePost={onDeletePost} />
    </div>
  );
}
```

### Key ISP Patterns for React

1. **Small, Focused Prop Interfaces**

   - Create specific interfaces for different aspects of functionality
   - Combine interfaces with intersection types when needed

2. **Component Composition**

   - Break large components into smaller, focused components
   - Each component should have a single responsibility

3. **Context Selection**
   - Use multiple contexts rather than one giant context
   - Components should only consume the context they need

## 5. Dependency Inversion Principle (DIP)

> High-level modules should not depend on low-level modules. Both should depend on abstractions.

### React Application

**Problem:**

```tsx
// ❌ Bad: Direct dependency on API implementation
function UserList() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // Hard-coded dependency on fetch API and endpoint
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data));
  }, []);

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

**Solution:**

```tsx
// ✅ Good: Depend on abstraction via custom hook
// API service abstraction
const userApi = {
  getUsers: async () => {
    const res = await fetch("/api/users");
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
  },
};

// Hook depends on the abstraction
function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await userApi.getUsers();
        if (isMounted) {
          setUsers(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  return { users, loading, error };
}

// Component depends on the hook abstraction
function UserList() {
  const { users, loading, error } = useUsers();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### Key DIP Patterns for React

1. **Service Abstractions**

   - Create service objects for API calls
   - Use dependency injection to provide services to components

2. **Custom Hook Abstractions**

   - Create hooks that encapsulate implementation details
   - Components depend on hook interfaces, not implementations

3. **Context for Dependency Injection**
   - Provide services via context
   - Makes testing easier with mock implementations

## Project-Specific SOLID Guidelines

### Components

1. Each component should have a clear, single purpose
2. Extract data fetching to custom hooks
3. Extract complex logic to separate functions
4. Keep render functions clean and focused on UI

### Hooks

1. Each hook should manage a specific concern
2. Abstract away implementation details
3. Return only the data and functions needed by components

### Types and Interfaces

1. Create small, focused interfaces
2. Use composition to build complex types
3. Be explicit about optional vs. required props

## Code Review Checklist for SOLID Principles

- [ ] **Single Responsibility**: Does each component or hook have a clear, single purpose?
- [ ] **Open/Closed**: Can the code be extended without modification?
- [ ] **Liskov Substitution**: Can component variants be used interchangeably?
- [ ] **Interface Segregation**: Are prop interfaces small and focused?
- [ ] **Dependency Inversion**: Does the code depend on abstractions rather than implementations?

## Refactoring Patterns

### From Class Components to Functional Components

```tsx
// ❌ Before: Class component with multiple responsibilities
class UserProfile extends React.Component {
  state = {
    user: null,
    loading: true,
    error: null,
  };

  componentDidMount() {
    this.fetchUser();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.userId !== this.props.userId) {
      this.fetchUser();
    }
  }

  fetchUser = async () => {
    // Fetch logic...
  };

  render() {
    // Render logic...
  }
}

// ✅ After: Functional component with custom hooks
function UserProfile({ userId }) {
  const { user, loading, error } = useUser(userId);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;

  return <UserDisplay user={user} />;
}
```

### From Prop Drilling to Context

```tsx
// ❌ Before: Prop drilling through multiple components
function App() {
  const [theme, setTheme] = useState("light");

  return (
    <Layout theme={theme} setTheme={setTheme}>
      <Sidebar theme={theme} />
      <Content theme={theme} />
    </Layout>
  );
}

// ✅ After: Using context
const ThemeContext = createContext(null);

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

function App() {
  return (
    <ThemeProvider>
      <Layout>
        <Sidebar />
        <Content />
      </Layout>
    </ThemeProvider>
  );
}
```

## Resources

- [React Hooks Documentation](https://reactjs.org/docs/hooks-intro.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React Patterns](https://reactpatterns.com/)
- [SOLID Principles in TypeScript](https://khalilstemmler.com/articles/solid-principles/solid-typescript/)

## Further Reading

- [Epic 3: State Management Refactor](../business-requirements/epic-3-state-management-refactor-template/README.md)
- [Epic 4: Routing Improvements](../business-requirements/epic-4-routing-improvements-template/README.md)
