# 08-WIREFRAMES.md
# StorageHub Wireframes

Version: 1.0
Status: Draft Enterprise

---

# 1. Wireframe Purpose

Dokumen ini mendeskripsikan struktur visual tiap halaman StorageHub secara tekstual agar mudah diubah menjadi desain Figma, layout React, atau prototype interaktif.

Dasar desain tetap mengikuti referensi StorageHub:
- FastAPI backend
- MySQL 8 database
- React.js + Vite + TailwindCSS frontend
- OAuth2/OIDC login
- Finder-like file explorer
- macOS Tahoe inspired UI
- glassmorphism
- responsive mobile, tablet, desktop
- chunk upload
- resume upload
- sharing
- search
- dashboard
- admin panel fileciteturn0file0L8-L19 fileciteturn0file0L21-L30

---

# 2. Wireframe Conventions

## 2.1 Symbols
- `[ ]` = area / container
- `( )` = input / control
- `{ }` = dynamic content
- `<>` = action button
- `||` = sidebar / panel boundary

## 2.2 Layout Rules
- Desktop: sidebar + top toolbar + content area + optional preview panel
- Tablet: collapsible sidebar + content + optional drawer
- Mobile: top app bar + content + bottom navigation + sheets / modals

## 2.3 Reusable Patterns
- glass card
- floating panel
- preview drawer
- action sheet
- modal dialog
- toast notification
- empty state

---

# 3. Global App Shell Wireframe

## 3.1 Desktop App Shell

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Top Bar                                                                      │
│ [Logo] [Breadcrumbs] [Search] [Upload] [Profile]                             │
├───────────────┬───────────────────────────────────────────┬──────────────────┤
│ Sidebar       │ Main Content Area                         │ Preview Panel    │
│ - Dashboard   │ [Page content / grids / lists / forms]    │ [File preview]   │
│ - Files       │                                           │ [Metadata]       │
│ - Shared      │                                           │ [Actions]        │
│ - Search      │                                           │                  │
│ - Trash       │                                           │                  │
│ - Admin       │                                           │                  │
│ - Settings    │                                           │                  │
└───────────────┴───────────────────────────────────────────┴──────────────────┘
```

## 3.2 Mobile App Shell

```text
┌──────────────────────────────┐
│ Top Bar                      │
│ [Logo]      [Search] [Menu]  │
├──────────────────────────────┤
│ Main Content Area            │
│ {Page content}               │
│                              │
│                              │
├──────────────────────────────┤
│ Bottom Nav                   │
│ Home | Files | Upload |      │
│ Shared | Profile             │
└──────────────────────────────┘
```

## 3.3 Tablet App Shell

```text
┌────────────────────────────────────────────┐
│ Top Bar                                    │
│ [Menu] [Breadcrumbs] [Search] [Upload]     │
├───────────────┬────────────────────────────┤
│ Collapsible   │ Main Content Area          │
│ Sidebar       │ {Page content}             │
│               │                            │
└───────────────┴────────────────────────────┘
```

---

# 4. Login Page Wireframe

## 4.1 Goal
Memungkinkan user login cepat dengan OAuth provider.

## 4.2 Desktop Wireframe

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Background gradient / blur / floating shapes                         │
│                                                                      │
│                     ┌────────────────────────────┐                   │
│                     │ [StorageHub Logo]          │                   │
│                     │ Lightweight File Storage   │                   │
│                     │                            │                   │
│                     │ <Continue with Google>      │                   │
│                     │ <Continue with GitHub>      │                   │
│                     │ <Continue with Microsoft>   │                   │
│                     │ <Continue with OIDC>        │                   │
│                     │                            │                   │
│                     │ Terms / Privacy / Help     │                   │
│                     └────────────────────────────┘                   │
└──────────────────────────────────────────────────────────────────────┘
```

## 4.3 Mobile Wireframe

```text
┌──────────────────────────────┐
│ [Logo]                       │
│ StorageHub                   │
│ Lightweight storage platform │
│                              │
│ <Continue with Google>       │
│ <Continue with GitHub>       │
│ <Continue with Microsoft>    │
│ <Continue with OIDC>         │
│                              │
│ Terms | Privacy              │
└──────────────────────────────┘
```

## 4.4 Components
- logo
- title
- provider buttons
- helper text
- loading state
- error state

## 4.5 States
- default
- loading
- provider error
- callback error

---

# 5. Dashboard Wireframe

## 5.1 Goal
Menampilkan ringkasan storage dan shortcut ke aktivitas utama.

## 5.2 Desktop Wireframe

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Top Bar [Breadcrumbs] [Search] [Upload] [Profile]                            │
├───────────────┬──────────────────────────────────────────────────────────────┤
│ Sidebar       │ Dashboard                                                   │
│ - Dashboard   │ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐  │
│ - Files       │ │ Used Storage │ │ Free Quota   │ │ Quick Actions        │  │
│ - Shared      │ │ 12.8 TB      │ │ 27.2 TB      │ │ Upload New Folder    │  │
│ - Search      │ └──────────────┘ └──────────────┘ │ Search Share         │  │
│ - Trash       │ ┌────────────────────────────────┐ └──────────────────────┘  │
│ - Admin       │ │ Recent Files                   │                          │
│ - Settings    │ │ - backup.zip                   │                          │
│               │ │ - firmware.bin                 │                          │
│               │ │ - notes.md                     │                          │
│               │ └────────────────────────────────┘                          │
│               │ ┌────────────────────────────────┐                          │
│               │ │ Recent Uploads                 │                          │
│               │ └────────────────────────────────┘                          │
└───────────────┴──────────────────────────────────────────────────────────────┘
```

## 5.3 Mobile Wireframe

```text
┌──────────────────────────────┐
│ Top Bar                      │
│ StorageHub                   │
├──────────────────────────────┤
│ [Used Storage Card]          │
│ [Free Quota Card]            │
│ [Quick Actions]              │
│ [Recent Files]               │
│ [Recent Uploads]             │
├──────────────────────────────┤
│ Bottom Nav                   │
└──────────────────────────────┘
```

## 5.4 Components
- storage summary card
- quick actions card
- recent files list
- recent uploads list
- shared files card

---

# 6. File Explorer Wireframe

## 6.1 Goal
Menjadi pusat utama pengelolaan file.

## 6.2 Desktop Wireframe

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Top Bar [Back] [Forward] [Breadcrumbs] [Search] [Upload] [View Toggle]      │
├───────────────┬───────────────────────────────────────────┬──────────────────┤
│ Folder Tree   │ File Area                                  │ Preview Panel    │
│ - Root        │ ┌─────┐ ┌─────┐ ┌─────┐                    │ [Thumbnail]      │
│ - Firmware    │ │file1│ │file2│ │file3│                    │ Filename         │
│ - Backup      │ └─────┘ └─────┘ └─────┘                    │ Size             │
│ - ISO         │ ┌───────────────────────────────────────┐  │ Date             │
│ - Shared      │ │ File list / grid / column view       │  │ Owner            │
│               │ │                                       │  │ Actions          │
│               │ └───────────────────────────────────────┘  │                  │
└───────────────┴───────────────────────────────────────────┴──────────────────┘
```

## 6.3 Grid View
- file thumbnail besar
- filename
- size
- action menu
- selection checkbox

## 6.4 List View
- filename
- size
- modified date
- owner
- status
- share indicator

## 6.5 Column View
- folder hierarchy visible
- klik folder membuka column baru
- cocok untuk navigasi bertingkat

## 6.6 Mobile Wireframe

```text
┌──────────────────────────────┐
│ Top Bar [Search] [Menu]      │
├──────────────────────────────┤
│ Breadcrumbs                  │
│ ┌──────────┐ ┌──────────┐    │
│ │ File Card│ │ File Card│    │
│ └──────────┘ └──────────┘    │
│ ┌──────────┐ ┌──────────┐    │
│ │ File Card│ │ File Card│    │
│ └──────────┘ └──────────┘    │
│ Floating Upload Button       │
└──────────────────────────────┘
```

## 6.7 Components
- breadcrumbs
- folder tree
- file grid
- file list
- preview panel
- context menu
- floating upload button

---

# 7. Folder View Wireframe

## 7.1 Goal
Menampilkan folder beserta isi dan subfolder.

```text
┌─────────────────────────────────────────────────────────────┐
│ Breadcrumbs                                                 │
├─────────────────────────────────────────────────────────────┤
│ [Subfolder Card] [Subfolder Card] [Subfolder Card]         │
│                                                             │
│ [File Row]                                                  │
│ [File Row]                                                  │
│ [File Row]                                                  │
└─────────────────────────────────────────────────────────────┘
```

## 7.2 Actions
- open
- rename
- move
- delete
- share
- add file

---

# 8. Upload Manager Wireframe

## 8.1 Goal
Menangani upload besar dan progress dengan jelas.

## 8.2 Desktop Wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ Upload Manager                                               │
├──────────────────────────────────────────────────────────────┤
│ firmware.bin                                                 │
│ [██████████░░░░░░░░░░] 68%  12.4 MB/s  ETA 02:10             │
│ <Pause> <Resume> <Cancel>                                    │
├──────────────────────────────────────────────────────────────┤
│ backup.zip                                                  │
│ [████████████████░░░] 82%  8.1 MB/s  ETA 00:54              │
│ <Pause> <Resume> <Cancel>                                    │
└──────────────────────────────────────────────────────────────┘
```

## 8.3 Mobile Wireframe

```text
┌──────────────────────────────┐
│ Upload Queue                 │
├──────────────────────────────┤
│ firmware.bin                 │
│ [██████░░░░] 68%             │
│ Pause | Resume | Cancel      │
├──────────────────────────────┤
│ backup.zip                   │
│ [████████░░] 82%             │
│ Pause | Resume | Cancel      │
└──────────────────────────────┘
```

## 8.4 States
- queued
- uploading
- paused
- retrying
- completed
- failed

---

# 9. Share Modal Wireframe

## 9.1 Goal
Membuat share link file atau folder.

```text
┌─────────────────────────────────────────────┐
│ Share File                                 ×│
├─────────────────────────────────────────────┤
│ Target: backup.zip                          │
│                                             │
│ ( ) Public Link                             │
│ ( ) Private Link                            │
│ ( ) Password Protected                      │
│                                             │
│ Password: (********)                        │
│ Expiry Date: (YYYY-MM-DD)                  │
│ Max Downloads: (10)                        │
│                                             │
│ Share URL                                  │
│ [https://...]  <Copy Link>                │
│                                             │
│ <Cancel>                       <Create>     │
└─────────────────────────────────────────────┘
```

## 9.2 Mobile Sheet
- full width sheet
- copy link button paling dominan
- settings collapsed in accordion

---

# 10. Search Overlay Wireframe

## 10.1 Goal
Spotlight-style search yang cepat.

```text
┌─────────────────────────────────────────────┐
│ Search                                     ×│
├─────────────────────────────────────────────┤
│ ( Search files, folders, shares... )       │
│                                             │
│ Recent Searches                             │
│ - firmware                                  │
│ - backup                                    │
│ - vpn config                                │
│                                             │
│ Results                                     │
│ [File] firmware.bin                        │
│ [Folder] Backup                             │
│ [Share] firmware link                       │
└─────────────────────────────────────────────┘
```

## 10.2 Behavior
- modal overlay
- background blur
- keyboard focus otomatis
- result list live update

---

# 11. Shared Page Wireframe

## 11.1 Goal
Melihat semua share yang dibuat user.

```text
┌─────────────────────────────────────────────────────────────┐
│ Shared                                                       │
├─────────────────────────────────────────────────────────────┤
│ [Share Card] backup.zip     Active     Exp: 2026-12-31       │
│ <Copy> <Revoke> <Edit>                                      │
│                                                             │
│ [Share Card] firmware.bin   Password    Exp: 2026-01-10     │
│ <Copy> <Revoke> <Edit>                                      │
└─────────────────────────────────────────────────────────────┘
```

## 11.2 Components
- share card
- status badge
- copy button
- revoke button
- edit button

---

# 12. Trash Wireframe

```text
┌─────────────────────────────────────────────────────────────┐
│ Trash                                                        │
├─────────────────────────────────────────────────────────────┤
│ [Deleted File] backup-old.zip      Deleted 2 days ago       │
│ <Restore> <Delete Permanently>                              │
│                                                             │
│ [Deleted Folder] old-configs      Deleted 10 days ago       │
│ <Restore> <Delete Permanently>                              │
└─────────────────────────────────────────────────────────────┘
```

## Trash Notes
- tampilkan waktu penghapusan
- tampilkan sisa retensi
- restore harus jelas

---

# 13. Profile Page Wireframe

```text
┌─────────────────────────────────────────────────────────────┐
│ Profile                                                      │
├─────────────────────────────────────────────────────────────┤
│ [Avatar]  Full Name                                          │
│ Email: user@example.com                                      │
│ Provider: Google                                             │
│ Role: User                                                   │
│ Storage: 12.8 TB / 40 TB                                     │
│                                                             │
│ <Logout>                                                     │
└─────────────────────────────────────────────────────────────┘
```

## Fields
- avatar
- full name
- email
- provider
- quota
- used storage
- session info

---

# 14. Settings Wireframe

```text
┌─────────────────────────────────────────────────────────────┐
│ Settings                                                     │
├─────────────────────────────────────────────────────────────┤
│ Appearance                                                  │
│ [Light] [Dark] [System]                                     │
│                                                             │
│ File Preferences                                            │
│ - Default view: Grid / List / Column                       │
│ - Sort order                                               │
│ - Thumbnail mode                                            │
│                                                             │
│ Upload Preferences                                          │
│ - chunk size                                               │
│ - auto resume                                              │
└─────────────────────────────────────────────────────────────┘
```

---

# 15. Admin Users Wireframe

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Admin / Users                                                        │
├──────────────────────────────────────────────────────────────────────┤
│ Search (email/name)  Filter (role/status)                            │
├──────────────────────────────────────────────────────────────────────┤
│ Name | Email | Role | Status | Quota | Used | Last Login | Actions   │
│ ...                                                                  │
│ [Edit] [Disable] [Delete]                                            │
└──────────────────────────────────────────────────────────────────────┘
```

## Actions
- edit role
- change quota
- disable user
- view logs

---

# 16. Admin Logs Wireframe

```text
┌─────────────────────────────────────────────────────────────┐
│ Admin / Activity Logs                                       │
├─────────────────────────────────────────────────────────────┤
│ Filter by action / user / date                              │
│                                                             │
│ [timestamp] [user] [action] [resource]                      │
│ - login                                                     │
│ - upload_file                                               │
│ - share_created                                             │
└─────────────────────────────────────────────────────────────┘
```

---

# 17. Public Share View Wireframe

```text
┌─────────────────────────────────────────────────────────────┐
│ StorageHub Share                                            │
├─────────────────────────────────────────────────────────────┤
│ File: backup.zip                                            │
│ Size: 12.4 GB                                               │
│ Owner: user@example.com                                     │
│                                                             │
│ If password protected:                                      │
│ ( Password ) <Open>                                         │
│                                                             │
│ <Download>                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

# 18. Empty States

## 18.1 Empty Files
```text
┌──────────────────────────────┐
│ No files yet                 │
│ Upload your first file       │
│ <Upload>                     │
└──────────────────────────────┘
```

## 18.2 Empty Search
```text
┌──────────────────────────────┐
│ No results found             │
│ Try another keyword          │
└──────────────────────────────┘
```

## 18.3 Empty Trash
```text
┌──────────────────────────────┐
│ Trash is empty               │
└──────────────────────────────┘
```

---

# 19. Loading States

## 19.1 Skeletons
- dashboard cards skeleton
- file grid skeleton
- list row skeleton
- share list skeleton

## 19.2 Loading Rules
- gunakan skeleton daripada blank screen
- upload progress tetap terlihat
- hindari blocking terlalu lama

---

# 20. Error States

## 20.1 Common Errors
- network error
- authentication error
- permission denied
- quota exceeded
- storage full
- file not found

## 20.2 Error UI Format
```text
[Icon]
Title
Short explanation
<Action Button>
```

---

# 21. Responsive Wireframe Rules

## Mobile
- satu kolom
- bottom nav
- modal full width
- action sheet untuk context menu

## Tablet
- dua kolom bila cukup lebar
- preview drawer
- sidebar collapsible

## Desktop
- multi panel
- preview side panel
- context menu lengkap

---

# 22. Component Mapping to React

| Wireframe Area | React Component |
|---|---|
| App Shell | AppShell |
| Sidebar | DesktopSidebar |
| Bottom Nav | MobileBottomNav |
| File Grid | FileGrid |
| File List | FileList |
| Column View | ColumnView |
| Upload Manager | UploadManager |
| Share Modal | ShareModal |
| Search Overlay | SearchOverlay |
| Admin Table | AdminUserTable |
| Logs | ActivityLogTable |

---

# 23. Implementation Hints

## For Figma
- gunakan frame desktop, tablet, mobile
- jadikan glass card sebagai base component
- buat variant state untuk hover, selected, disabled

## For React
- pecah jadi komponen kecil
- gunakan props untuk data-driven rendering
- gunakan modal dan drawer untuk aksi cepat

---

# 24. Final Wireframe Summary

Setiap halaman StorageHub harus mengikuti urutan prioritas:
1. file content
2. file actions
3. search
4. sharing
5. admin

Dengan pendekatan ini, tampilan akan terasa seperti file manager modern yang ringan, premium, dan sangat cocok untuk perangkat mobile, tablet, maupun desktop.
