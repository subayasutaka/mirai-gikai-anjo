import "server-only";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { ReadingText } from "./reading-text";

export function BackToList({
  query,
  bottom = false,
}: {
  query: string;
  bottom?: boolean;
}) {
  return (
    <nav
      className={`anjo-back-nav${bottom ? " anjo-back-bottom" : ""}`}
      aria-label="一覧へ戻る"
    >
      <Link
        href={{ pathname: routes.home(), search: query }}
        className="anjo-back-link"
      >
        <ArrowLeft size={20} aria-hidden="true" />
        <ReadingText normal="一覧に戻る" hard="議案・事業の一覧へ戻る" />
      </Link>
    </nav>
  );
}
