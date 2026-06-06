# 07-SITEMAP-USERFLOW.md
# StorageHub Sitemap and User Flow

Version: 1.0
Status: Draft Enterprise

---

# 1. Purpose

Dokumen ini menjelaskan struktur navigasi dan alur pengguna StorageHub agar frontend React dapat dibuat konsisten dan mudah digunakan pada mobile, tablet, dan desktop.

Arsitektur dan fitur utama tetap mengacu pada referensi StorageHub:
- FastAPI backend
- MySQL 8 database
- React.js + Vite + TailwindCSS frontend
- OAuth2/OIDC authentication
- Finder-like file explorer
- macOS Tahoe inspired UI
- mobile, tablet, desktop responsive
- chunk upload dan resume upload
- file sharing
- dashboard
- admin panel fileciteturn0file0L8-L19 fileciteturn0file0L21-L30

---

# 2. Information Architecture

StorageHub dibagi menjadi dua lapisan besar:

## Public Area
- Login
- OAuth redirect
- Error pages
- Public share view

## Private Area
- Dashboard
- Files
- Shared
- Search
- Trash
- Profile
- Settings
- Admin

---

# 3. Sitemap Overview

```text
StorageHub
├── Public
│   ├── Login
│   ├── OAuth Callback
│   ├── Error
│   └── Public Share View
│
└── App
    ├── Dashboard
    ├── Files
    │   ├── File Explorer
    │   ├── Folder View
    │   ├── Preview Panel
    │   └── Upload Manager
    ├── Shared
    │   ├── My Shares
    │   ├── Share Detail
    │   └── Create Share
    ├── Search
    │   ├── Search Overlay
    │   ├── Search Results
    │   └── Recent Searches
    ├── Trash
    │   ├── Trash List
    │   └── Restore Actions
    ├── Profile
    │   ├── Account
    │   ├── Security
    │   └── Sessions
    ├── Settings
    │   ├── Preferences
    │   ├── Storage Settings
    │   └── UI Settings
    └── Admin
        ├── Users
        ├── Quotas
        ├── Activity Logs
        └── System Settings
```

---

# 4. Sitemap by Device Class

## 4.1 Desktop Sitemap
Desktop menampilkan semua modul utama dengan sidebar permanen.

Menu:
- Dashboard
- Files
- Shared
- Search
- Trash
- Admin
- Settings

## 4.2 Tablet Sitemap
Tablet memakai sidebar collapsible.

Menu:
- Dashboard
- Files
- Shared
- Search
- Profile
- Settings

## 4.3 Mobile Sitemap
Mobile memakai bottom navigation.

Tab:
- Home
- Files
- Upload
- Shared
- Profile

---

# 5. Primary Navigation Rules

## 5.1 Always Visible
- current location
- search access
- upload access

## 5.2 Contextual Actions
- file actions muncul saat file dipilih
- folder actions muncul saat folder dipilih
- admin actions hanya muncul untuk admin

## 5.3 Navigation Priority
1. Files
2. Upload
3. Search
4. Shared
5. Profile

Karena StorageHub adalah aplikasi file-centric, folder dan file explorer harus selalu menjadi pusat pengalaman.

---

# 6. User Flow Principles

## 6.1 User Flow Goals
- login cepat
- landing ke dashboard atau file explorer
- akses file minimal klik
- upload harus jelas
- share harus mudah
- search harus instan

## 6.2 UX Rule
- jangan memaksa user melalui banyak halaman
- gunakan modal atau drawer untuk aksi kecil
- gunakan full page hanya untuk area kerja utama

---

# 7. Login User Flow

## 7.1 Flow Diagram

```text
Open StorageHub
→ Login Screen
→ Choose Provider
→ OAuth Redirect
→ OAuth Callback
→ Check User Exists
→ If Exists: Login
→ If Not Exists: Auto Create User
→ Create Root Folder
→ Assign Quota
→ Redirect to Dashboard
```

## 7.2 Flow Details
1. User membuka aplikasi
2. User melihat provider login
3. User memilih Google/GitHub/Microsoft/OIDC
4. Provider melakukan autentikasi
5. Backend menerima callback
6. Sistem mengecek apakah email/provider sudah terdaftar
7. Jika belum ada, sistem membuat user baru
8. Sistem membuat root folder otomatis
9. Sistem memberi quota default
10. User diarahkan ke dashboard

## 7.3 Edge Cases
- provider gagal
- email provider tidak tersedia
- state validation gagal
- user disabled
- quota policy error

---

# 8. First-Time User Flow

```text
OAuth Success
→ User Not Found
→ Create User
→ Create Root Folder
→ Default Quota Applied
→ Create Activity Log
→ Dashboard
```

## Behavior
User baru tidak perlu registrasi manual.
Seluruh provisioning dilakukan otomatis.

---

# 9. Returning User Flow

```text
Open App
→ OAuth Login
→ User Found
→ Token Issued
→ Dashboard / Last Location
```

## Behavior
- user diarahkan ke lokasi terakhir jika tersedia
- jika tidak, masuk ke dashboard

---

# 10. Dashboard Flow

## 10.1 Purpose
Dashboard menjadi ringkasan storage dan shortcut ke aktivitas utama.

## 10.2 Flow
```text
Login
→ Dashboard
→ View Storage Summary
→ Recent Files
→ Recent Uploads
→ Quick Actions
```

## 10.3 Quick Actions
- Upload File
- New Folder
- Search
- Share
- Open Files

## 10.4 Navigation From Dashboard
- klik recent file → file detail / preview
- klik recent upload → upload session detail
- klik shared file → share detail
- klik storage card → file explorer

---

# 11. File Explorer Flow

## 11.1 Purpose
Ini adalah pusat penggunaan StorageHub.

## 11.2 Flow
```text
Open Files
→ Load Current Folder
→ Show Breadcrumb
→ Render Grid/List/Column
→ Select Item
→ Context Actions
```

## 11.3 File Explorer Actions
- open folder
- preview file
- rename
- move
- copy
- delete
- share
- download

## 11.4 Breadcrumb Flow
```text
Root
→ /Users
→ /Users/Me
→ /Users/Me/Firmware
```

## 11.5 View Switching
- grid untuk visual file
- list untuk detail cepat
- column untuk folder hierarchy

---

# 12. Folder Navigation Flow

## 12.1 Open Folder
```text
Click Folder
→ Load Children
→ Update Breadcrumb
→ Render Content
```

## 12.2 Create Folder
```text
Click New Folder
→ Modal Input Name
→ Submit
→ API Create Folder
→ Update Explorer
```

## 12.3 Rename Folder
```text
Select Folder
→ Rename Action
→ Modal Input Name
→ Save
→ Refresh View
```

## 12.4 Move Folder
```text
Select Folder
→ Move Action
→ Choose Destination
→ Confirm
→ Refresh Tree
```

---

# 13. File Upload Flow

## 13.1 Simple Upload Flow
```text
Click Upload
→ Select File
→ Validate Size / Quota
→ Start Upload
→ Show Progress
→ Complete
→ Refresh Explorer
```

## 13.2 Chunk Upload Flow
```text
Select File
→ Split Into Chunks
→ Create Upload Session
→ Upload Chunk 1..N
→ Track Progress
→ Resume if Failed
→ Merge Chunks
→ Verify Checksum
→ Create File Record
```

## 13.3 Drag and Drop Flow
```text
Drag Files Into Explorer
→ Drop Zone Activated
→ Validate
→ Start Queue
→ Show Upload Manager
```

## 13.4 Upload Error Flow
- quota exceeded
- network interrupted
- chunk failed
- checksum mismatch
- insufficient storage

## 13.5 Resume Flow
```text
Upload Interrupted
→ Reopen App
→ Load Session
→ Fetch Missing Chunks
→ Continue Upload
```

---

# 14. File Download Flow

## 14.1 Direct Download
```text
Select File
→ Click Download
→ Backend Checks Permission
→ Stream File
→ Save To Device
```

## 14.2 Resume Download
```text
Download Interrupted
→ Retry
→ Use Range Request
→ Continue From Last Byte
```

## 14.3 Download Feedback
- start toast
- progress indicator
- completion toast
- error modal if failed

---

# 15. Sharing Flow

## 15.1 Create Share Flow
```text
Select File / Folder
→ Click Share
→ Open Share Modal
→ Set Password / Expiry / Limit
→ Generate Token
→ Copy Link
```

## 15.2 Public Share Access
```text
Open Share Link
→ Validate Token
→ Check Expiry
→ Check Password If Needed
→ Show File or Folder Preview
→ Download / Open
```

## 15.3 Revoke Share Flow
```text
Open Share Detail
→ Click Revoke
→ Confirm
→ Disable Token
→ Link Becomes Invalid
```

---

# 16. Search Flow

## 16.1 Search Entry
```text
Press Ctrl + K
→ Search Overlay Opens
→ Type Query
→ Receive Results
→ Select Result
→ Open File or Folder
```

## 16.2 Search Scope
- filename
- folder name
- extension
- size
- date
- owner

## 16.3 Search Result Types
- file result
- folder result
- share result
- recent search result

## 16.4 Search Empty State
- no match message
- reset filter
- show recent searches

---

# 17. Trash Flow

## 17.1 Soft Delete Flow
```text
Delete File / Folder
→ Confirm
→ Move to Trash
→ Mark Deleted
→ Remove from Main Explorer
```

## 17.2 Restore Flow
```text
Open Trash
→ Select Item
→ Restore
→ Return to Original or Safe Location
```

## 17.3 Permanent Delete Flow
```text
Open Trash
→ Select Item
→ Delete Permanently
→ Confirm
→ Remove from Database and Storage
```

---

# 18. Profile Flow

## 18.1 View Profile
```text
Open Profile
→ Show Name
→ Email
→ Provider
→ Quota
→ Sessions
```

## 18.2 Logout
```text
Click Logout
→ Revoke Refresh Token
→ Clear Session
→ Redirect to Login
```

---

# 19. Admin Flow

## 19.1 User Management Flow
```text
Admin Panel
→ Users
→ Select User
→ Edit Quota / Status / Role
→ Save
→ Refresh Table
```

## 19.2 Activity Log Flow
```text
Admin Panel
→ Activity Logs
→ Filter by User / Action / Date
→ View Detail
```

## 19.3 System Settings Flow
```text
Admin Panel
→ Settings
→ Edit Default Quota
→ Edit Trash Retention
→ Edit Upload Limit
→ Save
```

---

# 20. Mobile Specific Flows

## 20.1 Mobile Navigation
- Home
- Files
- Upload
- Shared
- Profile

## 20.2 Mobile Upload Flow
- tap upload floating button
- select file
- show bottom sheet upload manager
- progress stays visible

## 20.3 Mobile Share Flow
- open file
- tap share
- open sheet modal
- copy link

## 20.4 Mobile Search Flow
- tap search
- full screen search overlay
- keyboard focused automatically

---

# 21. Tablet Specific Flows

## 21.1 Tablet Layout
- sidebar collapsible
- explorer area lebih luas
- preview drawer muncul dari kanan
- drag and drop tetap aktif

## 21.2 Interaction
- tap untuk select
- long press untuk context action
- split view kalau layar cukup lebar

---

# 22. Desktop Specific Flows

## 22.1 Desktop Layout
- sidebar permanen
- toolbar lengkap
- explorer mendominasi layar
- preview panel bisa dibuka / ditutup

## 22.2 Desktop Efficiency
- multi-select
- keyboard shortcuts
- drag and drop antar folder
- context menu penuh

---

# 23. Sitemap Details by Page Depth

## Public
- /login
- /auth/callback
- /share/{token}
- /error

## App
- /app/dashboard
- /app/files
- /app/files/:folderId
- /app/shared
- /app/search
- /app/trash
- /app/profile
- /app/settings
- /app/admin/users
- /app/admin/logs
- /app/admin/settings

---

# 24. Keyboard Shortcuts

- `Ctrl + K` → Search overlay
- `Ctrl + U` → Upload
- `Ctrl + N` → New folder
- `Delete` → Move to trash
- `Enter` → Open selected item
- `Esc` → Close modal / search
- `Backspace` → Previous folder in explorer

---

# 25. User Flow Summary

## Main Happy Path
```text
Login
→ Dashboard
→ Files
→ Upload
→ Share
→ Search
→ Profile
```

## Admin Happy Path
```text
Login
→ Dashboard
→ Admin
→ Manage Users
→ Manage Quota
→ Review Logs
```

## Public Share Happy Path
```text
Open Share Link
→ Validate
→ Preview / Download
```

---

# 26. Acceptance Criteria

Sitemap dan user flow dianggap selesai jika:
- user bisa login dan masuk dashboard
- user bisa navigasi file explorer dengan cepat
- upload besar bisa dimulai dan dilanjutkan
- share link bisa dibuat dan dibuka
- search bisa diakses dari mana pun
- mobile layout tetap usable
- admin flow jelas dan terpisah

---

# 27. Summary

Dokumen ini menyusun navigasi StorageHub agar seluruh halaman, modal, dan alur interaksi dapat dibangun konsisten di React frontend. Fokus utama tetap pada file explorer, upload, search, sharing, dan admin seperti yang didefinisikan pada referensi StorageHub.
