# 06-UI-UX-SPEC.md
# StorageHub UI/UX Design System

Version: 1.0
Status: Draft Enterprise

---

# 1. Design Objective

StorageHub harus terasa:
- modern
- ringan
- premium
- cepat
- clean
- file-focused
- seperti macOS Tahoe / Finder
- nyaman di mobile, tablet, dan desktop

Desain ini mengikuti referensi utama StorageHub:
- backend FastAPI
- database MySQL 8
- frontend React.js + Vite + TailwindCSS
- OAuth2/OIDC
- macOS Tahoe inspired
- Finder-like explorer
- glassmorphism
- responsive mobile/tablet/desktop
- dashboard, file sharing, search, admin panel

---

# 2. Design Philosophy

## 2.1 Core Principles
1. Content first
2. File explorer menjadi pusat UI
3. Toolbar harus minimal
4. Sidebar harus floating dan ringan
5. Akses cepat ke upload, search, share
6. Animasi halus dan tidak berlebihan
7. Tetap nyaman di layar kecil

## 2.2 UI Personality
- elegant
- calm
- translucent
- soft
- adaptive
- utility-driven

## 2.3 Visual Inspiration
- macOS Tahoe
- Finder
- Apple Files App
- iCloud Drive

---

# 3. Visual Language

## 3.1 Style Keywords
- Liquid Glass
- Frosted Glass
- Floating Panels
- Soft Shadows
- Rounded Corners
- Subtle Borders
- Adaptive Blur
- Minimal Chrome

## 3.2 Core UI Behaviors
- panel mengambang
- hover halus
- focus ring jelas
- selected state tegas
- spacing lega
- typography bersih

---

# 4. Color System

## 4.1 Brand Colors
Primary Accent:
- `#007AFF`

Success:
- `#34C759`

Warning:
- `#FF9F0A`

Danger:
- `#FF453A`

## 4.2 Light Mode Palette
Background:
- `#F5F7FA`

Surface:
- `rgba(255,255,255,0.65)`

Surface Strong:
- `rgba(255,255,255,0.82)`

Border:
- `rgba(255,255,255,0.40)`

Text Primary:
- `#111827`

Text Secondary:
- `#6B7280`

Text Muted:
- `#9CA3AF`

## 4.3 Dark Mode Palette
Background:
- `#0F1115`

Surface:
- `rgba(25,28,34,0.70)`

Surface Strong:
- `rgba(35,39,48,0.86)`

Border:
- `rgba(255,255,255,0.08)`

Text Primary:
- `#FFFFFF`

Text Secondary:
- `#C7CDD8`

Text Muted:
- `#8B93A7`

---

# 5. Typography

## 5.1 Font Family
Primary:
- Inter

Optional if available:
- SF Pro Display style fallback

## 5.2 Type Scale
Display:
- 32px / 40px / 700

H1:
- 28px / 36px / 700

H2:
- 24px / 32px / 600

H3:
- 20px / 28px / 600

Body:
- 16px / 24px / 400

Body Small:
- 14px / 20px / 400

Caption:
- 12px / 16px / 500

## 5.3 Typography Rules
- Judul singkat
- Paragraph ringkas
- Metadata lebih kecil
- Hindari teks terlalu padat
- File name harus paling menonjol

---

# 6. Spacing and Radius

## 6.1 Spacing Scale
- 4px
- 8px
- 12px
- 16px
- 20px
- 24px
- 32px
- 40px

## 6.2 Radius Scale
- Small: 12px
- Medium: 16px
- Large: 24px
- Extra Large: 28px

## 6.3 Elevation
- Low: subtle shadow
- Medium: floating card
- High: modal / dialog / search overlay

---

# 7. Layout System

## 7.1 Desktop Layout
Structure:
- floating sidebar left
- top toolbar
- content area
- optional preview panel right
- modal overlays for upload/share/search

### Desktop Grid
- Sidebar: 280px
- Main Content: fluid
- Preview Panel: 320px optional
- Top Toolbar: 64px to 72px

## 7.2 Tablet Layout
Structure:
- collapsible sidebar
- main content full width
- preview drawer on demand
- touch-friendly controls

### Tablet Grid
- Sidebar: 72px collapsed or off-canvas
- Content: 100%
- Toolbar: 64px

## 7.3 Mobile Layout
Structure:
- top app bar
- content area
- bottom navigation
- floating upload button
- sheet modal for actions

### Mobile Grid
- Sidebar: hidden / drawer
- Content: full width
- Bottom nav: 5 items

---

# 8. Navigation Structure

## 8.1 Desktop Sidebar Menu
- Dashboard
- Files
- Shared
- Search
- Trash
- Admin
- Settings

## 8.2 Mobile Bottom Navigation
- Home
- Files
- Upload
- Shared
- Profile

## 8.3 Navigation Behavior
- current section highlighted
- breadcrumb always visible in explorer
- search shortcut `Ctrl + K`
- upload button accessible from all main views

---

# 9. Core Screens

## 9.1 Login Screen
Goal:
- masuk cepat dengan OAuth

Components:
- logo
- product title
- subtitle singkat
- provider buttons
- loading indicator
- error message

Actions:
- Continue with Google
- Continue with GitHub
- Continue with Microsoft
- Continue with OIDC

Visual:
- centered glass card
- blurred gradient background
- soft ambient shapes

---

## 9.2 Dashboard Screen
Goal:
- ringkasan storage

Components:
- storage usage card
- recent files list
- recent uploads
- shared files
- quick actions

Quick Actions:
- Upload
- New Folder
- Search
- Share

---

## 9.3 File Explorer Screen
Goal:
- pusat operasi file

Components:
- sidebar folder tree
- breadcrumb
- toolbar
- file grid/list/column
- preview panel
- context menu
- upload drop zone

Views:
- Grid
- List
- Column

Empty State:
- no files
- no folders
- no search result

---

## 9.4 Shared Screen
Goal:
- melihat semua link share

Components:
- share cards
- token status
- expiry info
- revoke button
- copy link button

---

## 9.5 Search Screen
Goal:
- pencarian cepat ala Spotlight

Components:
- search overlay
- result cards
- filters
- recent searches
- keyboard shortcuts hint

Shortcut:
- `Ctrl + K`

---

## 9.6 Trash Screen
Goal:
- restore atau hapus permanen

Components:
- trash list
- restore action
- permanent delete action
- retention info

---

## 9.7 Admin Screen
Goal:
- user dan quota management

Components:
- user table
- quota editor
- status toggle
- logs preview
- system settings form

---

## 9.8 Profile Screen
Goal:
- akun dan session management

Components:
- avatar
- name
- email
- provider
- quota usage
- logout button

---

# 10. Finder-like File Explorer Spec

## 10.1 Explorer Goals
File explorer harus terasa seperti Finder:
- navigasi folder cepat
- file card jelas
- list view compact
- column view untuk hierarki
- preview panel opsional

## 10.2 Toolbar Actions
- Back
- Forward
- Up
- Upload
- New Folder
- Share
- Search
- View Toggle
- Sort
- More

## 10.3 View Modes

### Grid View
Cocok untuk:
- image
- video
- file umum

### List View
Cocok untuk:
- folder besar
- metadata banyak
- operasi cepat

### Column View
Cocok untuk:
- struktur folder dalam
- navigasi hierarki

---

# 11. Component Library

## 11.1 Layout Components
- AppShell
- DesktopSidebar
- MobileBottomNav
- TopToolbar
- Breadcrumbs
- PreviewPanel
- GlassCard

## 11.2 File Components
- FileCard
- FileRow
- FolderCard
- FileIcon
- FileBadge
- FileMetadata
- SelectionCheckbox

## 11.3 Action Components
- PrimaryButton
- SecondaryButton
- IconButton
- SplitButton
- DropdownMenu
- ContextMenu
- ActionSheet

## 11.4 Modal Components
- UploadModal
- ShareModal
- RenameModal
- MoveModal
- DeleteConfirmModal
- PreviewModal
- LoginModal

## 11.5 Feedback Components
- Toast
- EmptyState
- ErrorState
- LoadingSkeleton
- ProgressBar
- InlineAlert
- Badge

## 11.6 Search Components
- SearchOverlay
- SearchInput
- SearchResultCard
- SearchFilterChips
- RecentSearchList

---

# 12. File Card Design

## 12.1 File Card Content
- file icon/thumbnail
- filename
- size
- updated time
- owner
- status badge

## 12.2 File Card States
- default
- hover
- selected
- uploading
- error
- shared
- deleted

## 12.3 File Card Behavior
- click opens preview or file detail
- right click opens context menu
- drag to move
- multi-select via checkbox

---

# 13. Upload UX

## 13.1 Upload Entry Points
- drag and drop on explorer
- floating upload button
- toolbar upload
- file input modal

## 13.2 Upload States
- queued
- hashing
- uploading
- paused
- retrying
- completed
- failed

## 13.3 Upload Panel
Harus menampilkan:
- file name
- size
- progress
- speed
- ETA
- pause/resume
- cancel

## 13.4 Large File UX
- chunk progress
- resume support
- clear error messages
- keep upload queue persistent
- background-friendly UI

---

# 14. Download UX

## 14.1 Download Behavior
- click download
- show progress only for large file
- support range/resume where available

## 14.2 Download Feedback
- toast start
- progress indicator
- completed notification
- error retry

---

# 15. Sharing UX

## 15.1 Share Modal Content
- share target info
- public/private toggle
- password field
- expiry date
- download limit
- copy link button
- revoke button

## 15.2 Share Link Display
- short share token
- share URL
- status indicator
- expiration info

---

# 16. Search UX

## 16.1 Spotlight Behavior
- overlay muncul di tengah
- blur background
- keyboard focused
- result preview cepat

## 16.2 Search Result Layout
- file results
- folder results
- share results
- recent searches
- filter chips

---

# 17. Dashboard UX

## 17.1 Dashboard Cards
- total storage used
- remaining quota
- recent files
- recent uploads
- shared items
- quick actions

## 17.2 Dashboard Style
- 2-column desktop
- stacked cards on mobile
- minimal text
- strong numbers
- soft gradients

---

# 18. Admin UX

## 18.1 User Table
Columns:
- name
- email
- provider
- role
- status
- quota
- used
- last login
- actions

## 18.2 Admin Actions
- edit quota
- disable user
- enable user
- view logs
- delete user

---

# 19. Responsive Behavior

## 19.1 Mobile Rules
- sidebar hidden
- navigation bottom fixed
- buttons full width
- cards stacked
- preview becomes sheet

## 19.2 Tablet Rules
- sidebar collapsible
- cards grid 2-3 columns
- toolbar compact
- preview drawer optional

## 19.3 Desktop Rules
- persistent sidebar
- larger preview panel
- multi-select visible
- drag and drop enabled

---

# 20. Interaction States

## 20.1 Hover
- slight lift
- subtle shadow
- translucent highlight

## 20.2 Focus
- clear ring
- keyboard-friendly
- accessible contrast

## 20.3 Selected
- blue accent border
- visible background tint

## 20.4 Disabled
- reduced opacity
- no pointer events

## 20.5 Loading
- skeleton
- progress bar
- spinner for actions

---

# 21. Motion System

## Duration
- Fast: 120ms
- Standard: 180ms
- Slow: 240ms

## Easing
- ease-out for hover
- ease-in-out for modals
- spring-like feel for panel transitions

## Motion Rules
- animasi harus ringan
- jangan berlebihan
- gunakan motion untuk konteks, bukan dekorasi

---

# 22. Accessibility

## Requirements
- keyboard navigation
- screen reader labels
- proper contrast
- focus visible
- reduced motion mode
- large tap targets on mobile

## Tap Targets
- minimal 44px tinggi untuk kontrol utama

---

# 23. Empty States

## Examples
### No Files Yet
- illustration sederhana
- message singkat
- tombol upload

### No Search Result
- message jelas
- reset filter button

### Empty Trash
- info retensi

---

# 24. Error States

## Error Types
- login error
- network error
- upload failed
- quota exceeded
- storage full
- permission denied

## Error UI
- icon
- title
- explanation singkat
- action button

---

# 25. UI System Tokens

## Radius Tokens
- 12
- 16
- 24
- 28

## Shadow Tokens
- shadow-sm
- shadow-md
- shadow-lg

## Blur Tokens
- blur-12
- blur-20
- blur-30

## Opacity Tokens
- surface-65
- surface-80
- border-08

---

# 26. Prompt for AI UI Generators

## Figma AI Prompt
Create a macOS Tahoe inspired self-hosted file storage app called StorageHub.
Use liquid glass, floating sidebar, Finder-like file explorer, spotlight search, responsive layout for mobile tablet desktop, minimal toolbar, soft shadows, rounded corners, blue accent, dark and light mode.

## Lovable Prompt
Build a modern lightweight file storage web app called StorageHub using React and TailwindCSS. The UI must feel like Finder on macOS Tahoe, with glassmorphism, floating sidebar, responsive file explorer, search overlay, upload manager, share modal, trash, admin panel, and mobile bottom navigation.

## Bolt Prompt
Generate a responsive file storage dashboard with a Finder-style explorer, glass panels, a floating sidebar, a spotlight search overlay, upload queue, share dialog, and admin user table. Use a clean macOS Tahoe inspired visual language.

---

# 27. Frontend Implementation Notes

Recommended stack:
- React
- Vite
- TailwindCSS
- Zustand
- TanStack Query
- React Router
- Lucide icons

## Component Priorities
1. AppShell
2. FileExplorer
3. UploadManager
4. SearchOverlay
5. ShareModal
6. AdminTable

---

# 28. Final UI Direction

StorageHub harus terlihat seperti:
- aplikasi native modern
- premium tetapi sederhana
- tidak penuh distraksi
- cepat dipahami
- mudah dipakai di HP, tablet, laptop

UI harus menjadi refleksi dari core system:
- ringan
- cepat
- file-centric
- self-hosted
- modern
