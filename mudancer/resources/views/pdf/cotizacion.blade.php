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

  {{-- ── ROW 1: CLIENT / PHONE / RESPONSIBLE (exact template order) ── --}}
  <table class="grid2" cellpadding="4" cellspacing="0" style="border-bottom:1px solid #e5e7eb; margin-bottom:8px">
    <tr>
      <td style="width:38%">
        <div class="field-label">Cliente</div>
        <div class="field-value">{{ $lead->nombre_cliente }}</div>
      </td>
      <td style="width:28%">
        <div class="field-label">Teléfono</div>
        <div class="field-value">{{ $lead->telefono_cliente }}</div>
      </td>
      <td style="width:34%">
        <div class="field-label">Responsable del Servicio</div>
        <div class="field-value">{{ $provider->responsable }}</div>
      </td>
    </tr>
  </table>

  {{-- ── PRICE BOX (immediately after client row, per template) ── --}}
  <table class="price-table" cellpadding="0" cellspacing="0" style="margin-bottom:10px">
    <tr><td class="lbl">Apartado de servicio</td><td class="val">${{ number_format($quote->apartado, 2) }}</td></tr>
    <tr><td class="lbl">Seguro</td><td class="val">{{ $quote->tarifa_seguro ? '$' . number_format($quote->tarifa_seguro, 2) : '—' }}</td></tr>
    <tr><td class="lbl">Anticipo</td><td class="val">${{ number_format($quote->anticipo, 2) }}</td></tr>
    <tr><td class="lbl">Pago a la llegada</td><td class="val">${{ number_format($quote->pago_final, 2) }}</td></tr>
    <tr class="price-total">
      <td class="lbl" style="color:#eee">Total sin IVA</td>
      <td class="val" style="color:#fff">${{ number_format($quote->precio_total, 2) }}</td>
    </tr>
  </table>

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
        <div class="field-label">Fecha de Llegada a Destino</div>
        <div class="field-value">
          @if(!empty($lead->fecha_entrega))
            {{ \Carbon\Carbon::parse($lead->fecha_entrega)->format('d/m/Y') }}
          @elseif($lead->tiempo_estimado)
            {{ $lead->tiempo_estimado }}
          @else
            Acordar cliente-operador
          @endif
        </div>
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
        <div class="field-label">Seguro (Valor Declarado)</div>
        <div class="field-value">${{ number_format($lead->seguro, 2) }}</div>
      </td>
      <td></td>
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

  {{-- ── INCLUDED / NOT INCLUDED ── --}}
  <div class="section-title">El Servicio Incluye</div>
  <div style="font-size:8pt; color:#333; line-height:1.45">
    (Salvo previo acuerdo y especificado en las observaciones.) Maniobras de carga, descarga, acarreo hasta 30 mts. y pisos especificados en la carátula. Protección básica con emplayado de sus muebles de tela (colchones, sillones, sillas, etc.) y de sus piezas más delicadas. Protección con colchonetas. Traslado en la modalidad de servicio especificado en la carátula de la cotización.
  </div>

  <div class="section-title">El Servicio No Incluye</div>
  <div style="font-size:8pt; color:#333; line-height:1.45">
    (Salvo previo acuerdo y especificado en las observaciones.) Voladuras, empaques, cajas, roperos, acomodo de cristalería, maniobras especiales, desarmados y/o armados especiales, carga de muebles llenos, acarreos más de 30 mts., trabajos de electricidad, plomería, jardinería, albañilería, trabajos especiales, manejos y cargos aduanales, rejas de madera, demoras, almacenajes, colgado de cuadros y/o espejos o decoraciones, empaque y desempaque de cajas, desempotrar muebles incrustados en la pared, permisos municipales y/o sindicales, estadías por demora para entrega atribuible al cliente, y ningún servicio no contemplado en este presupuesto.
  </div>

  <div class="section-title">Artículos Prohibidos en las Mudanzas</div>
  <div style="font-size:8pt; color:#333; line-height:1.45">
    Drogas, narcóticos, armas o municiones, joyas, dinero en efectivo, bonos, animales, plantas protegidas, personas. En caso de que el cliente incluya en su menaje alguno de los artículos mencionados con anterioridad o algún otro ilegal o que perjudique a la empresa, se hará responsable de todo lo que pudiese resultar a nivel legal y económico, y deslindará a la empresa de mudanzas de cualquier acción legal y no legal que pudiese existir.
  </div>

  <div class="notice" style="margin-top:8px">
    IMPORTANTE: Todos los servicios deben estar pagados en su totalidad antes de la descarga en destino.
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

  {{-- ═══════════════════════════════════════════════════
       PAGE 2 — INVENTORY
  ═══════════════════════════════════════════════════ --}}
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
  <div class="section-title">Artículos Declarados por el Cliente</div>
  <div style="font-size:9pt; color:#333; line-height:1.6; padding:4px 0">{{ $lead->inventario }}</div>
  @endif

  @if($lead->articulos_delicados)
  <div class="section-title">Artículos Delicados / Especiales</div>
  <div style="font-size:9pt; color:#333; line-height:1.6; padding:4px 0">{{ $lead->articulos_delicados }}</div>
  @endif

  @if(!$lead->inventario && !$lead->articulos_delicados)
  <div style="font-size:9pt; color:#aaa; margin:20px 0; font-style:italic; text-align:center">El cliente no declaró inventario previo.</div>
  @endif

  <div class="notice" style="margin-top:16px">
    Este inventario fue declarado por el cliente al solicitar el servicio y es de carácter referencial. El inventario oficial se levantará durante la recolección y deberá ser firmado por ambas partes.
  </div>

  <div class="footer">
    {{ $provider->nombre }} &nbsp;|&nbsp; RFC: {{ $provider->rfc }} &nbsp;|&nbsp; Tel. {{ $provider->telefono }} &nbsp;|&nbsp; Página 2
  </div>

  {{-- ═══════════════════════════════════════════════════
       PAGE 3 — TERMS & CONDITIONS (sections 1–7)
  ═══════════════════════════════════════════════════ --}}
  <div class="page-break"></div>

  <div class="header" style="margin-bottom:10px">
    <table style="width:100%" cellpadding="0" cellspacing="0">
      <tr>
        <td><div class="provider-name">{{ $provider->nombre }}</div></td>
        <td style="text-align:right">
          <div style="font-size:12pt; font-weight:bold; color:#1e3a5f">Términos y Condiciones</div>
          <div style="font-size:8pt; color:#555">Cotización: {{ $lead->lead_id }}</div>
        </td>
      </tr>
    </table>
  </div>

  <div style="font-size:7.5pt; color:#333; line-height:1.5">

    <p style="font-style:italic; color:#555; margin-bottom:8px">
      Antes que nada: gracias por confiar en nosotros. Sabemos que una mudanza no es solo trasladar muebles. Estás moviendo recuerdos, historias y partes importantes de tu vida. Nuestro compromiso es acompañarte con profesionalismo, cuidado y honestidad.
    </p>

    <p class="terms-title">1. Intermediación</p>
    <p>Red de Mudanzas Confiables actúa únicamente como intermediario y/o facilitador en la conexión entre el cliente y empresas de mudanzas formales y verificadas. No transporta ni manipula los bienes directamente. La ejecución del servicio corresponde a {{ $provider->nombre }}, quien asume la responsabilidad total del manejo de la carga durante el servicio contratado.</p>

    <p class="terms-title">2. Naturaleza del Servicio</p>
    <p>Una mudanza es un servicio logístico terrestre. Aunque se trabaje con el mayor cuidado posible, existen riesgos físicos inevitables inherentes al transporte: vibraciones de la unidad, frenados, maniobras de carga/descarga y movimientos durante el trayecto. El riesgo es considerablemente mayor en artículos frágiles como vidrio, cristal, cerámica, porcelana, mármol, equipos electrónicos y objetos de alto valor sentimental o económico.</p>

    <p class="terms-title">3. Responsabilidad de la Empresa de Mudanzas</p>
    <p>La empresa de mudanzas es responsable de los bienes únicamente durante las operaciones de carga, traslado y descarga que se lleven a cabo en la fecha pactada. No será responsable de pérdidas o daños ocasionados por fuerza mayor, caso fortuito, o hechos ajenos a su control. Quedan expresamente excluidos: daños internos en aparatos electrónicos (no visibles al exterior), contenido de cajas empacadas por el propio cliente, reclamos realizados con posterioridad a la firma de la conformidad de entrega.</p>

    <p class="terms-title">4. Responsabilidad del Cliente</p>
    <p>Es responsabilidad del cliente: (a) revisar previamente el tipo de accesos, elevadores y maniobras posibles tanto en origen como en destino; (b) en servicios de modalidad compartida (grupaje), designar una persona de confianza en destino para recibir la carga, verificar el estado de los artículos y firmar de conformidad; (c) comunicar de antemano artículos de valor especial que requieran manejo distinto.</p>

    <p class="terms-title">5. Condiciones de Pago</p>
    <p>Todos los servicios deberán estar pagados en su totalidad antes de la descarga en destino. Los pagos pactados son: apartado (reserva no reembolsable), anticipo el día de recolección, y saldo a la llegada a destino. Si el cliente requiere factura, deberá proporcionar sus datos fiscales al proveedor y solicitarla directamente.</p>

    <p class="terms-title">6. Garantía y Reclamaciones</p>
    <p><strong>6.1.</strong> El cliente tiene la obligación de verificar el estado de sus pertenencias al momento de la entrega en destino. No se aceptarán reclamos posteriores una vez firmada la conformidad de entrega.</p>
    <p style="margin-top:3px"><strong>6.2.</strong> En caso de daño comprobado derivado de mal manejo por parte del proveedor (con evidencia fotográfica previa y posterior al traslado), la empresa responde hasta el 10% del monto total del flete como indemnización máxima, salvo que exista contrato de seguro vigente que cubra un monto mayor.</p>

    <p class="terms-title">7. Seguro de Carga</p>
    <p>Las empresas de mudanzas no están legalmente obligadas a proporcionar seguro de carga. <strong>Sin seguro:</strong> el servicio corre por cuenta y riesgo exclusivo del cliente, sin responsabilidad de indemnización por pérdida o daño más allá del límite indicado en la cláusula 6.2. <strong>Con seguro:</strong> la atención al siniestro e indemnizaciones correspondientes se gestionan directamente con la aseguradora contratada según los términos de su póliza. La tarifa del seguro es del 1.5% sobre el valor declarado por el cliente.</p>

  </div>

  <div class="footer">
    {{ $provider->nombre }} &nbsp;|&nbsp; RFC: {{ $provider->rfc }} &nbsp;|&nbsp; Tel. {{ $provider->telefono }} &nbsp;|&nbsp; Página 3
  </div>

  {{-- ═══════════════════════════════════════════════════
       PAGE 4 — TERMS & CONDITIONS (sections 8–12)
  ═══════════════════════════════════════════════════ --}}
  <div class="page-break"></div>

  <div class="header" style="margin-bottom:10px">
    <table style="width:100%" cellpadding="0" cellspacing="0">
      <tr>
        <td><div class="provider-name">{{ $provider->nombre }}</div></td>
        <td style="text-align:right">
          <div style="font-size:12pt; font-weight:bold; color:#1e3a5f">Términos y Condiciones (cont.)</div>
          <div style="font-size:8pt; color:#555">Cotización: {{ $lead->lead_id }}</div>
        </td>
      </tr>
    </table>
  </div>

  <div style="font-size:7.5pt; color:#333; line-height:1.5">

    <p class="terms-title">8. Empaque y Cajas</p>
    <p>Las cajas de cartón tienen un peso máximo recomendado de 20 kg y deben usarse únicamente para objetos ligeros y no frágiles. Artículos delicados o frágiles requieren embalaje especializado (rejas de madera, contenedores rígidos, bolsas de aire). El proveedor no se hace responsable por daños en artículos que el cliente haya empacado deficientemente o en cajas no aptas para mudanza.</p>

    <p class="terms-title">9. Cancelaciones y Penalizaciones</p>
    <p>El apartado de servicio es <strong>no reembolsable</strong> bajo ninguna circunstancia. En caso de cancelación por parte del cliente:</p>
    <p style="margin-top:3px; padding-left:12px">— Con más de 72 hrs de anticipación: penalización del 30% del monto total cotizado.</p>
    <p style="margin-top:2px; padding-left:12px">— Entre 24 y 72 hrs antes del servicio: penalización del 50% del monto total cotizado.</p>
    <p style="margin-top:2px; padding-left:12px">— Menos de 24 hrs o el mismo día: penalización del 70% del monto total cotizado.</p>
    <p style="margin-top:3px">Las penalizaciones se aplican sobre los anticipos ya pagados. Si los anticipos recibidos no cubren la penalización, el cliente deberá cubrir la diferencia. La penalización por cancelación es independiente del apartado, el cual no se devuelve en ningún caso.</p>

    <p class="terms-title">10. Artículos Prohibidos</p>
    <p>Está estrictamente prohibido incluir en la carga los siguientes artículos: drogas o narcóticos, armas de fuego o municiones, materiales explosivos o inflamables, joyas y metales preciosos, dinero en efectivo, títulos o bonos, animales vivos o muertos, plantas sujetas a regulación fitosanitaria, y personas. Si el cliente incluyera cualquiera de estos artículos sin informarlo, será el único responsable de todas las consecuencias legales, económicas y de seguridad que deriven de ello.</p>

    <p class="terms-title">11. Privacidad y Protección de Datos</p>
    <p>Los datos personales del cliente (nombre, teléfono, correo electrónico, domicilio) son tratados de forma confidencial y utilizados exclusivamente para la gestión y ejecución del servicio contratado. No se compartirán con terceros ajenos al servicio sin consentimiento expreso del titular, salvo por obligación legal.</p>

    <p class="terms-title">12. Acuerdo Total</p>
    <p>Este documento constituye el acuerdo total entre el cliente, el proveedor y Red de Mudanzas Confiables respecto al servicio descrito. Cualquier modificación o acuerdo adicional deberá constar por escrito y ser firmado por las partes. La firma de este documento implica la aceptación plena de todos los términos y condiciones aquí establecidos.</p>

  </div>

  {{-- Final signatures on T&C page --}}
  <table class="sig-table" cellpadding="0" cellspacing="0" style="margin-top:20px">
    <tr>
      <td style="width:50%; text-align:center; padding:0 12px">
        <div class="sig-line"></div>
        <div class="sig-label">{{ $provider->responsable }}<br><span style="color:#888">Responsable del Servicio — {{ $provider->nombre }}</span></div>
      </td>
      <td style="width:50%; text-align:center; padding:0 12px">
        <div class="sig-line"></div>
        <div class="sig-label">{{ $lead->nombre_cliente }}<br><span style="color:#888">Cliente — Acepto los Términos y Condiciones</span></div>
      </td>
    </tr>
  </table>

  <div class="footer">
    {{ $provider->nombre }} &nbsp;|&nbsp; RFC: {{ $provider->rfc }} &nbsp;|&nbsp; {{ $provider->domicilio }} &nbsp;|&nbsp; Tel. {{ $provider->telefono }}<br>
    Documento generado el {{ now()->format('d/m/Y H:i') }} &nbsp;|&nbsp; Página 4
  </div>

</div>
</body>
</html>
