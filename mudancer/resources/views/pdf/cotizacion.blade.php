<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 9pt; color: #1a1a1a; }
  .page { padding: 22px 28px; }
  .header { border-bottom: 2.5px solid #1e3a5f; padding-bottom: 10px; margin-bottom: 14px; }
  .header-table { width: 100%; }
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
  .terms-title { font-size: 8pt; font-weight: bold; color: #1e3a5f; margin-bottom: 4px; margin-top: 8px; }
  .terms-text { font-size: 7pt; color: #555; line-height: 1.4; }
  .terms-text p { margin-bottom: 3px; }
  .sig-table { width: 100%; margin-top: 20px; }
  .sig-line { border-top: 1px solid #555; margin: 16px auto 4px; width: 80%; }
  .sig-label { font-size: 8pt; color: #555; text-align: center; }
  .notice { background: #fff8e1; border-left: 3px solid #f59e0b; padding: 5px 8px; margin-top: 8px; font-size: 8pt; color: #7c5700; }
  .footer { border-top: 1px solid #ccc; margin-top: 14px; padding-top: 5px; text-align: center; font-size: 7pt; color: #aaa; }
  .divider { border-top: 1px solid #e8e8e8; margin: 6px 0; }
  .page-break { page-break-after: always; }
  td { vertical-align: top; }
</style>
</head>
<body>
<div class="page">

  {{-- ── HEADER ── --}}
  <div class="header">
    <table class="header-table" cellpadding="0" cellspacing="0">
      <tr>
        <td style="width:60%">
          <div class="provider-name">{{ $provider->nombre }}</div>
          <div class="provider-sub">RFC: {{ $provider->rfc }}</div>
          <div class="provider-sub">{{ $provider->domicilio }} &nbsp;|&nbsp; Tel. {{ $provider->telefono }}</div>
        </td>
        <td style="width:40%; text-align:right; vertical-align:middle">
          <div class="doc-title">Cotización</div>
          <div class="doc-id">ID: {{ $lead->lead_id }}</div>
          <div class="doc-id" style="color:#888; font-size:8pt">{{ now()->format('d/m/Y') }}</div>
        </td>
      </tr>
    </table>
  </div>

  {{-- ── ROUTE ── --}}
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
      <td colspan="2">
        <div class="field-label">Valor Declarado (Seguro)</div>
        <div class="field-value">${{ number_format($lead->seguro, 2) }}</div>
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
        <div class="field-label">Nombre</div>
        <div class="field-value">{{ $lead->nombre_cliente }}</div>
      </td>
      <td style="width:50%">
        <div class="field-label">Teléfono</div>
        <div class="field-value">{{ $lead->telefono_cliente }}</div>
      </td>
    </tr>
  </table>

  {{-- ── INVENTORY ── --}}
  @if($lead->inventario)
  <div class="section-title">Inventario</div>
  <div style="font-size:8.5pt; color:#333; line-height:1.5; padding:4px 0">{{ $lead->inventario }}</div>
  @endif

  {{-- ── RESPONSIBLE ── --}}
  <div class="section-title">Responsable del Servicio</div>
  <table class="grid2" cellpadding="3" cellspacing="0">
    <tr>
      <td style="width:50%">
        <div class="field-label">Proveedor Responsable</div>
        <div class="field-value">{{ $provider->responsable }}</div>
      </td>
      <td style="width:50%">
        <div class="field-label">Teléfono Proveedor</div>
        <div class="field-value">{{ $provider->telefono }}</div>
      </td>
    </tr>
  </table>

  {{-- ── PRICE BREAKDOWN ── --}}
  <div class="section-title">Desglose de Precios</div>
  <table class="price-table" cellpadding="0" cellspacing="0">
    <tr><td class="lbl">Apartado (reserva de espacio)</td><td class="val">${{ number_format($quote->apartado, 2) }}</td></tr>
    <tr><td class="lbl">Anticipo (día de recolección)</td><td class="val">${{ number_format($quote->anticipo, 2) }}</td></tr>
    <tr><td class="lbl">Pago a la llegada a destino</td><td class="val">${{ number_format($quote->pago_final, 2) }}</td></tr>
    @if($quote->tarifa_seguro)
    <tr><td class="lbl">Póliza de seguro (1.5%)</td><td class="val">${{ number_format($quote->tarifa_seguro, 2) }}</td></tr>
    @endif
    <tr class="price-total">
      <td class="lbl" style="color:#eee">Total sin IVA</td>
      <td class="val" style="color:#fff">${{ number_format($quote->precio_total, 2) }}</td>
    </tr>
  </table>

  <div class="notice">
    IMPORTANTE: Todos los servicios deben estar pagados en su totalidad antes de la descarga en destino.
  </div>

  {{-- ── INCLUDED / NOT INCLUDED ── --}}
  <div class="section-title">El Servicio Incluye</div>
  <div style="font-size:8pt; color:#333; line-height:1.45">
    Maniobras de carga, descarga, acarreo hasta 30 mts. y pisos especificados. Protección básica con emplayado de muebles de tela (colchones, sillones, sillas, etc.) y piezas delicadas. Protección con colchonetas. Traslado en la modalidad especificada. <em>(Salvo previo acuerdo y especificado en las observaciones.)</em>
  </div>

  <div class="section-title">El Servicio No Incluye</div>
  <div style="font-size:8pt; color:#333; line-height:1.45">
    Voladuras, empaques, cajas, roperos, acomodo de cristalería, maniobras especiales, desarmados/armados especiales, carga de muebles llenos, acarreos &gt;30 mts., trabajos de electricidad, plomería, jardinería, albañilería, permisos municipales/sindicales, almacenajes, colgado de cuadros/espejos, empaque/desempaque de cajas, y ningún servicio no contemplado en este presupuesto. <em>(Salvo previo acuerdo y especificado en las observaciones.)</em>
  </div>

  {{-- ── SIGNATURES ── --}}
  <table class="sig-table" cellpadding="0" cellspacing="0">
    <tr>
      <td style="width:33%; text-align:center; padding:0 8px">
        <div class="sig-line"></div>
        <div class="sig-label">{{ $provider->responsable }}<br><span style="color:#888">Responsable del Servicio</span></div>
      </td>
      <td style="width:33%; text-align:center; padding:0 8px">
        <div class="sig-line"></div>
        <div class="sig-label">{{ $lead->nombre_cliente }}<br><span style="color:#888">Cliente — Tel. {{ $lead->telefono_cliente }}</span></div>
      </td>
      <td style="width:33%; text-align:center; padding:0 8px">
        <div class="sig-line"></div>
        <div class="sig-label">Fecha y Firma de Conformidad</div>
      </td>
    </tr>
  </table>

  <div class="footer">
    {{ $provider->nombre }} &nbsp;|&nbsp; RFC: {{ $provider->rfc }} &nbsp;|&nbsp; {{ $provider->domicilio }} &nbsp;|&nbsp; Tel. {{ $provider->telefono }}<br>
    Documento generado el {{ now()->format('d/m/Y H:i') }}
  </div>

</div>
</body>
</html>
