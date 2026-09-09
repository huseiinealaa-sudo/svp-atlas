/**
 * SPEC.md §12 — permanent bilingual disclaimer, plus the touch hints from §7.
 * The Arabic paragraph is reproduced verbatim from the specification.
 */
export default function Footer() {
  return (
    <footer className="shrink-0 border-t border-edge bg-panel/80 px-4 py-3 backdrop-blur">
      <p className="font-mono text-[11px] text-muted" dir="ltr">
        Drag to orbit · Pinch to zoom · Tap to inspect
      </p>

      <p lang="ar" className="mt-2 max-w-4xl text-[11px] leading-relaxed text-muted">
        نموذج تعليمي. الأبعاد مبنية على بيانات Model 85 المنشورة وعلى إعدادات SVP-PR-8 الفعلية، وهو
        ليس نموذج CAD صادراً عن الشركة المصنّعة. يُرجع في الإجراءات المعتمدة إلى أدلة Honeywell Enraf
        ومعايير API MPMS الفصلين 4 و 12.
      </p>

      <p lang="en" dir="ltr" className="mt-1 max-w-4xl text-[11px] leading-relaxed text-muted">
        Educational model. Geometry is dimensionally proportioned from published Model 85 data and
        the live SVP-PR-8 configuration; it is not a manufacturer CAD model. Refer to the Honeywell
        Enraf manuals and API MPMS Chapters 4 and 12 for authoritative procedures.
      </p>
    </footer>
  );
}
