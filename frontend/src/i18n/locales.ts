// StorageHub — kamus multi-bahasa untuk antarmuka.
// Menambah bahasa: tambahkan kode pada tipe `Language` (src/types), salah satu
// blok di bawah, lalu daftarkan di array LANGUAGES.
import type { Language } from "@/types";

export const DEFAULT_LANG: Language = "en";

export interface LanguageOption {
  code: Language;
  label: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
];

// Bentuk kamus tiap bahasa harus sama persis dengan `en`.
type Dict = typeof en;

const en = {
  nav: {
    dashboard: "Dashboard",
    files: "Files",
    shared: "Shared",
    search: "Search",
    trash: "Trash",
    admin: "Admin",
    settings: "Settings",
    home: "Home",
    upload: "Upload",
    profile: "Profile",
  },
  top: {
    searchPlaceholder: "Search…",
    upload: "Upload",
  },
  sidebar: {
    fileStorage: "File storage",
    storage: "Storage",
    used: "{used} of {total}",
  },
  settings: {
    title: "Settings",
    subtitle: "Appearance and preferences",
    appearance: "Appearance",
    light: "Light",
    dark: "Dark",
    system: "System",
    defaultView: "Default File View",
    grid: "Grid",
    list: "List",
    column: "Column",
    uploadPrefs: "Upload Preferences",
    uploadPrefsDesc:
      "Files larger than 16 MB are uploaded in 8 MB chunks with automatic resume support. Smaller files use a single request.",
    language: "Language",
    languageDesc: "Choose the interface language",
  },
};

const id: Dict = {
  nav: {
    dashboard: "Dasbor",
    files: "Berkas",
    shared: "Dibagikan",
    search: "Cari",
    trash: "Sampah",
    admin: "Admin",
    settings: "Pengaturan",
    home: "Beranda",
    upload: "Unggah",
    profile: "Profil",
  },
  top: {
    searchPlaceholder: "Cari…",
    upload: "Unggah",
  },
  sidebar: {
    fileStorage: "Penyimpanan berkas",
    storage: "Penyimpanan",
    used: "{used} dari {total}",
  },
  settings: {
    title: "Pengaturan",
    subtitle: "Tampilan dan preferensi",
    appearance: "Tampilan",
    light: "Terang",
    dark: "Gelap",
    system: "Sistem",
    defaultView: "Tampilan Berkas Bawaan",
    grid: "Kisi",
    list: "Daftar",
    column: "Kolom",
    uploadPrefs: "Preferensi Unggahan",
    uploadPrefsDesc:
      "Berkas lebih dari 16 MB diunggah dalam potongan 8 MB dengan dukungan lanjut otomatis. Berkas lebih kecil memakai satu permintaan.",
    language: "Bahasa",
    languageDesc: "Pilih bahasa antarmuka",
  },
};

const ja: Dict = {
  nav: {
    dashboard: "ダッシュボード",
    files: "ファイル",
    shared: "共有",
    search: "検索",
    trash: "ゴミ箱",
    admin: "管理",
    settings: "設定",
    home: "ホーム",
    upload: "アップロード",
    profile: "プロフィール",
  },
  top: {
    searchPlaceholder: "検索…",
    upload: "アップロード",
  },
  sidebar: {
    fileStorage: "ファイルストレージ",
    storage: "ストレージ",
    used: "{total} 中 {used}",
  },
  settings: {
    title: "設定",
    subtitle: "外観と環境設定",
    appearance: "外観",
    light: "ライト",
    dark: "ダーク",
    system: "システム",
    defaultView: "既定のファイル表示",
    grid: "グリッド",
    list: "リスト",
    column: "カラム",
    uploadPrefs: "アップロード設定",
    uploadPrefsDesc:
      "16 MB を超えるファイルは 8 MB のチャンクに分割され、自動再開に対応します。小さいファイルは 1 回のリクエストで送信されます。",
    language: "言語",
    languageDesc: "インターフェースの言語を選択",
  },
};

const zh: Dict = {
  nav: {
    dashboard: "仪表板",
    files: "文件",
    shared: "共享",
    search: "搜索",
    trash: "回收站",
    admin: "管理",
    settings: "设置",
    home: "主页",
    upload: "上传",
    profile: "个人资料",
  },
  top: {
    searchPlaceholder: "搜索…",
    upload: "上传",
  },
  sidebar: {
    fileStorage: "文件存储",
    storage: "存储",
    used: "{total} 中 {used}",
  },
  settings: {
    title: "设置",
    subtitle: "外观与偏好",
    appearance: "外观",
    light: "浅色",
    dark: "深色",
    system: "跟随系统",
    defaultView: "默认文件视图",
    grid: "网格",
    list: "列表",
    column: "分栏",
    uploadPrefs: "上传偏好",
    uploadPrefsDesc:
      "大于 16 MB 的文件会被切分为 8 MB 的分块上传并支持自动续传，较小的文件则使用单次请求。",
    language: "语言",
    languageDesc: "选择界面语言",
  },
};

export const translations: Record<Language, Dict> = { en, id, ja, zh };
