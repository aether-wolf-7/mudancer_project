<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 9pt; color: #1a1a1a; }
  .page { padding: 22px 28px; }
  .header { border-bottom: 2.5px solid #1e3a5f; padding-bottom: 10px; margin-bottom: 14px; }
  .provider-name { font-size: 13pt; font-weight: bold; color: #1e3a5f; }
  .provider-sub { font-size: 8pt; color: #555; margin-top: 1px; }
  .doc-title { font-size: 17pt; font-weight: bold; color: #1e3a5f; text-align: right; }
  .doc-id { font-size: 9pt; color: #555; text-align: right; margin-top: 2px; }
  .section-title { background: #1e3a5f; color: #fff; font-size: 8pt; font-weight: bold;
    text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 8px; margin-top: 12px; margin-bottom: 6px; }
  .grid2 { width: 100%; }
  .field-label { font-size: 7.5pt; color: #777; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 1px; }
  .field-value { font-size: 9pt; color: #1a1a1a; font-weight: bold; }
  .price-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  .price-table td { padding: 4px 8px; font-size: 9pt; border-bottom: 1px solid #f0f0f0; }
  .price-table .lbl { color: #555; }
  .price-table .val { text-align: right; font-weight: bold; }
  .price-total td { background: #1e3a5f; color: #fff; font-weight: bold; border-bottom: none; }
  .notice { background: #fff8e1; border-left: 3px solid #f59e0b; padding: 5px 8px; margin-top: 8px; font-size: 8pt; color: #7c5700; }
  .success-box { background: #f0fdf4; border-left: 3px solid #22c55e; padding: 8px 12px; margin-bottom: 12px; }
  .checklist { margin-top: 4px; }
  .check-item { font-size: 8.5pt; color: #1a1a1a; margin-bottom: 5px; }
  .check-item::before { content: "☐  "; font-size: 10pt; }
  .inv-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  .inv-table th { background: #1e3a5f; color: #fff; font-size: 8pt; padding: 4px 6px; text-align: left; }
  .inv-table td { border: 1px solid #ddd; font-size: 8pt; padding: 3px 6px; }
  .inv-table .alt { background: #f8f9fb; }
  .sig-table { width: 100%; margin-top: 20px; }
  .sig-line { border-top: 1px solid #555; margin: 16px auto 4px; width: 80%; }
  .sig-label { font-size: 8pt; color: #555; text-align: center; }
  .footer { border-top: 1px solid #ccc; margin-top: 14px; padding-top: 5px; text-align: center; font-size: 7pt; color: #aaa; }
  .page-break { page-break-after: always; }
  td { vertical-align: top; }
</style>
</head>
<body>
<div class="page">

  {{-- ── PAGE 1: SERVICE ORDER ── --}}
  <div class="header">
    <table style="width:100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="width:60%">
          <div class="provider-name">{{ $provider->nombre }}</div>
          <div class="provider-sub">RFC: {{ $provider->rfc }}</div>
          <div class="provider-sub">{{ $provider->domicilio }} &nbsp;|&nbsp; Tel. {{ $provider->telefono }}</div>
        </td>
        <td style="width:40%; text-align:right; vertical-align:middle">
          <div class="doc-title">ODS Proveedor</div>
          <div class="doc-id">Cotización: {{ $lead->lead_id }}</div>
          <div class="doc-id" style="color:#888; font-size:8pt">{{ now()->format('d/m/Y') }}</div>
        </td>
      </tr>
    </table>
  </div>

  {{-- ── CHECKLIST ── --}}
  <div class="success-box">
    <div style="font-size:10pt; font-weight:bold; color:#14532d; margin-bottom:4px">¡Felicidades, ganaste el servicio de mudanza!</div>
    <div style="font-size:8pt; color:#166534">Ahora es tu turno para que sea todo un éxito. Sigue estas recomendaciones antes del servicio:</div>
  </div>

  <div class="section-title">Checklist Pre-Servicio</div>
  <div class="checklist">
    <div class="check-item">Llama al cliente pronto — acuerden día y hora de la mudanza.</div>
    <div class="check-item">Solicita las ubicaciones de Maps para origen y destino.</div>
    <div class="check-item">Pregunta cómo identificarte al llegar y qué necesitas para ingresar (zonas privadas).</div>
    <div class="check-item">Confirma el método de pago (efectivo, transferencia, tarjeta).</div>
    <div class="check-item">Envía tu número de cuenta con tiempo suficiente.</div>
    <div class="check-item">Solicita datos del cliente para trámite de seguro (nombre completo e identificación).</div>
    <div class="check-item">Asegura todas tus cargas y cumple los requisitos de la aseguradora.</div>
    <div class="check-item">Negocia en el lugar cualquier excedente de carga, acarreo adicional o maniobras especiales.</div>
    <div class="check-item">Al finalizar la recolección, el cliente firmará el inventario completo.</div>
  </div>

  {{-- ── SERVICE DATA ── --}}
  <div class="section-title">Datos del Servicio</div>
  <table class="grid2" cellpadding="3" cellspacing="0">
    <tr>
      <td style="width:50%">
        <div class="field-label">Origen</div>
        <div class="field-value">{{ $lead->estado_origen }}, {{ $lead->localidad_origen }}{{ $lead->colonia_origen ? ', ' . $lead->colonia_origen : '' }}</div>
        <div style="font-size:8pt; color:#555; margin-top:1px">
          @if($lead->piso_origen) Piso/Nivel: {{ $lead->piso_origen }} &nbsp; @endif
          Elevador: {{ $lead->elevador_origen ? 'Sí' : 'No' }} &nbsp;
          @if($lead->acarreo_origen) Acarreo: {{ $lead->acarreo_origen }} @endif
        </div>
      </td>
      <td style="width:50%">
        <div class="field-label">Destino</div>
        <div class="field-value">{{ $lead->estado_destino }}, {{ $lead->localidad_destino }}{{ $lead->colonia_destino ? ', ' . $lead->colonia_destino : '' }}</div>
        <div style="font-size:8pt; color:#555; margin-top:1px">
          @if($lead->piso_destino) Piso/Nivel: {{ $lead->piso_destino }} &nbsp; @endif
          Elevador: {{ $lead->elevador_destino ? 'Sí' : 'No' }} &nbsp;
          @if($lead->acarreo_destino) Acarreo: {{ $lead->acarreo_destino }} @endif
        </div>
      </td>
    </tr>
    <tr>
      <td>
        <div class="field-label">Fecha de Recolección</div>
        <div class="field-value">{{ $lead->fecha_recoleccion ? \Carbon\Carbon::parse($lead->fecha_recoleccion)->format('d/m/Y') : '—' }}</div>
      </td>
      <td>
        <div class="field-label">Horario / Fecha de Llegada</div>
        <div class="field-value">{{ $lead->tiempo_estimado ?: 'Acordar cliente-operador' }}</div>
      </td>
    </tr>
    <tr>
      <td>
        <div class="field-label">Modalidad del Servicio</div>
        <div class="field-value">{{ $lead->modalidad ?: '—' }}</div>
      </td>
      <td>
        <div class="field-label">Empaque</div>
        <div class="field-value">{{ $lead->empaque ?: '—' }}</div>
      </td>
    </tr>
    @if($lead->seguro)
    <tr>
      <td>
        <div class="field-label">Valor Declarado (Seguro)</div>
        <div class="field-value">${{ number_format($lead->seguro, 2) }}</div>
      </td>
      <td>
        <div class="field-label">Póliza de Seguro (1.5%)</div>
        <div class="field-value">${{ number_format($quote->tarifa_seguro ?? ($lead->seguro * 0.015), 2) }}</div>
      </td>
    </tr>
    @endif
    @if($lead->observaciones)
    <tr>
      <td colspan="2">
        <div class="field-label">Observaciones</div>
        <div class="field-value" style="font-weight:normal">{{ $lead->observaciones }}</div>
      </td>
    </tr>
    @endif
  </table>

  {{-- ── CLIENT ── --}}
  <div class="section-title">Cliente</div>
  <table class="grid2" cellpadding="3" cellspacing="0">
    <tr>
      <td style="width:50%">
        <div class="field-label">Nombre del Cliente</div>
        <div class="field-value">{{ $lead->nombre_cliente }}</div>
      </td>
      <td style="width:50%">
        <div class="field-label">Teléfono del Cliente</div>
        <div class="field-value">{{ $lead->telefono_cliente }}</div>
      </td>
    </tr>
  </table>

  {{-- ── PRICE BREAKDOWN ── --}}
  <div class="section-title">Cobros del Servicio</div>
  <table class="price-table" cellpadding="0" cellspacing="0">
    <tr><td class="lbl">A cobrar día de la recolección (Anticipo)</td><td class="val">${{ number_format($quote->anticipo, 2) }}</td></tr>
    <tr><td class="lbl">A cobrar a la llegada a destino (Pago Final)</td><td class="val">${{ number_format($quote->pago_final, 2) }}</td></tr>
    @if($quote->tarifa_seguro)
    <tr><td class="lbl">Póliza de seguro (1.5%)</td><td class="val">${{ number_format($quote->tarifa_seguro, 2) }}</td></tr>
    @endif
    <tr class="price-total">
      <td class="lbl" style="color:#eee">Total a Cobrar</td>
      <td class="val" style="color:#fff">${{ number_format($quote->precio_total, 2) }}</td>
    </tr>
  </table>

  <div class="notice">
    IMPORTANTE: Todos los servicios deben estar pagados en su totalidad antes de la descarga. FACTURACIÓN: Si el cliente necesita factura, el proveedor debe pedirle sus datos y enviársela directamente.
  </div>

  {{-- ── SIGNATURES PAGE 1 ── --}}
  <table class="sig-table" cellpadding="0" cellspacing="0">
    <tr>
      <td style="width:50%; text-align:center; padding:0 12px">
        <div class="sig-line"></div>
        <div class="sig-label">{{ $provider->responsable }}<br><span style="color:#888">Responsable del Servicio</span></div>
      </td>
      <td style="width:50%; text-align:center; padding:0 12px">
        <div class="sig-line"></div>
        <div class="sig-label">{{ $lead->nombre_cliente }}<br><span style="color:#888">Cliente — Tel. {{ $lead->telefono_cliente }}</span></div>
      </td>
    </tr>
  </table>

  <div class="footer">{{ $provider->nombre }} &nbsp;|&nbsp; RFC: {{ $provider->rfc }} &nbsp;|&nbsp; Tel. {{ $provider->telefono }}</div>

  {{-- ── PAGE 2: INVENTORY ── --}}
  <div class="page-break"></div>

  <div class="header" style="margin-bottom:10px">
    <table style="width:100%" cellpadding="0" cellspacing="0">
      <tr>
        <td><div class="provider-name">{{ $provider->nombre }}</div></td>
        <td style="text-align:right">
          <div style="font-size:12pt; font-weight:bold; color:#1e3a5f">Inventario</div>
          <div style="font-size:8pt; color:#555">Cotización: {{ $lead->lead_id }}</div>
        </td>
      </tr>
    </table>
  </div>

  @if($lead->inventario)
  <div class="section-title">Artículos Declarados</div>
  <div style="font-size:9pt; color:#333; line-height:1.6; padding:4px 0">{{ $lead->inventario }}</div>
  @if($lead->articulos_delicados)
  <div class="section-title">Artículos Delicados / Especiales</div>
  <div style="font-size:9pt; color:#333; line-height:1.6; padding:4px 0">{{ $lead->articulos_delicados }}</div>
  @endif
  @endif

  @php
    $invItems = $lead->inventario_recoleccion ?? [];
    // Ensure at least 40 blank slots
    $totalSlots = max(40, count($invItems) + 4);
    // Build a flat array of 40 items (filled + blank rows)
    $allItems = [];
    for ($i = 1; $i <= $totalSlots; $i++) {
        $data = $invItems[$i - 1] ?? null;
        $allItems[] = [
            'no'       => $i,
            'articulo' => $data['articulo'] ?? '',
            'condicion'=> $data['condicion'] ?? '',
        ];
    }
    // Split into two pages of 20 items each (displayed 2 columns per row = 10 rows)
    $pageChunks = array_chunk($allItems, 20);
  @endphp

  <div class="section-title">Inventario de Recolección</div>
  <p style="font-size:7.5pt; color:#666; margin-bottom:5px">Condiciones: RT Roto | CO Cortado | FL Flojo | OX Oxidado | QU Quemado | AR Arañado | DP Despegado | BUM Golpeado | RAY Rayado | FAL Faltante | SU Sucio | AB Abollado | RAJ Rajado | CD Desarmado | FR Fracturado | NF No Funciona</p>

  @foreach($pageChunks as $pageIdx => $pageItems)
    @if($pageIdx > 0)
    <div class="page-break"></div>
    <div class="header" style="margin-bottom:8px">
      <table style="width:100%" cellpadding="0" cellspacing="0"><tr>
        <td><div class="provider-name">{{ $provider->nombre }}</div></td>
        <td style="text-align:right"><div style="font-size:11pt; font-weight:bold; color:#1e3a5f">Inventario (cont.) — {{ $lead->lead_id }}</div></td>
      </tr></table>
    </div>
    <p style="font-size:7.5pt; color:#666; margin-bottom:5px">Condiciones: RT Roto | CO Cortado | FL Flojo | OX Oxidado | QU Quemado | AR Arañado | DP Despegado | BUM Golpeado | RAY Rayado | FAL Faltante | SU Sucio | AB Abollado | RAJ Rajado | CD Desarmado | FR Fracturado | NF No Funciona</p>
    @endif

    {{-- 2-column table: left half (items 1-10 of chunk) / right half (items 11-20 of chunk) --}}
    @php
      $leftCol  = array_slice($pageItems, 0, 10);
      $rightCol = array_slice($pageItems, 10, 10);
      // Pad to same length
      while (count($leftCol)  < 10) $leftCol[]  = ['no' => '—', 'articulo' => '', 'condicion' => ''];
      while (count($rightCol) < 10) $rightCol[] = ['no' => '—', 'articulo' => '', 'condicion' => ''];
    @endphp

    <table style="width:100%; border-collapse:collapse" cellpadding="0" cellspacing="0">
      {{-- Column headers --}}
      <tr>
        <td style="width:49%">
          <table style="width:100%; border-collapse:collapse" cellpadding="0" cellspacing="0">
            <tr>
              <th style="background:#1e3a5f; color:#fff; font-size:7.5pt; padding:3px 5px; width:10%; text-align:center">No.</th>
              <th style="background:#1e3a5f; color:#fff; font-size:7.5pt; padding:3px 5px; width:68%">Artículo</th>
              <th style="background:#1e3a5f; color:#fff; font-size:7.5pt; padding:3px 5px; width:22%; text-align:center">Condición</th>
            </tr>
            @foreach($leftCol as $idx => $item)
            <tr style="{{ $idx % 2 == 0 ? '' : 'background:#f8f9fb' }}">
              <td style="border:1px solid #ddd; font-size:7.5pt; padding:2px 4px; text-align:center">{{ $item['no'] }}</td>
              <td style="border:1px solid #ddd; font-size:7.5pt; padding:2px 4px">{{ $item['articulo'] ?: '&nbsp;' }}</td>
              <td style="border:1px solid #ddd; font-size:7.5pt; padding:2px 4px; text-align:center">{{ $item['condicion'] ?: '&nbsp;' }}</td>
            </tr>
            @endforeach
          </table>
        </td>
        <td style="width:2%"></td>
        <td style="width:49%">
          <table style="width:100%; border-collapse:collapse" cellpadding="0" cellspacing="0">
            <tr>
              <th style="background:#1e3a5f; color:#fff; font-size:7.5pt; padding:3px 5px; width:10%; text-align:center">No.</th>
              <th style="background:#1e3a5f; color:#fff; font-size:7.5pt; padding:3px 5px; width:68%">Artículo</th>
              <th style="background:#1e3a5f; color:#fff; font-size:7.5pt; padding:3px 5px; width:22%; text-align:center">Condición</th>
            </tr>
            @foreach($rightCol as $idx => $item)
            <tr style="{{ $idx % 2 == 0 ? '' : 'background:#f8f9fb' }}">
              <td style="border:1px solid #ddd; font-size:7.5pt; padding:2px 4px; text-align:center">{{ $item['no'] }}</td>
              <td style="border:1px solid #ddd; font-size:7.5pt; padding:2px 4px">{{ $item['articulo'] ?: '&nbsp;' }}</td>
              <td style="border:1px solid #ddd; font-size:7.5pt; padding:2px 4px; text-align:center">{{ $item['condicion'] ?: '&nbsp;' }}</td>
            </tr>
            @endforeach
          </table>
        </td>
      </tr>
    </table>

    @if($loop->last)
    {{-- Signatures after final inventory page --}}
    <table class="sig-table" cellpadding="0" cellspacing="0" style="margin-top:16px">
      <tr>
        <td style="width:50%; text-align:center; padding:0 12px">
          <div class="sig-line"></div>
          <div class="sig-label">Firma Entregado — Cliente</div>
        </td>
        <td style="width:50%; text-align:center; padding:0 12px">
          <div class="sig-line"></div>
          <div class="sig-label">Firma Recibido — Proveedor</div>
        </td>
      </tr>
    </table>
    @endif
  @endforeach

  {{-- ── PAGE 3: VEHICLE INVENTORY (optional) ── --}}
  <div class="page-break"></div>

  <div class="header" style="margin-bottom:10px">
    <table style="width:100%" cellpadding="0" cellspacing="0">
      <tr>
        <td><div class="provider-name">{{ $provider->nombre }}</div></td>
        <td style="text-align:right">
          <div style="font-size:11pt; font-weight:bold; color:#1e3a5f">Inventario — Vehículo / Motocicleta</div>
          <div style="font-size:8pt; color:#555">Orden de Servicio: {{ $lead->lead_id }}</div>
        </td>
      </tr>
    </table>
  </div>

  <div class="section-title">Inventario de Vehículo (Llenar durante la Recolección)</div>
  <table style="width:100%; border-collapse:collapse; margin-top:6px" cellpadding="4" cellspacing="0">
    <tr>
      <td style="width:25%; border:1px solid #ddd"><strong style="font-size:7.5pt; color:#777">TIPO</strong><br><span style="font-size:9pt">&nbsp;</span></td>
      <td style="width:25%; border:1px solid #ddd"><strong style="font-size:7.5pt; color:#777">MODELO</strong><br><span style="font-size:9pt">&nbsp;</span></td>
      <td style="width:25%; border:1px solid #ddd"><strong style="font-size:7.5pt; color:#777">MARCA</strong><br><span style="font-size:9pt">&nbsp;</span></td>
      <td style="width:25%; border:1px solid #ddd"><strong style="font-size:7.5pt; color:#777">PLACAS</strong><br><span style="font-size:9pt">&nbsp;</span></td>
    </tr>
  </table>
  <table style="width:100%; margin-top:8px" cellpadding="4" cellspacing="0">
    <tr>
      <td style="width:50%; border-top:1px solid #555; text-align:center; padding-top:16px; font-size:8pt; color:#555">Firma Entregado — Propietario</td>
      <td style="width:50%; border-top:1px solid #555; text-align:center; padding-top:16px; font-size:8pt; color:#555">Firma Recibido — Proveedor</td>
    </tr>
  </table>
  <div style="font-size:7.5pt; color:#555; margin-top:6px">
    <strong>Observaciones:</strong> ___________________________________________________________________________________________________________
  </div>
  <div style="font-size:7.5pt; color:#777; margin-top:4px; font-style:italic">
    Artículos extra dentro del vehículo viajan por decisión, conveniencia, aceptación y responsabilidad del cliente.
  </div>

  <div class="section-title" style="margin-top:16px">Inventario de Motocicleta (Llenar durante la Recolección)</div>
  <table style="width:100%; border-collapse:collapse; margin-top:6px" cellpadding="4" cellspacing="0">
    <tr>
      <td style="width:25%; border:1px solid #ddd"><strong style="font-size:7.5pt; color:#777">TIPO</strong><br><span style="font-size:9pt">&nbsp;</span></td>
      <td style="width:25%; border:1px solid #ddd"><strong style="font-size:7.5pt; color:#777">MODELO</strong><br><span style="font-size:9pt">&nbsp;</span></td>
      <td style="width:25%; border:1px solid #ddd"><strong style="font-size:7.5pt; color:#777">MARCA</strong><br><span style="font-size:9pt">&nbsp;</span></td>
      <td style="width:25%; border:1px solid #ddd"><strong style="font-size:7.5pt; color:#777">PLACAS</strong><br><span style="font-size:9pt">&nbsp;</span></td>
    </tr>
  </table>
  <table style="width:100%; margin-top:8px" cellpadding="4" cellspacing="0">
    <tr>
      <td style="width:50%; border-top:1px solid #555; text-align:center; padding-top:16px; font-size:8pt; color:#555">Firma Entregado — Propietario</td>
      <td style="width:50%; border-top:1px solid #555; text-align:center; padding-top:16px; font-size:8pt; color:#555">Firma Recibido — Proveedor</td>
    </tr>
  </table>
  <div style="font-size:7.5pt; color:#555; margin-top:6px">
    <strong>Observaciones:</strong> ___________________________________________________________________________________________________________
  </div>

  <div class="footer">
    {{ $provider->nombre }} &nbsp;|&nbsp; RFC: {{ $provider->rfc }} &nbsp;|&nbsp; Tel. {{ $provider->telefono }} &nbsp;|&nbsp;
    Generado el {{ now()->format('d/m/Y H:i') }}
  </div>

</div>
</body>
</html>
