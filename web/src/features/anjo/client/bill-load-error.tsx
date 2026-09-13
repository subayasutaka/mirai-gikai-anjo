"use client";

import { Button } from "@/components/ui/button";

export function BillLoadError() {
  return (
    <section className="anjo-panel" role="alert">
      <h1>ページをひらけませんでした</h1>
      <p>
        いま、ぎあんのデータをよみこめません。すこしまって、もういちどおためしください。
      </p>
      <Button onClick={() => window.location.reload()}>
        もういちどよみこむ
      </Button>
    </section>
  );
}
