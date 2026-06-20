import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { useTranslation } from "@/i18n";

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <div className="glass flex h-16 w-16 items-center justify-center rounded-full">
        <Compass className="h-7 w-7 text-accent" />
      </div>
      <h1 className="text-3xl font-bold">404</h1>
      <p className="text-sm text-soft">{t("notFound.message")}</p>
      <Link to="/app/dashboard" className="btn-primary">
        {t("notFound.back")}
      </Link>
    </div>
  );
}
