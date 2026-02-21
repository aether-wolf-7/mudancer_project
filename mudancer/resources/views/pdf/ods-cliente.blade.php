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
  .faq-title { font-size: 8.5pt; font-weight: bold; color: #1e3a5f; margin: 7px 0 2px; }
  .faq-text { font-size: 7.5pt; color: #444; line-height: 1.45; margin-bottom: 2px; }
  .footer { border-top: 1px solid #ccc; margin-top: 14px; padding-top: 5px; text-align: center; font-size: 7pt; color: #aaa; }
  .page-break { page-break-after: always; }
  td { vertical-align: top; }
</style>
</head>
<body>
<div class="page">

  {{-- ── PAGE 1: ORDER OF SERVICE ── --}}
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

  {{-- ── CLIENT + RESPONSIBLE ── --}}
  <table class="grid2" cellpadding="3" cellspacing="0">
    <tr>
      <td style="width:40%">
        <div class="field-label">Cliente</div>
        <div class="field-value">{{ $lead->nombre_cliente }}</div>
      </td>
      <td style="width:30%">
        <div class="field-label">Teléfono</div>
        <div class="field-value">{{ $lead->telefono_cliente }}</div>
      </td>
      <td style="width:30%">
        <div class="field-label">Responsable del Servicio</div>
        <div class="field-value">{{ $provider->responsable }}</div>
      </td>
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
        <div class="field-label">Horario de Recolección</div>
        <div class="field-value">Acordar cliente-operador</div>
      </td>
      <td>
        <div class="field-label">Modalidad del Servicio</div>
        <div class="field-value">{{ $lead->modalidad ?: '—' }}</div>
      </td>
    </tr>
    <tr>
      <td>
        <div class="field-label">Empaque</div>
        <div class="field-value">{{ $lead->empaque ?: '—' }}</div>
      </td>
      <td>
        <div class="field-label">Seguro (Valor Declarado)</div>
        <div class="field-value">{{ $lead->seguro ? '$' . number_format($lead->seguro, 2) : '—' }}</div>
      </td>
    </tr>
    @if($lead->observaciones)
    <tr>
      <td colspan="2">
        <div class="field-label">Observaciones</div>
        <div class="field-value" style="font-weight:normal">{{ $lead->observaciones }}</div>
      </td>
    </tr>
    @endif
  </table>

  {{-- ── PROVIDER CONTACT ── --}}
  <table class="grid2" cellpadding="3" cellspacing="0" style="margin-top:6px">
    <tr>
      <td style="width:50%">
        <div class="field-label">Teléfono del Proveedor</div>
        <div class="field-value">{{ $provider->telefono }}</div>
      </td>
    </tr>
  </table>

  <div class="notice">
    IMPORTANTE: Todos los servicios deben estar pagados en su totalidad antes de la descarga en destino.
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

  <div class="footer">
    {{ $provider->nombre }} &nbsp;|&nbsp; RFC: {{ $provider->rfc }} &nbsp;|&nbsp; {{ $provider->domicilio }} &nbsp;|&nbsp; Tel. {{ $provider->telefono }}
  </div>

  {{-- ════════════════════════════════════════════════════
       PAGE 2 — PREGUNTAS FRECUENTES (questions 1–15)
  ════════════════════════════════════════════════════ --}}
  <div class="page-break"></div>

  <div class="header" style="margin-bottom:10px">
    <table style="width:100%" cellpadding="0" cellspacing="0">
      <tr>
        <td><div class="provider-name">{{ $provider->nombre }}</div></td>
        <td style="text-align:right">
          <div class="doc-title" style="font-size:13pt">Preguntas Frecuentes</div>
          <div class="doc-id">Cotización: {{ $lead->lead_id }}</div>
        </td>
      </tr>
    </table>
  </div>

  <div style="font-size:7.5pt; color:#333; line-height:1.45">

    <p class="faq-title">1. ¿Qué incluyen los servicios de mudanza?</p>
    <p class="faq-text">El servicio básico incluye maniobras de carga, descarga y acarreo hasta 30 metros. También contempla protección básica con emplayado de muebles de tela (colchones, sillones, sillas, etc.) y piezas delicadas con colchonetas, además del traslado en la modalidad contratada (exclusivo, semi exclusivo o compartido).</p>

    <p class="faq-title">2. ¿Qué servicios no están incluidos?</p>
    <p class="faq-text">El servicio básico no incluye: Voladuras (sacar o entrar muebles por ventanas o balcones). Empaque de cajas, roperos o cristalería. Maniobras o desarmados especiales. Carga de muebles llenos. Acarreos mayores a 30 metros. Trabajos de electricidad, plomería, jardinería o albañilería. Permisos municipales o sindicales. Seguro de carga (se contrata aparte). Demoras, almacenajes, colgado de cuadros o decoraciones. En general, cualquier servicio no especificado en tu cotización.</p>

    <p class="faq-title">3. ¿Qué artículos no se pueden transportar?</p>
    <p class="faq-text">Está prohibido trasladar: drogas, narcóticos, armas, municiones, dinero en efectivo, joyas, bonos, animales o personas. Si el cliente incluye alguno de estos artículos, será el único responsable de las consecuencias legales y económicas.</p>

    <p class="faq-title">4. ¿Qué pasa si mis muebles no caben por escaleras o accesos?</p>
    <p class="faq-text">Se pueden requerir maniobras especiales (como voladuras). Si los accesos no permiten la entrada segura del camión (por calles angostas, árboles, cables bajos, inundaciones o restricciones de tránsito/sindicatos), será necesario contratar una unidad más pequeña, cuyo costo corre por cuenta del cliente, salvo que se haya previsto en la cotización.</p>

    <p class="faq-title">5. ¿Cómo funcionan los tiempos de entrega?</p>
    <p class="faq-text">En servicio compartido, las entregas pueden adelantarse o demorarse. Por eso, es obligatorio que el cliente designe a una persona en el destino para recibir la carga y firmar de conformidad. Esta firma tiene la misma validez que la del titular. En servicios exclusivos los viajes son directos, con descansos obligatorios para el personal; por lo general no se conduce de noche, y los retrasos se pueden atribuir a tráfico, carreteras cerradas, desvíos por accidentes o seguridad.</p>

    <p class="faq-title">6. ¿Cómo debo empacar mis pertenencias en cajas, maletas y bolsas?</p>
    <p class="faq-text">Las cajas de cartón solo deben usarse para objetos ligeros (máximo 20 kg). No se recomienda usarlas para pantallas, espejos, mármol o artículos frágiles. Para esos casos se deben usar rejas de madera o embalaje especial. Si no se contrata este servicio, los riesgos de daños corren por cuenta del cliente. Las cajas, maletas, bolsas y cualquier otro contenedor debe ir debidamente sellado, ya que no se aceptan reclamos de artículos perdidos empacados por el cliente.</p>

    <p class="faq-title">7. ¿Qué pasa si cancelo mi mudanza?</p>
    <p class="faq-text">El anticipo no se devuelve, ya que es un apartado del espacio en el camión. En caso de cancelación y ya haya pagado apartado y anticipo, se aplica una penalización de entre el 30% y 70% del costo del servicio.</p>

    <p class="faq-title">8. ¿El servicio incluye seguro de carga?</p>
    <p class="faq-text">No. El seguro de carga lo ofrecen aseguradoras externas y debe contratarse aparte y directamente por el cliente. Si se contrata a través del vendedor o la empresa de mudanzas y en caso de algún siniestro en carretera el reclamo del seguro será entre cliente y aseguradora. Si no se contrata seguro, el servicio corre bajo conocimiento de los riesgos inherentes de la mudanza.</p>

    <p class="faq-title">9. ¿En caso de robo total de mi mudanza me pagan mis cosas?</p>
    <p class="faq-text">En el caso de que el cliente contrate un seguro de carga, la aseguradora será la encargada de pagar la suma que determine después de realizar la investigación, peritajes y ajustes de acuerdo al monto del valor declarado por el cliente y póliza contratada. En caso de que el cliente no contrate un seguro de carga, el riesgo corre por cuenta del propio cliente, ya que la empresa de mudanzas únicamente presta un servicio de transporte y no puede garantizar seguridad absoluta frente a situaciones de fuerza mayor.</p>

    <p class="faq-title">10. ¿Qué responsabilidad tiene la empresa de mudanzas por daños durante las maniobras de carga y descarga?</p>
    <p class="faq-text">Hasta el 10% del valor del flete por daños ocasionados por mal manejo del personal. Tome en cuenta que en maniobras complicadas como volados, manipulación de cristales, lozas, pianos, muebles pesados y/o de volumen grande el riesgo es mayor y solo es manipulado bajo autorización y riesgo asumido por el cliente.</p>

    <p class="faq-title">11. ¿Qué pasa si algunos de mis muebles llegan raspados?</p>
    <p class="faq-text">Tras el proceso de embalaje, los muebles se protegen con colchonetas y se disponen en el vehículo de transporte en posiciones que permiten su sujeción, minimizando así el movimiento durante el viaje. No obstante, factores inherentes al transporte terrestre —como pavimento irregular, frenadas bruscas o condiciones viales adversas— pueden generar vibraciones y desplazamientos imprevistos. Esta dinámica incrementa la tensión ejercida por las cinchas y cuerdas de amarre sobre las piezas. En ciertos casos, dicha tensión puede provocar rozaduras o daños superficiales en los muebles. Estas eventualidades se consideran riesgos asociados a la naturaleza del servicio de mudanza, a pesar de las medidas de protección implementadas.</p>

    <p class="faq-title">12. ¿Qué pasa si se pierde alguna caja?</p>
    <p class="faq-text">Todas las cajas van contadas y dispuestas en una sección del camión destinada para su mudanza en servicios compartidos, por lo que sería extraordinario que se perdiera algo; sin embargo, previendo que por alguna situación alguna caja fuese entregada en algún otro punto, se agotarán los medios para retornarla, y de no ser posible le será compensado con $1,000.00 pesos por caja extraviada independientemente del contenido.</p>

    <p class="faq-title">13. ¿Por qué se advierte sobre riesgos en mis muebles?</p>
    <p class="faq-text">Todos los artículos transportados son considerados usados, por lo que pueden tener desgaste natural. Durante el traslado, el movimiento, vibraciones y frenadas pueden provocar daños inevitables en muebles delicados (vidrio, mármol, cerámica, madera, etc.). Estos riesgos son inherentes al servicio y no atribuibles a un mal trabajo.</p>

    <p class="faq-title">14. ¿Qué compromisos acepto al contratar el servicio?</p>
    <p class="faq-text">Al pagar el apartado, anticipo o el total, el cliente acepta los términos y condiciones del servicio y reconoce los riesgos naturales de una mudanza, liberando a la empresa de mudanzas y al operador de responsabilidades fuera de los alcances especificados.</p>

    <p class="faq-title">15. No me entregaron mi casa y no tengo donde recibir mis cosas, ¿Qué procede?</p>
    <p class="faq-text">En este caso si el camión llegó a destino, se debe cubrir el total del servicio y se contrata un nuevo servicio, el cual incluye el traslado a otro lugar propuesto por el cliente o bien a bodega de la empresa de mudanzas, donde se debe cubrir el costo de renta de espacio.</p>

  </div>

  <div class="footer">
    {{ $provider->nombre }} &nbsp;|&nbsp; RFC: {{ $provider->rfc }} &nbsp;|&nbsp; {{ $provider->domicilio }} &nbsp;|&nbsp; Tel. {{ $provider->telefono }}
  </div>

  {{-- ════════════════════════════════════════════════════
       PAGE 3 — PREGUNTAS FRECUENTES (questions 16–24)
  ════════════════════════════════════════════════════ --}}
  <div class="page-break"></div>

  <div class="header" style="margin-bottom:10px">
    <table style="width:100%" cellpadding="0" cellspacing="0">
      <tr>
        <td><div class="provider-name">{{ $provider->nombre }}</div></td>
        <td style="text-align:right">
          <div class="doc-title" style="font-size:13pt">Preguntas Frecuentes (cont.)</div>
          <div class="doc-id">Cotización: {{ $lead->lead_id }}</div>
        </td>
      </tr>
    </table>
  </div>

  <div style="font-size:7.5pt; color:#333; line-height:1.45">

    <p class="faq-title">16. ¿Qué es una mudanza compartida?</p>
    <p class="faq-text">La mudanza compartida (también llamada consolidada) es un servicio en el que varios clientes comparten el espacio de un mismo camión, permitiendo que cada uno pague solo por el espacio ocupado. Características: Precio más bajo comparado con una mudanza exclusiva. Las fechas de recolección y entrega son flexibles (no fijas). Ideal para traslados de bajo volumen o presupuestos ajustados. Puede haber más tiempo de tránsito, ya que el camión hace múltiples paradas para recolecciones y entregas. Puede haber cambio de unidad de transporte en recolección, entrega y tránsito de ciudad a ciudad.</p>

    <p class="faq-title">18. ¿Qué es una mudanza exclusiva?</p>
    <p class="faq-text">Es aquella en la que todo el camión está destinado a un solo cliente. No se comparte con otras mudanzas. Características: Mayor rapidez y eficiencia (viaje directo con respectivos descansos). El cliente elige fecha y horario de recolección y entrega. Mayor control y seguridad sobre los bienes. Ideal para familias completas, empresas o personas que necesitan mayor atención en la carga y entrega personalizada.</p>

    <p class="faq-title">19. ¿Qué riesgos se corre en una mudanza?</p>
    <p class="faq-text">Las mudanzas, como toda actividad logística, implican riesgos que deben ser conocidos. Principales riesgos: Daños físicos a los objetos durante la carga, transporte o descarga. Pérdida parcial o total de bienes (por robo, extravío o accidente). Retrasos por causas externas (clima, tráfico, fallas mecánicas). Errores humanos en el inventario, manipulación o entrega. En mudanzas compartidas: riesgo de confusión o mezcla de pertenencias. En caso de robo o siniestro, si no se contrató seguro, el cliente asume el riesgo económico total.</p>

    <p class="faq-title">20. ¿Qué responsabilidades tiene la empresa de mudanzas?</p>
    <p class="faq-text">La empresa de mudanzas tiene responsabilidades claras, pero limitadas, especialmente cuando el cliente no contrata un seguro. Obligaciones generales: En un servicio básico de una mudanza, la empresa debe proteger con colchonetas y playo los muebles para evitar ensuciarse y contacto directo con otros muebles durante el movimiento. Traslado desde el origen al destino de acuerdo a los términos y condiciones especificadas en la cotización del servicio. Límites de responsabilidad: En caso de daños o pérdida, la empresa responde solo si se demuestra negligencia directa. No garantiza protección ante actos delictivos externos (asalto, vandalismo) si no hay seguro contratado. Si se contrata un seguro, la aseguradora es responsable del pago, tras investigación y ajuste.</p>

    <p class="faq-title">21. ¿Cómo trasladan los vehículos?</p>
    <p class="faq-text">Los vehículos se trasladan en camiones con caja seca (cerrada). Las maniobras de carga y descarga se realizan con grúas de plataforma que son rentadas; el costo de las grúas puede haberse incluido en la cotización o puede pagarlas directamente el cliente. En ciertos casos se pueden usar rampas.</p>

    <p class="faq-title">22. ¿Cómo se trasladan las motocicletas?</p>
    <p class="faq-text">En las motocicletas grandes se aplica el mismo método que en los vehículos, y se puede usar plataforma de madera para el viaje. Las motos pequeñas se suben manualmente y se sujetan dentro del camión.</p>

    <p class="faq-title">23. ¿Puedo incluir plantas, macetas y mascotas?</p>
    <p class="faq-text">Puede incluir plantas en maceta con el conocimiento de que en el trayecto pueden morir por falta de ventilación, ya que la caja de mudanza es cerrada y el espacio es reducido. También pueden ser decomisadas si las autoridades lo consideran necesario. En caso de mascotas, está estrictamente prohibido trasladar cualquier tipo de animal.</p>

    <p class="faq-title">24. ¿Puedo dar seguimiento satelital GPS de mis pertenencias?</p>
    <p class="faq-text">En servicios de mudanza exclusiva se le puede proveer de una cuenta espejo para rastrear el camión de mudanza. En servicios compartidos se le recomienda que adquiera por su cuenta un dispositivo de rastreo y lo coloque en alguna de las cajas; son dispositivos que puede adquirir en Amazon o Mercado Libre a precios económicos.</p>

  </div>

  <div class="footer">
    {{ $provider->nombre }} &nbsp;|&nbsp; RFC: {{ $provider->rfc }} &nbsp;|&nbsp; {{ $provider->domicilio }} &nbsp;|&nbsp; Tel. {{ $provider->telefono }}<br>
    Documento generado el {{ now()->format('d/m/Y H:i') }}
  </div>

</div>
</body>
</html>
