// StorageHub — kamus terjemahan antarmuka.
//
// Daftar 100+ bahasa (untuk pemilih) ada di ./languages.ts. Berkas ini berisi
// kamus LENGKAP untuk 20 bahasa utama. Bahasa lain (atau kunci yang belum
// diterjemahkan) otomatis jatuh ke bahasa default (Inggris) — lihat useTranslation
// di ./index.ts.
import type { Language } from "@/types";

export const DEFAULT_LANG: Language = "en";

const en = {
  common: { loading: "Loading…", save: "Save", cancel: "Cancel", search: "Search", name: "Name", download: "Download", share: "Share", rename: "Rename", move: "Move", delete: "Delete", open: "Open" },
  nav: { dashboard: "Dashboard", files: "Files", shared: "Shared", search: "Search", trash: "Trash", admin: "Admin", settings: "Settings", home: "Home", upload: "Upload", profile: "Profile" },
  top: { searchPlaceholder: "Search…", upload: "Upload" },
  sidebar: { fileStorage: "File storage", storage: "Storage", used: "{used} of {total}" },
  dash: { title: "Dashboard", subtitle: "Your storage at a glance", usedStorage: "Used Storage", freeQuota: "Free Quota", files: "files", folders: "folders", quickActions: "Quick Actions", qaUpload: "Upload", qaNewFolder: "New Folder", qaSearch: "Search", qaShared: "Shared", recentFiles: "Recent Files", sharedFiles: "Shared Files", noFiles: "No files yet", noShares: "No shares yet", pctOf: "{pct}% of {total}" },
  login: { tagline: "Lightweight file storage platform", localLogin: "Local development login", emailPlaceholder: "you@example.com", continueLocal: "Continue (Local Dev)", enterEmail: "Enter an email to continue", footer: "Terms · Privacy · Help" },
  settings: { title: "Settings", subtitle: "Appearance and preferences", appearance: "Appearance", light: "Light", dark: "Dark", system: "System", defaultView: "Default File View", grid: "Grid", list: "List", column: "Column", uploadPrefs: "Upload Preferences", uploadPrefsDesc: "Files larger than 16 MB are uploaded in 8 MB chunks with automatic resume support. Smaller files use a single request.", language: "Language", languageDesc: "Choose the interface language" },
  files: { new: "New", upload: "Upload", home: "Home", newFolder: "New Folder", folderName: "Folder name", create: "Create", rename: "Rename", noFilesTitle: "No files yet", noFilesDesc: "Upload your first file or create a folder to get started.", dropToUpload: "Drop files to upload", uploadingN: "Uploading {n} file(s)", downloading: "Downloading…", folderTrashed: "Folder moved to trash", fileTrashed: "File moved to trash", folderCreated: "Folder created", renamed: "Renamed", moveHint: "Use drag & drop or rename for now" },
  shared: { title: "Shared", subtitle: "Links you have created", noShares: "No shares yet", noSharesDesc: "Share a file or folder to see it here.", active: "Active", revoked: "Revoked", password: "Password", downloads: "{n} downloads", linkCopied: "Link copied", shareRevoked: "Share revoked" },
  trash: { title: "Trash", subtitle: "Restore or permanently delete items", empty: "Trash is empty", restore: "Restore", deletedAt: "Deleted {when}", itemRestored: "Item restored", permDeleted: "Permanently deleted" },
  search: { title: "Search", subtitle: "Find files, folders, and shares", placeholder: "Search everything…", noResults: "No results found", noResultsDesc: "Try another keyword.", emptyTitle: "Search your storage", emptyDesc: "Type to find files and folders.", folders: "Folders", filesGroup: "Files", shares: "Shares", folder: "Folder", shareLink: "Share link" },
  profile: { title: "Profile", subtitle: "Account and session", role: "Role", status: "Status", storage: "Storage", storageUsed: "Storage used", logout: "Log out" },
  admin: { title: "Admin", subtitle: "Manage users, quotas and activity", adminOnly: "Admin only", adminOnlyDesc: "You do not have access to this area.", users: "Users", files: "Files", storage: "Storage", shares: "Shares", tabUsers: "Users", tabStorage: "Storage & Nodes", tabLogs: "Activity Logs", colName: "Name", colEmail: "Email", colRole: "Role", colStatus: "Status", colStorage: "Storage", colActions: "Actions", quota: "Quota", disable: "Disable", enable: "Enable", noActivity: "No activity yet", userUpdated: "User updated", quotaUpdated: "Quota updated", quotaFor: "Quota for {name}", quotaGb: "Quota (GB)", update: "Update", active: "active", disabled: "disabled" },
  publicShare: { brand: "StorageHub Share", loading: "Loading…", unavailable: "This link is unavailable", unavailableDesc: "It may have expired or been revoked.", folder: "Folder", passwordProtected: "This share is password protected", enterPassword: "Enter password", unlock: "Unlock", download: "Download", incorrectPassword: "Incorrect password" },
  notFound: { message: "This page could not be found.", back: "Back to Dashboard" },
  shareModal: { title: "Share", creating: "Creating…", createLink: "Create link", done: "Done", sharing: "Sharing {name}", item: "item", publicLink: "Public link", password: "Password", setPassword: "Set a password", expires: "Expires", maxDownloads: "Max downloads", linkCreated: "Share link created", passwordProtected: "Password protected" },
  upload: { title: "Uploads", clearDone: "Clear done", queued: "Queued", completed: "Completed", cancelled: "Cancelled", failed: "Failed" },
  searchOverlay: { placeholder: "Search files, folders, shares…", recentSearches: "Recent searches", noRecent: "No recent searches", folder: "Folder", share: "Share", noResultsFor: 'No results for "{q}"' },
};

// `en` adalah referensi LENGKAP. Bahasa lain boleh mengisi sebagian saja —
// kunci yang belum diterjemahkan otomatis jatuh ke `en` saat runtime.
type Dict = typeof en;
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
type LocaleDict = DeepPartial<Dict>;

const id: LocaleDict = {
  common: { loading: "Memuat…", save: "Simpan", cancel: "Batal", search: "Cari", name: "Nama", download: "Unduh", share: "Bagikan", rename: "Ganti Nama", move: "Pindah", delete: "Hapus", open: "Buka" },
  nav: { dashboard: "Dasbor", files: "Berkas", shared: "Dibagikan", search: "Cari", trash: "Sampah", admin: "Admin", settings: "Pengaturan", home: "Beranda", upload: "Unggah", profile: "Profil" },
  top: { searchPlaceholder: "Cari…", upload: "Unggah" },
  sidebar: { fileStorage: "Penyimpanan berkas", storage: "Penyimpanan", used: "{used} dari {total}" },
  dash: { title: "Dasbor", subtitle: "Penyimpanan Anda sekilas", usedStorage: "Penyimpanan Terpakai", freeQuota: "Kuota Tersisa", files: "berkas", folders: "folder", quickActions: "Aksi Cepat", qaUpload: "Unggah", qaNewFolder: "Folder Baru", qaSearch: "Cari", qaShared: "Dibagikan", recentFiles: "Berkas Terbaru", sharedFiles: "Berkas Dibagikan", noFiles: "Belum ada berkas", noShares: "Belum ada yang dibagikan", pctOf: "{pct}% dari {total}" },
  login: { tagline: "Platform penyimpanan berkas ringan", localLogin: "Login pengembangan lokal", emailPlaceholder: "anda@contoh.com", continueLocal: "Lanjutkan (Dev Lokal)", enterEmail: "Masukkan email untuk lanjut", footer: "Ketentuan · Privasi · Bantuan" },
  settings: { title: "Pengaturan", subtitle: "Tampilan dan preferensi", appearance: "Tampilan", light: "Terang", dark: "Gelap", system: "Sistem", defaultView: "Tampilan Berkas Bawaan", grid: "Kisi", list: "Daftar", column: "Kolom", uploadPrefs: "Preferensi Unggahan", uploadPrefsDesc: "Berkas lebih dari 16 MB diunggah dalam potongan 8 MB dengan dukungan lanjut otomatis. Berkas lebih kecil memakai satu permintaan.", language: "Bahasa", languageDesc: "Pilih bahasa antarmuka" },
  files: { new: "Baru", upload: "Unggah", home: "Beranda", newFolder: "Folder Baru", folderName: "Nama folder", create: "Buat", rename: "Ganti Nama", noFilesTitle: "Belum ada berkas", noFilesDesc: "Unggah berkas pertama Anda atau buat folder untuk memulai.", dropToUpload: "Lepaskan berkas untuk mengunggah", uploadingN: "Mengunggah {n} berkas", downloading: "Mengunduh…", folderTrashed: "Folder dipindah ke sampah", fileTrashed: "Berkas dipindah ke sampah", folderCreated: "Folder dibuat", renamed: "Nama diubah", moveHint: "Gunakan seret & lepas atau ganti nama untuk saat ini" },
  shared: { title: "Dibagikan", subtitle: "Tautan yang Anda buat", noShares: "Belum ada yang dibagikan", noSharesDesc: "Bagikan berkas atau folder untuk melihatnya di sini.", active: "Aktif", revoked: "Dicabut", password: "Kata Sandi", downloads: "{n} unduhan", linkCopied: "Tautan disalin", shareRevoked: "Bagikan dicabut" },
  trash: { title: "Sampah", subtitle: "Pulihkan atau hapus item secara permanen", empty: "Sampah kosong", restore: "Pulihkan", deletedAt: "Dihapus {when}", itemRestored: "Item dipulihkan", permDeleted: "Dihapus permanen" },
  search: { title: "Cari", subtitle: "Temukan berkas, folder, dan bagikan", placeholder: "Cari semuanya…", noResults: "Tidak ada hasil", noResultsDesc: "Coba kata kunci lain.", emptyTitle: "Cari penyimpanan Anda", emptyDesc: "Ketik untuk menemukan berkas dan folder.", folders: "Folder", filesGroup: "Berkas", shares: "Dibagikan", folder: "Folder", shareLink: "Tautan bagikan" },
  profile: { title: "Profil", subtitle: "Akun dan sesi", role: "Peran", status: "Status", storage: "Penyimpanan", storageUsed: "Penyimpanan terpakai", logout: "Keluar" },
  admin: { title: "Admin", subtitle: "Kelola pengguna, kuota, dan aktivitas", adminOnly: "Khusus admin", adminOnlyDesc: "Anda tidak memiliki akses ke area ini.", users: "Pengguna", files: "Berkas", storage: "Penyimpanan", shares: "Dibagikan", tabUsers: "Pengguna", tabStorage: "Penyimpanan & Node", tabLogs: "Log Aktivitas", colName: "Nama", colEmail: "Email", colRole: "Peran", colStatus: "Status", colStorage: "Penyimpanan", colActions: "Aksi", quota: "Kuota", disable: "Nonaktifkan", enable: "Aktifkan", noActivity: "Belum ada aktivitas", userUpdated: "Pengguna diperbarui", quotaUpdated: "Kuota diperbarui", quotaFor: "Kuota untuk {name}", quotaGb: "Kuota (GB)", update: "Perbarui", active: "aktif", disabled: "nonaktif" },
  publicShare: { brand: "Bagikan StorageHub", loading: "Memuat…", unavailable: "Tautan ini tidak tersedia", unavailableDesc: "Mungkin sudah kedaluwarsa atau dicabut.", folder: "Folder", passwordProtected: "Bagikan ini dilindungi kata sandi", enterPassword: "Masukkan kata sandi", unlock: "Buka", download: "Unduh", incorrectPassword: "Kata sandi salah" },
  notFound: { message: "Halaman ini tidak dapat ditemukan.", back: "Kembali ke Dasbor" },
  shareModal: { title: "Bagikan", creating: "Membuat…", createLink: "Buat tautan", done: "Selesai", sharing: "Membagikan {name}", item: "item", publicLink: "Tautan publik", password: "Kata Sandi", setPassword: "Atur kata sandi", expires: "Kedaluwarsa", maxDownloads: "Maks unduhan", linkCreated: "Tautan berbagi dibuat", passwordProtected: "Dilindungi kata sandi" },
  upload: { title: "Unggahan", clearDone: "Bersihkan selesai", queued: "Antre", completed: "Selesai", cancelled: "Dibatalkan", failed: "Gagal" },
  searchOverlay: { placeholder: "Cari berkas, folder, bagikan…", recentSearches: "Pencarian terbaru", noRecent: "Belum ada pencarian", folder: "Folder", share: "Bagikan", noResultsFor: 'Tidak ada hasil untuk "{q}"' },
};

const ms: LocaleDict = {
  common: { loading: "Memuatkan…", save: "Simpan", cancel: "Batal", search: "Cari" },
  nav: { dashboard: "Papan Pemuka", files: "Fail", shared: "Dikongsi", search: "Cari", trash: "Sampah", admin: "Admin", settings: "Tetapan", home: "Utama", upload: "Muat Naik", profile: "Profil" },
  top: { searchPlaceholder: "Cari…", upload: "Muat Naik" },
  sidebar: { fileStorage: "Storan fail", storage: "Storan", used: "{used} daripada {total}" },
  dash: { title: "Papan Pemuka", subtitle: "Storan anda sepintas lalu", usedStorage: "Storan Digunakan", freeQuota: "Kuota Bebas", files: "fail", folders: "folder", quickActions: "Tindakan Pantas", qaUpload: "Muat Naik", qaNewFolder: "Folder Baharu", qaSearch: "Cari", qaShared: "Dikongsi", recentFiles: "Fail Terkini", sharedFiles: "Fail Dikongsi", noFiles: "Tiada fail lagi", noShares: "Tiada perkongsian lagi", pctOf: "{pct}% daripada {total}" },
  login: { tagline: "Platform storan fail ringan", localLogin: "Log masuk pembangunan tempatan", emailPlaceholder: "anda@contoh.com", continueLocal: "Teruskan (Dev Tempatan)", enterEmail: "Masukkan e-mel untuk teruskan", footer: "Terma · Privasi · Bantuan" },
  settings: { title: "Tetapan", subtitle: "Penampilan dan keutamaan", appearance: "Penampilan", light: "Cerah", dark: "Gelap", system: "Sistem", defaultView: "Paparan Fail Lalai", grid: "Grid", list: "Senarai", column: "Lajur", uploadPrefs: "Keutamaan Muat Naik", uploadPrefsDesc: "Fail melebihi 16 MB dimuat naik dalam ketulan 8 MB dengan sokongan sambung semula automatik. Fail lebih kecil menggunakan satu permintaan.", language: "Bahasa", languageDesc: "Pilih bahasa antara muka" },
};

const zh: LocaleDict = {
  common: { loading: "加载中…", save: "保存", cancel: "取消", search: "搜索" },
  nav: { dashboard: "仪表板", files: "文件", shared: "共享", search: "搜索", trash: "回收站", admin: "管理", settings: "设置", home: "主页", upload: "上传", profile: "个人资料" },
  top: { searchPlaceholder: "搜索…", upload: "上传" },
  sidebar: { fileStorage: "文件存储", storage: "存储", used: "{total} 中的 {used}" },
  dash: { title: "仪表板", subtitle: "一览您的存储", usedStorage: "已用存储", freeQuota: "剩余配额", files: "个文件", folders: "个文件夹", quickActions: "快捷操作", qaUpload: "上传", qaNewFolder: "新建文件夹", qaSearch: "搜索", qaShared: "共享", recentFiles: "最近文件", sharedFiles: "共享文件", noFiles: "暂无文件", noShares: "暂无共享", pctOf: "{total} 中的 {pct}%" },
  login: { tagline: "轻量级文件存储平台", localLogin: "本地开发登录", emailPlaceholder: "you@example.com", continueLocal: "继续（本地开发）", enterEmail: "请输入邮箱以继续", footer: "条款 · 隐私 · 帮助" },
  settings: { title: "设置", subtitle: "外观与偏好", appearance: "外观", light: "浅色", dark: "深色", system: "跟随系统", defaultView: "默认文件视图", grid: "网格", list: "列表", column: "分栏", uploadPrefs: "上传偏好", uploadPrefsDesc: "大于 16 MB 的文件会被切分为 8 MB 的分块上传并支持自动续传，较小的文件则使用单次请求。", language: "语言", languageDesc: "选择界面语言" },
};

const ja: LocaleDict = {
  common: { loading: "読み込み中…", save: "保存", cancel: "キャンセル", search: "検索" },
  nav: { dashboard: "ダッシュボード", files: "ファイル", shared: "共有", search: "検索", trash: "ゴミ箱", admin: "管理", settings: "設定", home: "ホーム", upload: "アップロード", profile: "プロフィール" },
  top: { searchPlaceholder: "検索…", upload: "アップロード" },
  sidebar: { fileStorage: "ファイルストレージ", storage: "ストレージ", used: "{total} 中 {used}" },
  dash: { title: "ダッシュボード", subtitle: "ストレージの概要", usedStorage: "使用済みストレージ", freeQuota: "空き容量", files: "ファイル", folders: "フォルダ", quickActions: "クイック操作", qaUpload: "アップロード", qaNewFolder: "新規フォルダ", qaSearch: "検索", qaShared: "共有", recentFiles: "最近のファイル", sharedFiles: "共有ファイル", noFiles: "ファイルはまだありません", noShares: "共有はまだありません", pctOf: "{total} 中 {pct}%" },
  login: { tagline: "軽量ファイルストレージ基盤", localLogin: "ローカル開発ログイン", emailPlaceholder: "you@example.com", continueLocal: "続行（ローカル開発）", enterEmail: "続行するにはメールを入力", footer: "利用規約 · プライバシー · ヘルプ" },
  settings: { title: "設定", subtitle: "外観と環境設定", appearance: "外観", light: "ライト", dark: "ダーク", system: "システム", defaultView: "既定のファイル表示", grid: "グリッド", list: "リスト", column: "カラム", uploadPrefs: "アップロード設定", uploadPrefsDesc: "16 MB を超えるファイルは 8 MB のチャンクに分割され、自動再開に対応します。小さいファイルは 1 回のリクエストで送信されます。", language: "言語", languageDesc: "インターフェースの言語を選択" },
};

const ko: LocaleDict = {
  common: { loading: "불러오는 중…", save: "저장", cancel: "취소", search: "검색" },
  nav: { dashboard: "대시보드", files: "파일", shared: "공유됨", search: "검색", trash: "휴지통", admin: "관리", settings: "설정", home: "홈", upload: "업로드", profile: "프로필" },
  top: { searchPlaceholder: "검색…", upload: "업로드" },
  sidebar: { fileStorage: "파일 저장소", storage: "저장소", used: "{total} 중 {used}" },
  dash: { title: "대시보드", subtitle: "저장소 한눈에 보기", usedStorage: "사용한 저장 공간", freeQuota: "남은 용량", files: "파일", folders: "폴더", quickActions: "빠른 작업", qaUpload: "업로드", qaNewFolder: "새 폴더", qaSearch: "검색", qaShared: "공유됨", recentFiles: "최근 파일", sharedFiles: "공유된 파일", noFiles: "아직 파일이 없습니다", noShares: "아직 공유가 없습니다", pctOf: "{total} 중 {pct}%" },
  login: { tagline: "가벼운 파일 저장 플랫폼", localLogin: "로컬 개발 로그인", emailPlaceholder: "you@example.com", continueLocal: "계속 (로컬 개발)", enterEmail: "계속하려면 이메일을 입력하세요", footer: "약관 · 개인정보 · 도움말" },
  settings: { title: "설정", subtitle: "모양 및 환경설정", appearance: "모양", light: "라이트", dark: "다크", system: "시스템", defaultView: "기본 파일 보기", grid: "그리드", list: "목록", column: "열", uploadPrefs: "업로드 환경설정", uploadPrefsDesc: "16MB보다 큰 파일은 8MB 청크로 업로드되며 자동 재개를 지원합니다. 더 작은 파일은 단일 요청을 사용합니다.", language: "언어", languageDesc: "인터페이스 언어 선택" },
};

const hi: LocaleDict = {
  common: { loading: "लोड हो रहा है…", save: "सहेजें", cancel: "रद्द करें", search: "खोजें" },
  nav: { dashboard: "डैशबोर्ड", files: "फ़ाइलें", shared: "साझा", search: "खोजें", trash: "कूड़ादान", admin: "एडमिन", settings: "सेटिंग्स", home: "होम", upload: "अपलोड", profile: "प्रोफ़ाइल" },
  top: { searchPlaceholder: "खोजें…", upload: "अपलोड" },
  sidebar: { fileStorage: "फ़ाइल भंडारण", storage: "भंडारण", used: "{total} में से {used}" },
  dash: { title: "डैशबोर्ड", subtitle: "एक नज़र में आपका भंडारण", usedStorage: "उपयोग किया गया भंडारण", freeQuota: "मुक्त कोटा", files: "फ़ाइलें", folders: "फ़ोल्डर", quickActions: "त्वरित क्रियाएँ", qaUpload: "अपलोड", qaNewFolder: "नया फ़ोल्डर", qaSearch: "खोजें", qaShared: "साझा", recentFiles: "हाल की फ़ाइलें", sharedFiles: "साझा फ़ाइलें", noFiles: "अभी कोई फ़ाइल नहीं", noShares: "अभी कोई साझा नहीं", pctOf: "{total} में से {pct}%" },
  login: { tagline: "हल्का फ़ाइल भंडारण मंच", localLogin: "स्थानीय विकास लॉगिन", emailPlaceholder: "you@example.com", continueLocal: "जारी रखें (स्थानीय विकास)", enterEmail: "जारी रखने के लिए ईमेल दर्ज करें", footer: "शर्तें · गोपनीयता · सहायता" },
  settings: { title: "सेटिंग्स", subtitle: "रूप और प्राथमिकताएँ", appearance: "रूप", light: "हल्का", dark: "गहरा", system: "सिस्टम", defaultView: "डिफ़ॉल्ट फ़ाइल दृश्य", grid: "ग्रिड", list: "सूची", column: "स्तंभ", uploadPrefs: "अपलोड प्राथमिकताएँ", uploadPrefsDesc: "16 MB से बड़ी फ़ाइलें 8 MB खंडों में स्वचालित पुनरारंभ समर्थन के साथ अपलोड होती हैं। छोटी फ़ाइलें एकल अनुरोध का उपयोग करती हैं।", language: "भाषा", languageDesc: "इंटरफ़ेस भाषा चुनें" },
};

const ar: LocaleDict = {
  common: { loading: "جارٍ التحميل…", save: "حفظ", cancel: "إلغاء", search: "بحث" },
  nav: { dashboard: "لوحة التحكم", files: "الملفات", shared: "المشتركة", search: "بحث", trash: "المهملات", admin: "الإدارة", settings: "الإعدادات", home: "الرئيسية", upload: "رفع", profile: "الملف الشخصي" },
  top: { searchPlaceholder: "بحث…", upload: "رفع" },
  sidebar: { fileStorage: "تخزين الملفات", storage: "التخزين", used: "{used} من {total}" },
  dash: { title: "لوحة التحكم", subtitle: "نظرة سريعة على مساحتك", usedStorage: "المساحة المستخدمة", freeQuota: "الحصة المتاحة", files: "ملفات", folders: "مجلدات", quickActions: "إجراءات سريعة", qaUpload: "رفع", qaNewFolder: "مجلد جديد", qaSearch: "بحث", qaShared: "المشتركة", recentFiles: "الملفات الأخيرة", sharedFiles: "الملفات المشتركة", noFiles: "لا توجد ملفات بعد", noShares: "لا توجد مشاركات بعد", pctOf: "{pct}% من {total}" },
  login: { tagline: "منصة تخزين ملفات خفيفة", localLogin: "تسجيل دخول التطوير المحلي", emailPlaceholder: "you@example.com", continueLocal: "متابعة (تطوير محلي)", enterEmail: "أدخل بريدًا إلكترونيًا للمتابعة", footer: "الشروط · الخصوصية · المساعدة" },
  settings: { title: "الإعدادات", subtitle: "المظهر والتفضيلات", appearance: "المظهر", light: "فاتح", dark: "داكن", system: "النظام", defaultView: "عرض الملفات الافتراضي", grid: "شبكة", list: "قائمة", column: "أعمدة", uploadPrefs: "تفضيلات الرفع", uploadPrefsDesc: "الملفات الأكبر من 16 ميغابايت تُرفع في أجزاء بحجم 8 ميغابايت مع دعم الاستئناف التلقائي. الملفات الأصغر تستخدم طلبًا واحدًا.", language: "اللغة", languageDesc: "اختر لغة الواجهة" },
};

const es: LocaleDict = {
  common: { loading: "Cargando…", save: "Guardar", cancel: "Cancelar", search: "Buscar" },
  nav: { dashboard: "Panel", files: "Archivos", shared: "Compartido", search: "Buscar", trash: "Papelera", admin: "Admin", settings: "Ajustes", home: "Inicio", upload: "Subir", profile: "Perfil" },
  top: { searchPlaceholder: "Buscar…", upload: "Subir" },
  sidebar: { fileStorage: "Almacenamiento de archivos", storage: "Almacenamiento", used: "{used} de {total}" },
  dash: { title: "Panel", subtitle: "Tu almacenamiento de un vistazo", usedStorage: "Almacenamiento usado", freeQuota: "Cuota libre", files: "archivos", folders: "carpetas", quickActions: "Acciones rápidas", qaUpload: "Subir", qaNewFolder: "Nueva carpeta", qaSearch: "Buscar", qaShared: "Compartido", recentFiles: "Archivos recientes", sharedFiles: "Archivos compartidos", noFiles: "Aún no hay archivos", noShares: "Aún no hay compartidos", pctOf: "{pct}% de {total}" },
  login: { tagline: "Plataforma ligera de almacenamiento de archivos", localLogin: "Inicio de sesión de desarrollo local", emailPlaceholder: "tu@ejemplo.com", continueLocal: "Continuar (Dev local)", enterEmail: "Introduce un correo para continuar", footer: "Términos · Privacidad · Ayuda" },
  settings: { title: "Ajustes", subtitle: "Apariencia y preferencias", appearance: "Apariencia", light: "Claro", dark: "Oscuro", system: "Sistema", defaultView: "Vista de archivos predeterminada", grid: "Cuadrícula", list: "Lista", column: "Columnas", uploadPrefs: "Preferencias de subida", uploadPrefsDesc: "Los archivos mayores de 16 MB se suben en fragmentos de 8 MB con reanudación automática. Los más pequeños usan una sola solicitud.", language: "Idioma", languageDesc: "Elige el idioma de la interfaz" },
};

const pt: LocaleDict = {
  common: { loading: "Carregando…", save: "Salvar", cancel: "Cancelar", search: "Pesquisar" },
  nav: { dashboard: "Painel", files: "Arquivos", shared: "Compartilhado", search: "Pesquisar", trash: "Lixeira", admin: "Admin", settings: "Configurações", home: "Início", upload: "Enviar", profile: "Perfil" },
  top: { searchPlaceholder: "Pesquisar…", upload: "Enviar" },
  sidebar: { fileStorage: "Armazenamento de arquivos", storage: "Armazenamento", used: "{used} de {total}" },
  dash: { title: "Painel", subtitle: "Seu armazenamento em resumo", usedStorage: "Armazenamento usado", freeQuota: "Cota livre", files: "arquivos", folders: "pastas", quickActions: "Ações rápidas", qaUpload: "Enviar", qaNewFolder: "Nova pasta", qaSearch: "Pesquisar", qaShared: "Compartilhado", recentFiles: "Arquivos recentes", sharedFiles: "Arquivos compartilhados", noFiles: "Ainda sem arquivos", noShares: "Ainda sem compartilhamentos", pctOf: "{pct}% de {total}" },
  login: { tagline: "Plataforma leve de armazenamento de arquivos", localLogin: "Login de desenvolvimento local", emailPlaceholder: "voce@exemplo.com", continueLocal: "Continuar (Dev Local)", enterEmail: "Digite um e-mail para continuar", footer: "Termos · Privacidade · Ajuda" },
  settings: { title: "Configurações", subtitle: "Aparência e preferências", appearance: "Aparência", light: "Claro", dark: "Escuro", system: "Sistema", defaultView: "Visualização padrão de arquivos", grid: "Grade", list: "Lista", column: "Colunas", uploadPrefs: "Preferências de envio", uploadPrefsDesc: "Arquivos maiores que 16 MB são enviados em blocos de 8 MB com retomada automática. Os menores usam uma única solicitação.", language: "Idioma", languageDesc: "Escolha o idioma da interface" },
};

const fr: LocaleDict = {
  common: { loading: "Chargement…", save: "Enregistrer", cancel: "Annuler", search: "Rechercher" },
  nav: { dashboard: "Tableau de bord", files: "Fichiers", shared: "Partagé", search: "Rechercher", trash: "Corbeille", admin: "Admin", settings: "Paramètres", home: "Accueil", upload: "Téléverser", profile: "Profil" },
  top: { searchPlaceholder: "Rechercher…", upload: "Téléverser" },
  sidebar: { fileStorage: "Stockage de fichiers", storage: "Stockage", used: "{used} sur {total}" },
  dash: { title: "Tableau de bord", subtitle: "Votre stockage en un coup d'œil", usedStorage: "Stockage utilisé", freeQuota: "Quota libre", files: "fichiers", folders: "dossiers", quickActions: "Actions rapides", qaUpload: "Téléverser", qaNewFolder: "Nouveau dossier", qaSearch: "Rechercher", qaShared: "Partagé", recentFiles: "Fichiers récents", sharedFiles: "Fichiers partagés", noFiles: "Aucun fichier", noShares: "Aucun partage", pctOf: "{pct}% sur {total}" },
  login: { tagline: "Plateforme de stockage de fichiers légère", localLogin: "Connexion développement local", emailPlaceholder: "vous@exemple.com", continueLocal: "Continuer (Dev local)", enterEmail: "Saisissez un e-mail pour continuer", footer: "Conditions · Confidentialité · Aide" },
  settings: { title: "Paramètres", subtitle: "Apparence et préférences", appearance: "Apparence", light: "Clair", dark: "Sombre", system: "Système", defaultView: "Vue de fichiers par défaut", grid: "Grille", list: "Liste", column: "Colonnes", uploadPrefs: "Préférences de téléversement", uploadPrefsDesc: "Les fichiers de plus de 16 Mo sont téléversés en blocs de 8 Mo avec reprise automatique. Les plus petits utilisent une seule requête.", language: "Langue", languageDesc: "Choisissez la langue de l'interface" },
};

const de: LocaleDict = {
  common: { loading: "Wird geladen…", save: "Speichern", cancel: "Abbrechen", search: "Suchen" },
  nav: { dashboard: "Dashboard", files: "Dateien", shared: "Geteilt", search: "Suchen", trash: "Papierkorb", admin: "Admin", settings: "Einstellungen", home: "Start", upload: "Hochladen", profile: "Profil" },
  top: { searchPlaceholder: "Suchen…", upload: "Hochladen" },
  sidebar: { fileStorage: "Dateispeicher", storage: "Speicher", used: "{used} von {total}" },
  dash: { title: "Dashboard", subtitle: "Ihr Speicher auf einen Blick", usedStorage: "Belegter Speicher", freeQuota: "Freies Kontingent", files: "Dateien", folders: "Ordner", quickActions: "Schnellaktionen", qaUpload: "Hochladen", qaNewFolder: "Neuer Ordner", qaSearch: "Suchen", qaShared: "Geteilt", recentFiles: "Letzte Dateien", sharedFiles: "Geteilte Dateien", noFiles: "Noch keine Dateien", noShares: "Noch keine Freigaben", pctOf: "{pct}% von {total}" },
  login: { tagline: "Schlanke Dateispeicher-Plattform", localLogin: "Lokale Entwicklungsanmeldung", emailPlaceholder: "du@beispiel.com", continueLocal: "Weiter (Lokale Entwicklung)", enterEmail: "E-Mail eingeben, um fortzufahren", footer: "Bedingungen · Datenschutz · Hilfe" },
  settings: { title: "Einstellungen", subtitle: "Aussehen und Einstellungen", appearance: "Aussehen", light: "Hell", dark: "Dunkel", system: "System", defaultView: "Standard-Dateiansicht", grid: "Raster", list: "Liste", column: "Spalten", uploadPrefs: "Upload-Einstellungen", uploadPrefsDesc: "Dateien über 16 MB werden in 8-MB-Blöcken mit automatischer Wiederaufnahme hochgeladen. Kleinere Dateien verwenden eine einzelne Anfrage.", language: "Sprache", languageDesc: "Sprache der Oberfläche wählen" },
};

const it: LocaleDict = {
  common: { loading: "Caricamento…", save: "Salva", cancel: "Annulla", search: "Cerca" },
  nav: { dashboard: "Dashboard", files: "File", shared: "Condivisi", search: "Cerca", trash: "Cestino", admin: "Admin", settings: "Impostazioni", home: "Home", upload: "Carica", profile: "Profilo" },
  top: { searchPlaceholder: "Cerca…", upload: "Carica" },
  sidebar: { fileStorage: "Archiviazione file", storage: "Archiviazione", used: "{used} di {total}" },
  dash: { title: "Dashboard", subtitle: "Il tuo spazio in breve", usedStorage: "Spazio usato", freeQuota: "Quota libera", files: "file", folders: "cartelle", quickActions: "Azioni rapide", qaUpload: "Carica", qaNewFolder: "Nuova cartella", qaSearch: "Cerca", qaShared: "Condivisi", recentFiles: "File recenti", sharedFiles: "File condivisi", noFiles: "Ancora nessun file", noShares: "Ancora nessuna condivisione", pctOf: "{pct}% di {total}" },
  login: { tagline: "Piattaforma leggera di archiviazione file", localLogin: "Accesso sviluppo locale", emailPlaceholder: "tu@esempio.com", continueLocal: "Continua (Dev locale)", enterEmail: "Inserisci un'email per continuare", footer: "Termini · Privacy · Aiuto" },
  settings: { title: "Impostazioni", subtitle: "Aspetto e preferenze", appearance: "Aspetto", light: "Chiaro", dark: "Scuro", system: "Sistema", defaultView: "Vista file predefinita", grid: "Griglia", list: "Elenco", column: "Colonne", uploadPrefs: "Preferenze di caricamento", uploadPrefsDesc: "I file più grandi di 16 MB vengono caricati in blocchi da 8 MB con ripresa automatica. Quelli più piccoli usano una singola richiesta.", language: "Lingua", languageDesc: "Scegli la lingua dell'interfaccia" },
};

const ru: LocaleDict = {
  common: { loading: "Загрузка…", save: "Сохранить", cancel: "Отмена", search: "Поиск" },
  nav: { dashboard: "Панель", files: "Файлы", shared: "Общие", search: "Поиск", trash: "Корзина", admin: "Админ", settings: "Настройки", home: "Главная", upload: "Загрузить", profile: "Профиль" },
  top: { searchPlaceholder: "Поиск…", upload: "Загрузить" },
  sidebar: { fileStorage: "Хранилище файлов", storage: "Хранилище", used: "{used} из {total}" },
  dash: { title: "Панель", subtitle: "Ваше хранилище кратко", usedStorage: "Использовано", freeQuota: "Свободная квота", files: "файлов", folders: "папок", quickActions: "Быстрые действия", qaUpload: "Загрузить", qaNewFolder: "Новая папка", qaSearch: "Поиск", qaShared: "Общие", recentFiles: "Недавние файлы", sharedFiles: "Общие файлы", noFiles: "Пока нет файлов", noShares: "Пока нет общих", pctOf: "{pct}% из {total}" },
  login: { tagline: "Лёгкая платформа хранения файлов", localLogin: "Локальный вход для разработки", emailPlaceholder: "you@example.com", continueLocal: "Продолжить (локально)", enterEmail: "Введите эл. почту для продолжения", footer: "Условия · Конфиденциальность · Помощь" },
  settings: { title: "Настройки", subtitle: "Оформление и параметры", appearance: "Оформление", light: "Светлая", dark: "Тёмная", system: "Системная", defaultView: "Вид файлов по умолчанию", grid: "Сетка", list: "Список", column: "Столбцы", uploadPrefs: "Параметры загрузки", uploadPrefsDesc: "Файлы больше 16 МБ загружаются частями по 8 МБ с автоматическим возобновлением. Меньшие файлы — одним запросом.", language: "Язык", languageDesc: "Выберите язык интерфейса" },
};

const uk: LocaleDict = {
  common: { loading: "Завантаження…", save: "Зберегти", cancel: "Скасувати", search: "Пошук" },
  nav: { dashboard: "Панель", files: "Файли", shared: "Спільні", search: "Пошук", trash: "Кошик", admin: "Адмін", settings: "Налаштування", home: "Головна", upload: "Завантажити", profile: "Профіль" },
  top: { searchPlaceholder: "Пошук…", upload: "Завантажити" },
  sidebar: { fileStorage: "Сховище файлів", storage: "Сховище", used: "{used} з {total}" },
  dash: { title: "Панель", subtitle: "Ваше сховище коротко", usedStorage: "Використано", freeQuota: "Вільна квота", files: "файлів", folders: "папок", quickActions: "Швидкі дії", qaUpload: "Завантажити", qaNewFolder: "Нова папка", qaSearch: "Пошук", qaShared: "Спільні", recentFiles: "Останні файли", sharedFiles: "Спільні файли", noFiles: "Поки немає файлів", noShares: "Поки немає спільних", pctOf: "{pct}% з {total}" },
  login: { tagline: "Легка платформа зберігання файлів", localLogin: "Локальний вхід для розробки", emailPlaceholder: "you@example.com", continueLocal: "Продовжити (локально)", enterEmail: "Введіть ел. пошту для продовження", footer: "Умови · Конфіденційність · Довідка" },
  settings: { title: "Налаштування", subtitle: "Вигляд і параметри", appearance: "Вигляд", light: "Світла", dark: "Темна", system: "Системна", defaultView: "Типовий вигляд файлів", grid: "Сітка", list: "Список", column: "Стовпці", uploadPrefs: "Параметри завантаження", uploadPrefsDesc: "Файли понад 16 МБ завантажуються частинами по 8 МБ з автоматичним відновленням. Менші файли — одним запитом.", language: "Мова", languageDesc: "Виберіть мову інтерфейсу" },
};

const pl: LocaleDict = {
  common: { loading: "Ładowanie…", save: "Zapisz", cancel: "Anuluj", search: "Szukaj" },
  nav: { dashboard: "Pulpit", files: "Pliki", shared: "Udostępnione", search: "Szukaj", trash: "Kosz", admin: "Admin", settings: "Ustawienia", home: "Start", upload: "Prześlij", profile: "Profil" },
  top: { searchPlaceholder: "Szukaj…", upload: "Prześlij" },
  sidebar: { fileStorage: "Magazyn plików", storage: "Magazyn", used: "{used} z {total}" },
  dash: { title: "Pulpit", subtitle: "Twój magazyn w skrócie", usedStorage: "Użyte miejsce", freeQuota: "Wolny limit", files: "plików", folders: "folderów", quickActions: "Szybkie akcje", qaUpload: "Prześlij", qaNewFolder: "Nowy folder", qaSearch: "Szukaj", qaShared: "Udostępnione", recentFiles: "Ostatnie pliki", sharedFiles: "Udostępnione pliki", noFiles: "Brak plików", noShares: "Brak udostępnień", pctOf: "{pct}% z {total}" },
  login: { tagline: "Lekka platforma do przechowywania plików", localLogin: "Logowanie deweloperskie", emailPlaceholder: "ty@przyklad.com", continueLocal: "Kontynuuj (Dev lokalny)", enterEmail: "Podaj e-mail, aby kontynuować", footer: "Warunki · Prywatność · Pomoc" },
  settings: { title: "Ustawienia", subtitle: "Wygląd i preferencje", appearance: "Wygląd", light: "Jasny", dark: "Ciemny", system: "Systemowy", defaultView: "Domyślny widok plików", grid: "Siatka", list: "Lista", column: "Kolumny", uploadPrefs: "Preferencje przesyłania", uploadPrefsDesc: "Pliki większe niż 16 MB są przesyłane w blokach po 8 MB z automatycznym wznawianiem. Mniejsze używają jednego żądania.", language: "Język", languageDesc: "Wybierz język interfejsu" },
};

const tr: LocaleDict = {
  common: { loading: "Yükleniyor…", save: "Kaydet", cancel: "İptal", search: "Ara" },
  nav: { dashboard: "Panel", files: "Dosyalar", shared: "Paylaşılan", search: "Ara", trash: "Çöp", admin: "Yönetim", settings: "Ayarlar", home: "Ana Sayfa", upload: "Yükle", profile: "Profil" },
  top: { searchPlaceholder: "Ara…", upload: "Yükle" },
  sidebar: { fileStorage: "Dosya depolama", storage: "Depolama", used: "{total} içinden {used}" },
  dash: { title: "Panel", subtitle: "Depolamanıza bir bakış", usedStorage: "Kullanılan Depolama", freeQuota: "Boş Kota", files: "dosya", folders: "klasör", quickActions: "Hızlı İşlemler", qaUpload: "Yükle", qaNewFolder: "Yeni Klasör", qaSearch: "Ara", qaShared: "Paylaşılan", recentFiles: "Son Dosyalar", sharedFiles: "Paylaşılan Dosyalar", noFiles: "Henüz dosya yok", noShares: "Henüz paylaşım yok", pctOf: "{total} içinden %{pct}" },
  login: { tagline: "Hafif dosya depolama platformu", localLogin: "Yerel geliştirme girişi", emailPlaceholder: "sen@ornek.com", continueLocal: "Devam (Yerel Geliştirme)", enterEmail: "Devam etmek için e-posta girin", footer: "Şartlar · Gizlilik · Yardım" },
  settings: { title: "Ayarlar", subtitle: "Görünüm ve tercihler", appearance: "Görünüm", light: "Açık", dark: "Koyu", system: "Sistem", defaultView: "Varsayılan Dosya Görünümü", grid: "Izgara", list: "Liste", column: "Sütun", uploadPrefs: "Yükleme Tercihleri", uploadPrefsDesc: "16 MB'tan büyük dosyalar otomatik devam desteğiyle 8 MB'lık parçalar halinde yüklenir. Daha küçük dosyalar tek istek kullanır.", language: "Dil", languageDesc: "Arayüz dilini seçin" },
};

const vi: LocaleDict = {
  common: { loading: "Đang tải…", save: "Lưu", cancel: "Hủy", search: "Tìm kiếm" },
  nav: { dashboard: "Bảng điều khiển", files: "Tệp", shared: "Đã chia sẻ", search: "Tìm kiếm", trash: "Thùng rác", admin: "Quản trị", settings: "Cài đặt", home: "Trang chủ", upload: "Tải lên", profile: "Hồ sơ" },
  top: { searchPlaceholder: "Tìm kiếm…", upload: "Tải lên" },
  sidebar: { fileStorage: "Lưu trữ tệp", storage: "Lưu trữ", used: "{used} trong {total}" },
  dash: { title: "Bảng điều khiển", subtitle: "Tổng quan lưu trữ của bạn", usedStorage: "Đã dùng", freeQuota: "Hạn mức trống", files: "tệp", folders: "thư mục", quickActions: "Tác vụ nhanh", qaUpload: "Tải lên", qaNewFolder: "Thư mục mới", qaSearch: "Tìm kiếm", qaShared: "Đã chia sẻ", recentFiles: "Tệp gần đây", sharedFiles: "Tệp đã chia sẻ", noFiles: "Chưa có tệp", noShares: "Chưa có chia sẻ", pctOf: "{pct}% trong {total}" },
  login: { tagline: "Nền tảng lưu trữ tệp nhẹ", localLogin: "Đăng nhập phát triển cục bộ", emailPlaceholder: "ban@vidu.com", continueLocal: "Tiếp tục (Dev cục bộ)", enterEmail: "Nhập email để tiếp tục", footer: "Điều khoản · Quyền riêng tư · Trợ giúp" },
  settings: { title: "Cài đặt", subtitle: "Giao diện và tùy chọn", appearance: "Giao diện", light: "Sáng", dark: "Tối", system: "Hệ thống", defaultView: "Chế độ xem tệp mặc định", grid: "Lưới", list: "Danh sách", column: "Cột", uploadPrefs: "Tùy chọn tải lên", uploadPrefsDesc: "Tệp lớn hơn 16 MB được tải lên theo khối 8 MB với hỗ trợ tiếp tục tự động. Tệp nhỏ hơn dùng một yêu cầu.", language: "Ngôn ngữ", languageDesc: "Chọn ngôn ngữ giao diện" },
};

const th: LocaleDict = {
  common: { loading: "กำลังโหลด…", save: "บันทึก", cancel: "ยกเลิก", search: "ค้นหา" },
  nav: { dashboard: "แดชบอร์ด", files: "ไฟล์", shared: "แชร์แล้ว", search: "ค้นหา", trash: "ถังขยะ", admin: "ผู้ดูแล", settings: "การตั้งค่า", home: "หน้าแรก", upload: "อัปโหลด", profile: "โปรไฟล์" },
  top: { searchPlaceholder: "ค้นหา…", upload: "อัปโหลด" },
  sidebar: { fileStorage: "ที่เก็บไฟล์", storage: "ที่เก็บข้อมูล", used: "{used} จาก {total}" },
  dash: { title: "แดชบอร์ด", subtitle: "ภาพรวมพื้นที่เก็บของคุณ", usedStorage: "พื้นที่ที่ใช้", freeQuota: "โควตาว่าง", files: "ไฟล์", folders: "โฟลเดอร์", quickActions: "การทำงานด่วน", qaUpload: "อัปโหลด", qaNewFolder: "โฟลเดอร์ใหม่", qaSearch: "ค้นหา", qaShared: "แชร์แล้ว", recentFiles: "ไฟล์ล่าสุด", sharedFiles: "ไฟล์ที่แชร์", noFiles: "ยังไม่มีไฟล์", noShares: "ยังไม่มีการแชร์", pctOf: "{pct}% จาก {total}" },
  login: { tagline: "แพลตฟอร์มจัดเก็บไฟล์แบบเบา", localLogin: "เข้าสู่ระบบสำหรับพัฒนาในเครื่อง", emailPlaceholder: "you@example.com", continueLocal: "ดำเนินการต่อ (Dev ในเครื่อง)", enterEmail: "กรอกอีเมลเพื่อดำเนินการต่อ", footer: "เงื่อนไข · ความเป็นส่วนตัว · ช่วยเหลือ" },
  settings: { title: "การตั้งค่า", subtitle: "รูปลักษณ์และค่ากำหนด", appearance: "รูปลักษณ์", light: "สว่าง", dark: "มืด", system: "ระบบ", defaultView: "มุมมองไฟล์เริ่มต้น", grid: "ตาราง", list: "รายการ", column: "คอลัมน์", uploadPrefs: "ค่ากำหนดการอัปโหลด", uploadPrefsDesc: "ไฟล์ที่ใหญ่กว่า 16 MB จะอัปโหลดเป็นชิ้นขนาด 8 MB พร้อมรองรับการดำเนินต่ออัตโนมัติ ไฟล์เล็กกว่าจะใช้คำขอเดียว", language: "ภาษา", languageDesc: "เลือกภาษาของอินเทอร์เฟซ" },
};

const nl: LocaleDict = {
  common: { loading: "Laden…", save: "Opslaan", cancel: "Annuleren", search: "Zoeken" },
  nav: { dashboard: "Dashboard", files: "Bestanden", shared: "Gedeeld", search: "Zoeken", trash: "Prullenbak", admin: "Beheer", settings: "Instellingen", home: "Start", upload: "Uploaden", profile: "Profiel" },
  top: { searchPlaceholder: "Zoeken…", upload: "Uploaden" },
  sidebar: { fileStorage: "Bestandsopslag", storage: "Opslag", used: "{used} van {total}" },
  dash: { title: "Dashboard", subtitle: "Je opslag in één oogopslag", usedStorage: "Gebruikte opslag", freeQuota: "Vrije quota", files: "bestanden", folders: "mappen", quickActions: "Snelle acties", qaUpload: "Uploaden", qaNewFolder: "Nieuwe map", qaSearch: "Zoeken", qaShared: "Gedeeld", recentFiles: "Recente bestanden", sharedFiles: "Gedeelde bestanden", noFiles: "Nog geen bestanden", noShares: "Nog niets gedeeld", pctOf: "{pct}% van {total}" },
  login: { tagline: "Lichtgewicht bestandsopslagplatform", localLogin: "Lokale ontwikkelaanmelding", emailPlaceholder: "jij@voorbeeld.com", continueLocal: "Doorgaan (Lokale dev)", enterEmail: "Voer een e-mailadres in om door te gaan", footer: "Voorwaarden · Privacy · Help" },
  settings: { title: "Instellingen", subtitle: "Weergave en voorkeuren", appearance: "Weergave", light: "Licht", dark: "Donker", system: "Systeem", defaultView: "Standaard bestandsweergave", grid: "Raster", list: "Lijst", column: "Kolommen", uploadPrefs: "Uploadvoorkeuren", uploadPrefsDesc: "Bestanden groter dan 16 MB worden in blokken van 8 MB geüpload met automatische hervatting. Kleinere bestanden gebruiken één verzoek.", language: "Taal", languageDesc: "Kies de taal van de interface" },
};

export const translations: Record<Language, LocaleDict> = {
  en, id, ms, zh, ja, ko, hi, ar, es, pt, fr, de, it, ru, uk, pl, tr, vi, th, nl,
};
