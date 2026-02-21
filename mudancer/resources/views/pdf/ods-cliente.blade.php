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
  .notice { background: #fff8e1; border-left: 3px solid #f59e0b; padding: 5px 8px; margin-top: 8px; font-size: 8pt; color: #7c5700; }
  .sig-table { width: 100%; margin-top: 20px; }
  .sig-line { border-top: 1px solid #555; margin: 16px auto 4px; width: 80%; }
  .sig-label { font-size: 8pt; color: #555; text-align: center; }
  .faq-title { font-size: 8pt; font-weight: bold; color: #1e3a5f; margin: 5px 0 2px; }
  .faq-text { font-size: 7pt; color: #555; line-height: 1.4; margin-bottom: 4px; }
  .footer { border-top: 1px solid #ccc; margin-top: 14px; padding-top: 5px; text-align: center; font-size: 7pt; color: #aaa; }
  .page-break { page-break-after: always; }
  td { vertical-align: top; }
</style>
</head>
<body>
<div class="page">

  {{-- ── HEADER ── --}}
  <div class="header">
    <table style="width:100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="width:60%">
          <div class="provider-name">{{ $provider->nombre }}</div>
          <div class="provider-sub">RFC: {{ $provider->rfc }}</div>
          <div class="provider-sub">{{ $provider->domicilio }} &nbsp;|&nbsp; Tel. {{ $provider->telefono }}</div>
        </td>
        <td style="width:40%; text-align:right; vertical-align:middle">
          <div class="doc-title">Orden de Servicio</div>
          <div class="doc-id">Cotización: {{ $lead->lead_id }}</div>
          <div class="doc-id" style="color:#888; font-size:8pt">{{ now()->format('d/m/Y') }}</div>
        </td>
      </tr>
    </table>
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
        <div class="field-label">Horario / Fecha de Llegada a Destino</div>
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
        <div class="field-label">Seguro (Valor Declarado)</div>
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

  {{-- ── PROVIDER ── --}}
  <div class="section-title">Empresa Responsable</div>
  <table class="grid2" cellpadding="3" cellspacing="0">
    <tr>
      <td style="width:50%">
        <div class="field-label">Responsable del Servicio</div>
        <div class="field-value">{{ $provider->responsable }}</div>
      </td>
      <td style="width:50%">
        <div class="field-label">Teléfono</div>
        <div class="field-value">{{ $provider->telefono }}</div>
      </td>
    </tr>
  </table>

  {{-- ── INVENTORY ── --}}
  @if($lead->inventario)
  <div class="section-title">Inventario</div>
  <div style="font-size:8.5pt; color:#333; line-height:1.5; padding:4px 0">{{ $lead->inventario }}</div>
  @endif

  <div class="notice">
    IMPORTANTE: Todos los servicios deben estar pagados en su totalidad antes de la descarga en destino.
  </div>

  {{-- ── INCLUDED/NOT INCLUDED ── --}}
  <div class="section-title">El Servicio Incluye</div>
  <div style="font-size:8pt; color:#333; line-height:1.45">
    Maniobras de carga, descarga, acarreo hasta 30 mts. y pisos especificados. Protección básica con emplayado de muebles de tela (colchones, sillones, sillas, etc.) y piezas delicadas. Protección con colchonetas. Traslado en la modalidad especificada. <em>(Salvo previo acuerdo y especificado en las observaciones.)</em>
  </div>
  <div class="section-title">El Servicio No Incluye</div>
  <div style="font-size:8pt; color:#333; line-height:1.45">
    Voladuras, empaques, cajas, roperos, acomodo de cristalería, maniobras especiales, desarmados/armados especiales, carga de muebles llenos, acarreos &gt;30 mts., trabajos de electricidad, plomería, jardinería, albañilería, permisos municipales/sindicales, almacenajes, colgado de cuadros/espejos, empaque/desempaque, y ningún servicio no contemplado en este presupuesto. <em>(Salvo previo acuerdo.)</em>
  </div>

  {{-- ── SIGNATURES ── --}}
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

  {{-- ── TERMS & CONDITIONS (page 2) ── --}}
  <div class="page-break"></div>

  <div class="header" style="margin-bottom:10px">
    <table style="width:100%" cellpadding="0" cellspacing="0">
      <tr>
        <td><div class="provider-name">{{ $provider->nombre }}</div></td>
        <td style="text-align:right"><div class="doc-title" style="font-size:12pt">Términos y Condiciones</div></td>
      </tr>
    </table>
  </div>

  <div style="font-size:7.5pt; color:#333; line-height:1.5">
    <p style="font-style:italic; margin-bottom:8px">Antes que nada: gracias por confiar en nosotros. Sabemos que una mudanza no es solo trasladar muebles. Estás moviendo recuerdos, historias y partes importantes de tu vida. Nuestro compromiso es acompañarte con profesionalismo, cuidado y honestidad.</p>

    <p style="font-weight:bold; margin-top:6px">1. Intermediación</p>
    <p>Red de Mudanzas Confiables actúa únicamente como intermediario y/o facilitador en la conexión entre tú y empresas de mudanzas formales. No transporta ni manipula los bienes. La ejecución del servicio corresponde a {{ $provider->nombre }}, quien asume la responsabilidad total del manejo de la carga.</p>

    <p style="font-weight:bold; margin-top:6px">2. Naturaleza del Servicio</p>
    <p>Una mudanza es un servicio logístico terrestre. Aunque se trabaje con cuidado, existen riesgos físicos inevitables: vibraciones, frenados, maniobras y movimientos durante el transporte. Mayor riesgo en artículos frágiles (vidrio, cristal, cerámica, mármol, electrónicos).</p>

    <p style="font-weight:bold; margin-top:6px">3. Responsabilidad de la Empresa de Mudanzas</p>
    <p>La empresa es responsable de los bienes únicamente durante la carga, traslado y descarga. No será responsable por pérdidas o daños ocasionados por fuerza mayor o caso fortuito. Quedan excluidos: daños internos en aparatos electrónicos, contenido de cajas empacadas por el cliente, reclamos posteriores a la firma de conformidad.</p>

    <p style="font-weight:bold; margin-top:6px">4. Responsabilidad del Cliente</p>
    <p>Es responsabilidad del cliente revisar previamente el tipo de maniobras posibles en origen y destino. En servicios compartidos, debe designar una persona en destino para recibir la carga y firmar de conformidad.</p>

    <p style="font-weight:bold; margin-top:6px">5. Condiciones de Pago</p>
    <p>Todos los servicios deberán estar pagados en su totalidad antes de la descarga en destino.</p>

    <p style="font-weight:bold; margin-top:6px">6. Garantía y Reclamaciones</p>
    <p>El cliente tiene la obligación de verificar el estado de sus pertenencias al momento de la entrega. No se aceptarán reclamos posteriores una vez firmada la conformidad. En caso de daño comprobado por mal manejo, la empresa responde hasta el 10% del total del flete.</p>

    <p style="font-weight:bold; margin-top:6px">7. Seguro de Carga</p>
    <p>Las empresas de mudanzas no proporcionan seguro de carga. Sin seguro: el servicio corre por cuenta y riesgo del cliente. Con seguro: la atención e indemnizaciones se gestionan directamente con la aseguradora.</p>

    <p style="font-weight:bold; margin-top:6px">8. Empaque</p>
    <p>Peso máximo en cajas: 20 kg. Se recomiendan solo para objetos ligeros. Artículos frágiles requieren embalaje especial (rejas de madera, contenedores rígidos).</p>

    <p style="font-weight:bold; margin-top:6px">9. Pagos y Cancelaciones</p>
    <p>Reservación/Apartado: no reembolsable. Cancelación: penalización del 30% al 70% del valor anticipado, dependiendo del tiempo de aviso previo y la ruta contratada.</p>

    <p style="font-weight:bold; margin-top:6px">Artículos Prohibidos</p>
    <p>Drogas, narcóticos, armas o municiones, joyas, dinero en efectivo, bonos, animales, plantas protegidas, personas. Si el cliente incluye alguno de estos artículos, será el único responsable de las consecuencias legales y económicas.</p>
  </div>

  <div class="footer">
    {{ $provider->nombre }} &nbsp;|&nbsp; RFC: {{ $provider->rfc }} &nbsp;|&nbsp; {{ $provider->domicilio }} &nbsp;|&nbsp; Tel. {{ $provider->telefono }}<br>
    Documento generado el {{ now()->format('d/m/Y H:i') }}
  </div>

</div>
</body>
</html>
