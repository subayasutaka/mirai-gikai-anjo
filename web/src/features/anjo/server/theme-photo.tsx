import "server-only";
import Image from "next/image";
import { getAnjoPhoto } from "../shared/utils/photos";

export function ThemePhoto({
  subject,
  caseId,
  variant = "card",
}: {
  subject: string;
  caseId?: string;
  variant?: "card" | "detail";
}) {
  const photo = getAnjoPhoto(subject, caseId);
  return (
    <figure className={`anjo-theme-photo anjo-theme-photo-${variant}`}>
      <Image
        src={photo.src}
        alt={photo.alt}
        width={1200}
        height={720}
        sizes={variant === "card" ? "(max-width: 700px) 100vw, 50vw" : "100vw"}
      />
    </figure>
  );
}
