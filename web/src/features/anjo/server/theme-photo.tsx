import "server-only";
import Image from "next/image";
import { getAnjoPhoto } from "../shared/utils/photos";
import { Furigana } from "./furigana";

export function ThemePhoto({
  subject,
  variant = "card",
}: {
  subject: string;
  variant?: "card" | "detail";
}) {
  const photo = getAnjoPhoto(subject);
  return (
    <figure className={`anjo-theme-photo anjo-theme-photo-${variant}`}>
      <Image
        src={photo.src}
        alt={`${photo.alt}（テーマを表すイメージ写真）`}
        width={1200}
        height={720}
        sizes={variant === "card" ? "(max-width: 700px) 100vw, 50vw" : "100vw"}
      />
      {variant === "card" ? (
        <figcaption>
          <Furigana>イメージ写真</Furigana>
        </figcaption>
      ) : (
        <figcaption>
          <Furigana>テーマを表すイメージ写真 · 写真：</Furigana>
          <a href={photo.source} target="_blank" rel="noopener noreferrer">
            {photo.author} / Pexels
          </a>
        </figcaption>
      )}
    </figure>
  );
}
