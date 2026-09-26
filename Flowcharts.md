# LNMIIT No Dues Application Workflow Flowcharts

Here are the flowcharts detailing the core architecture and user journeys of the No Dues portal you built. You can attach these directly into your project report. Most modern markdown editors (like Notion, GitHub, and Obsidian) will automatically render these Mermaid diagrams.

## 1. System Initialization & Admin Setup Flow
This shows how the system is seeded with data so that users can actually use it.

```mermaid
graph TD
    A([Admin Login]) --> B{Admin Dashboard Action}
    
    B -->|Manage Students| C[Upload Eligible Students CSV]
    C --> DB1[(Eligible Students Database)]
    DB1 -.->|Used to Validate| StudentLogin
    
    B -->|Manage Departments| D[Configure Department Staff Access]
    D --> E[Assign Specific Roles & Emails]
    E --> DB2[(Department Access Database)]
    DB2 -.->|Used to Validate| StaffLogin
    
    B -->|Monitor System| F[View Global Applications Overview]
    
    %% Styling
    classDef default fill:#1e1e1e,stroke:#444,stroke-width:2px,color:#fff
    classDef database fill:#2b4b7c,stroke:#4a76c4,stroke-width:2px,color:#fff
    classDef admin fill:#4a2b7c,stroke:#7c4ac4,stroke-width:2px,color:#fff
    
    class A,B,C,D,E,F admin
    class DB1,DB2 database
```

---

## 2. Complete Student Lifecycle Journey
This is the core flow showing how a student gets onto the platform, completes their profile, applies, and handles rejections based on the business logic we implemented.

```mermaid
graph TD
    Start([Start]) --> L{Login via Google OAuth}
    
    L --> V{Check DB: email in Eligible Students record?}
    V -- No --> Denied[Access Denied: Contact Admin]
    
    V -- Yes --> DB[(Fetch User Record)]
    DB --> Dashboard[Student Dashboard]

    Dashboard --> P{Is Profile Status Complete?}
    
    P -- No --> Fill[Navigate to Edit Profile]
    Fill --> Auto[View Auto-Filled Details Name, Roll No, Dept]
    Auto --> Select[Select Placement/Financial Status]
    Select --> Docs[Upload Specific Required Documents ID, BTP, Offer Letter, Cheque]
    Docs --> Save[Save & Lock Profile]
    Save --> P

    P -- Yes --> Apply{Has Applied for No Dues?}
    
    Apply -- No --> Submit[Click 'Apply for No Dues']
    Submit --> Init[Application created & Sent to All Departments]
    Init --> Track
    
    Apply -- Yes --> Track[Track Application Dashboard]

    Track --> Wait[Wait for Department Reviews]
    Wait --> DeptDec{Department Decision Process}

    DeptDec -- "On Hold (Rejected)" --> Hold[Status changes to 'On Hold']
    Hold --> Rectify[Click 'Reapply Now']
    Rectify --> Clarify[Add Clarification Comment Upload Supporting Docs]
    Clarify --> SubmitRe[Submit Reapplication]
    SubmitRe --> Wait

    DeptDec -- "Approved" --> Appr[Status: Approved for that Dept]
    Appr --> AllCleared{Are ALL Departments Approved?}

    AllCleared -- No --> Wait
    AllCleared -- Yes --> Final[Clearance Granted! No Dues Complete]
    Final --> End([End Process])
    
    %% Styling
    classDef default fill:#1e1e1e,stroke:#444,stroke-width:2px,color:#fff
    classDef student fill:#2b7c4a,stroke:#4ac476,stroke-width:2px,color:#fff
    classDef database fill:#2b4b7c,stroke:#4a76c4,stroke-width:2px,color:#fff
    classDef decision fill:#7c5c2b,stroke:#c49a4a,stroke-width:2px,color:#fff
    
    class Start,End,L,Denied,Dashboard,Fill,Auto,Select,Docs,Save,Submit,Init,Track,Wait,Hold,Rectify,Clarify,SubmitRe,Appr,Final student
    class DB database
    class V,P,Apply,DeptDec,AllCleared decision
```

---

## 3. Department Staff Clearance Protocol
This shows how department coordinators (like Library, HOD, TPC) process incoming applications.

```mermaid
graph TD
    Start([Start]) --> SLogin{Login via Google OAuth}
    
    SLogin --> CheckAuth{Check DB: Does Email have Department Access?}
    CheckAuth -- No --> Denied[Access Denied]
    
    CheckAuth -- Yes --> SDB[Department Staff Dashboard]
    SDB --> ViewStats[View Analytics & Application Stats]
    ViewStats --> List[View Pending Student Applications List]
    
    List --> Select[Select a Student Application]
    Select --> Review[Review Application Packet<br/>- Verify Profile Details<br/>- Inspect Uploaded Documents<br/>- Check previous logs/remarks]
    
    Review --> FileCheck{Are all requirements met?}

    FileCheck -- Yes --> Approve[Approve Clearance]
    Approve --> ApprLog[(Log Approval in DB)]
    ApprLog --> AppUpdate[Update Student Timeline]
    AppUpdate --> End([End Review])

    FileCheck -- No --> Reject[Place Application 'On Hold']
    Reject --> Reason[Select Standard Reason List & Add Comments]
    Reason --> RejLog[(Log Rejection/Hold in DB)]
    RejLog --> RejUpdate[Update Student Timeline]
    RejUpdate --> WaitStudent[Wait for Student to Reapply]

    WaitStudent -.->|Student Reapplies| Rep[Notification / Reappears in Pending]
    Rep --> List
    
    %% Styling
    classDef default fill:#1e1e1e,stroke:#444,stroke-width:2px,color:#fff
    classDef staff fill:#2a6f97,stroke:#61a5c2,stroke-width:2px,color:#fff
    classDef database fill:#2b4b7c,stroke:#4a76c4,stroke-width:2px,color:#fff
    classDef decision fill:#7c5c2b,stroke:#c49a4a,stroke-width:2px,color:#fff
    
    class Start,End,Denied,SDB,ViewStats,List,Select,Review,Approve,AppUpdate,Reject,Reason,RejUpdate,WaitStudent,Rep staff
    class ApprLog,RejLog database
    class SLogin,CheckAuth,FileCheck decision
```

---

## 4. Departmental Clearance Hierarchy (Level-by-Level)
This flowchart details the exact dependency graph when a No Dues application is submitted. Some departments can approve immediately (Level 1), while others wait until their specific prerequisites are met (Level 2, 3, 4).

```mermaid
graph TD
    classDef level1 fill:#2b7c4a,stroke:#4ac476,stroke-width:2px,color:#fff
    classDef level2 fill:#2a6f97,stroke:#61a5c2,stroke-width:2px,color:#fff
    classDef level3 fill:#7c5c2b,stroke:#c49a4a,stroke-width:2px,color:#fff
    classDef level4 fill:#4a2b7c,stroke:#7c4ac4,stroke-width:2px,color:#fff

    subgraph "Level 1: Independent Departments (Immediate)"
        LStaff[Library Staff]:::level1
        Warden[Hostel Warden]:::level1
        Sports[Sports Dept]:::level1
        LUCS[LUCS]:::level1
        Placement[Placement Cell / TPC]:::level1
        Medical[Medical]:::level1
        Admin[Administration]:::level1
        Labs[All Academic Labs<br/>CSE, ECE, MECH, Physics]:::level1
    end

    subgraph "Level 2: First-Tier Dependencies"
        LLib[Library Librarian]:::level2
        HOD[Head of Department<br/>Depends on Branch]:::level2
    end

    subgraph "Level 3: Second-Tier Dependencies"
        NAD[NAD Cell]:::level3
        Store[Central Store]:::level3
    end

    subgraph "Level 4: Final Clearance"
        Accounts[Finance & Accounts]:::level4
    end

    %% Level 1 to Level 2
    LStaff -->|Unlocks| LLib
    
    Labs -->|Unlocks| HOD
    LUCS -->|Unlocks| HOD
    LLib -->|Unlocks| HOD
    
    %% Level 2 to Level 3
    HOD -->|Unlocks| NAD
    HOD -->|Unlocks| Store
    Warden -->|Unlocks| Store
    
    %% Level 1, 2, 3 to Level 4 -> To reduce line clutter, we route them cleanly
    Medical --> Accounts
    Sports --> Accounts
    Admin --> Accounts
    Placement --> Accounts
    NAD --> Accounts
    Store --> Accounts
```
