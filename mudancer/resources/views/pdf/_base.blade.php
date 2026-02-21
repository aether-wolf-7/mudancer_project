<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 9pt; color: #1a1a1a; }

  /* ── Page layout ── */
  .page { padding: 22px 28px; }

  /* ── Header ── */
  .header { border-bottom: 2.5px solid #1e3a5f; padding-bottom: 10px; margin-bottom: 14px; }
  .header-top { display: table; width: 100%; }
  .header-left { display: table-cell; vertical-align: middle; width: 60%; }
  .header-right { display: table-cell; vertical-align: middle; text-align: right; width: 40%; }
  .provider-name { font-size: 14pt; font-weight: bold; color: #1e3a5f; }
  .provider-sub { font-size: 8pt; color: #555; margin-top: 2px; }
  .doc-title { font-size: 18pt; font-weight: bold; color: #1e3a5f; }
  .doc-id { font-size: 9pt; color: #555; margin-top: 3px; }
  .doc-date { font-size: 8pt; color: #888; margin-top: 2px; }

  /* ── Section headings ── */
  .section-title {
    background: #1e3a5f; color: #fff;
    font-size: 8pt; font-weight: bold; text-transform: uppercase;
    letter-spacing: 0.06em; padding: 4px 8px; margin-top: 12px; margin-bottom: 6px;
  }

  /* ── 2-column grid ── */
  .grid2 { display: table; width: 100%; border-collapse: collapse; }
  .grid2 .col { display: table-cell; width: 50%; vertical-align: top; padding: 3px 6px; }
  .grid2 .col-full { display: table-cell; width: 100%; vertical-align: top; padding: 3px 6px; }

  /* ── Field label/value ── */
  .field-label { font-size: 7.5pt; color: #666; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 1px; }
  .field-value { font-size: 9pt; color: #1a1a1a; font-weight: bold; }

  /* ── Separator row ── */
  .divider { border-top: 1px solid #e0e0e0; margin: 6px 0; }

  /* ── Price table ── */
  .price-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  .price-table td { padding: 4px 8px; font-size: 9pt; border-bottom: 1px solid #f0f0f0; }
  .price-table .label { color: #555; }
  .price-table .value { text-align: right; font-weight: bold; }
  .price-table .total td { background: #1e3a5f; color: #fff; border-bottom: none; }
  .price-table .total .label { color: #cdd; font-weight: bold; }

  /* ── Terms / FAQ box ── */
  .terms-box { border: 1px solid #e0e0e0; border-radius: 3px; padding: 8px; margin-top: 8px; }
  .terms-title { font-size: 8pt; font-weight: bold; color: #1e3a5f; margin-bottom: 4px; }
  .terms-text { font-size: 7pt; color: #555; line-height: 1.45; }
  .terms-text p { margin-bottom: 3px; }

  /* ── Signature line ── */
  .sig-row { display: table; width: 100%; margin-top: 18px; }
  .sig-cell { display: table-cell; width: 33%; text-align: center; padding: 0 8px; }
  .sig-line { border-top: 1px solid #555; margin: 20px auto 4px; width: 80%; }
  .sig-label { font-size: 8pt; color: #555; }

  /* ── Notice box ── */
  .notice { background: #fff8e1; border-left: 4px solid #f59e0b; padding: 6px 10px; margin-top: 8px; font-size: 8pt; color: #7c5700; }

  /* ── Checklist ── */
  .checklist { margin-top: 6px; }
  .check-item { font-size: 8.5pt; color: #1a1a1a; margin-bottom: 4px; }
  .check-item::before { content: "☐  "; font-size: 10pt; }

  /* ── Inventory table ── */
  .inv-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  .inv-table th { background: #1e3a5f; color: #fff; font-size: 8pt; padding: 4px 6px; text-align: left; }
  .inv-table td { border: 1px solid #ddd; font-size: 8pt; padding: 3px 6px; }
  .inv-table .alt { background: #f8f9fb; }

  /* ── Footer ── */
  .footer { border-top: 1px solid #ccc; margin-top: 18px; padding-top: 6px; text-align: center; font-size: 7pt; color: #999; }

  /* ── Page break ── */
  .page-break { page-break-after: always; }
</style>
</head>
<body>
<div class="page">
  @yield('content')
</div>
</body>
</html>
