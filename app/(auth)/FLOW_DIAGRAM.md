# Admin Setup Flow Diagram

## User Flow

```mermaid
flowchart TD
    A[User navigates to /setup] --> B{Check: Do admins exist?}
    B -->|Yes| C[Redirect to /admin-login]
    B -->|No| D[Show setup form]
    D --> E[User fills form]
    E --> F[User submits form]
    F --> G{Client-side validation}
    G -->|Invalid| H[Show field errors]
    H --> E
    G -->|Valid| I[Call Edge Function]
    I --> J{Server-side validation}
    J -->|Invalid token| K[Show error message]
    K --> E
    J -->|Valid| L{Check admins again}
    L -->|Admins exist| M[Return 403 error]
    M --> K
    L -->|No admins| N[Create auth user]
    N --> O{Auth user created?}
    O -->|Failed| P[Return error]
    P --> K
    O -->|Success| Q[Create admin record]
    Q --> R{Admin record created?}
    R -->|Failed| S[Rollback: Delete auth user]
    S --> P
    R -->|Success| T[Return success]
    T --> U[Redirect to /admin-login?setup=success]
    U --> V[Show success message]
    V --> W[Admin can now login]
```

## Component Architecture

```mermaid
graph TB
    subgraph "Frontend (Next.js)"
        A[Setup Page Component]
        B[Admin Login Page]
        C[GlassCard Component]
        D[GlassButton Component]
        E[GlassInput Component]
        F[Supabase Client]
    end
    
    subgraph "Backend (Supabase)"
        G[Edge Function: bootstrap-first-admin]
        H[Supabase Auth]
        I[PostgreSQL Database]
        J[admins table]
        K[auth.users table]
    end
    
    A --> C
    A --> D
    A --> E
    A --> F
    F --> G
    G --> H
    G --> I
    H --> K
    I --> J
    A --> B
```

## Security Flow

```mermaid
sequenceDiagram
    participant User
    participant SetupPage
    participant EdgeFunction
    participant SupabaseAuth
    participant Database
    
    User->>SetupPage: Navigate to /setup
    SetupPage->>Database: Check if admins exist
    Database-->>SetupPage: No admins found
    SetupPage->>User: Show setup form
    
    User->>SetupPage: Submit form with token
    SetupPage->>SetupPage: Validate fields
    SetupPage->>EdgeFunction: POST /bootstrap-first-admin
    
    EdgeFunction->>EdgeFunction: Validate setup token
    EdgeFunction->>Database: Check admins again
    Database-->>EdgeFunction: No admins
    
    EdgeFunction->>SupabaseAuth: Create auth user
    SupabaseAuth-->>EdgeFunction: Auth user created
    
    EdgeFunction->>Database: Create admin record
    Database-->>EdgeFunction: Admin record created
    
    EdgeFunction-->>SetupPage: Success response
    SetupPage->>User: Redirect to admin login
```

## Data Flow

```mermaid
graph LR
    A[User Input] --> B[Form Data]
    B --> C{Validation}
    C -->|Pass| D[API Request]
    C -->|Fail| E[Error Messages]
    D --> F[Edge Function]
    F --> G{Token Valid?}
    G -->|No| H[401 Error]
    G -->|Yes| I{Admins Exist?}
    I -->|Yes| J[403 Error]
    I -->|No| K[Create Auth User]
    K --> L[Create Admin Record]
    L --> M[Success Response]
    M --> N[Redirect]
    H --> E
    J --> E
```

## State Management

```mermaid
stateDiagram-v2
    [*] --> Checking: Page Load
    Checking --> Disabled: Admins Exist
    Checking --> Ready: No Admins
    Disabled --> [*]: Redirect to Login
    Ready --> Validating: Form Submit
    Validating --> Error: Validation Failed
    Validating --> Submitting: Validation Passed
    Error --> Ready: User Corrects
    Submitting --> Error: Server Error
    Submitting --> Success: Admin Created
    Success --> [*]: Redirect to Login
```

## Permission Structure

```mermaid
graph TD
    A[Super Admin] --> B[All Permissions]
    B --> C[manage_users]
    B --> D[manage_fictional_profiles]
    B --> E[manage_operators]
    B --> F[manage_chats]
    B --> G[view_analytics]
    B --> H[manage_payments]
    B --> I[manage_admins]
    B --> J[system_settings]
    B --> K[delete_data]
```

## Error Handling Flow

```mermaid
flowchart TD
    A[Error Occurs] --> B{Error Type}
    B -->|Validation Error| C[Show Field Error]
    B -->|Network Error| D[Show Generic Error]
    B -->|Auth Error| E[Show Auth Error]
    B -->|Database Error| F[Show Database Error]
    B -->|Token Error| G[Show Token Error]
    
    C --> H[User Can Retry]
    D --> H
    E --> H
    F --> H
    G --> H
    
    H --> I[Form Remains Active]
    I --> J[User Corrects and Resubmits]
```

## Deployment Flow

```mermaid
flowchart LR
    A[Local Development] --> B[Build & Test]
    B --> C[Deploy Edge Function]
    C --> D[Set Environment Variables]
    D --> E[Deploy Frontend]
    E --> F[Test in Staging]
    F --> G{Tests Pass?}
    G -->|No| H[Fix Issues]
    H --> B
    G -->|Yes| I[Deploy to Production]
    I --> J[Create First Admin]
    J --> K[Setup Complete]
```
