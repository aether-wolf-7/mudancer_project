<?php

namespace Database\Seeders;

use App\Models\Lead;
use Illuminate\Database\Seeder;

class LeadSeeder extends Seeder
{
    /**
     * Create 5 sample leads.
     */
    public function run(): void
    {
        $leads = [
            [
                'lead_id'            => 'LEAD' . strtoupper(substr(uniqid(), -6)),
                'nombre_cliente'     => 'María García López',
                'email_cliente'      => 'maria.garcia@example.com',
                'telefono_cliente'   => '5512345678',
                'estado_origen'      => 'Ciudad de México',
                'localidad_origen'   => 'Benito Juárez',
                'colonia_origen'     => 'Del Valle',
                'estado_destino'     => 'Jalisco',
                'localidad_destino'  => 'Guadalajara',
                'colonia_destino'    => 'Providencia',
                'empaque'            => 'Requiero cajas y empacado profesional',
                'fecha_recoleccion'  => now()->addDays(14)->toDateString(),
                'tiempo_estimado'    => '1 día',
                'modalidad'          => 'Compartido',
                'inventario'         => '3 recámaras, sala, comedor',
                'articulos_delicados' => 'Piano',
                'observaciones'      => 'Acarreo origen: 20 m aprox.',
            ],
            [
                'lead_id'            => 'LEAD' . strtoupper(substr(uniqid(), -6)),
                'nombre_cliente'     => 'Roberto Sánchez Pérez',
                'email_cliente'      => 'roberto.sanchez@example.com',
                'telefono_cliente'   => '5587654321',
                'estado_origen'      => 'Estado de México',
                'localidad_origen'   => 'Naucalpan',
                'colonia_origen'     => 'Satélite',
                'estado_destino'     => 'Querétaro',
                'localidad_destino'  => 'Querétaro',
                'colonia_destino'    => 'Centro',
                'empaque'            => 'Solo protección básica',
                'fecha_recoleccion'  => now()->addDays(21)->toDateString(),
                'tiempo_estimado'    => '2 días',
                'modalidad'          => 'Dedicado',
                'inventario'         => 'Departamento 2 recámaras',
                'articulos_delicados' => null,
                'observaciones'      => null,
            ],
            [
                'lead_id'            => 'LEAD' . strtoupper(substr(uniqid(), -6)),
                'nombre_cliente'     => 'Ana Martínez Ruiz',
                'email_cliente'      => 'ana.martinez@example.com',
                'telefono_cliente'   => '5533456789',
                'estado_origen'      => 'Puebla',
                'localidad_origen'   => 'Puebla',
                'colonia_origen'     => 'Angelópolis',
                'estado_destino'     => 'Nuevo León',
                'localidad_destino'  => 'Monterrey',
                'colonia_destino'    => 'San Pedro',
                'empaque'            => 'Cajas y embalaje completo',
                'fecha_recoleccion'  => now()->addDays(7)->toDateString(),
                'tiempo_estimado'    => '1 día',
                'modalidad'          => 'Compartido Especial',
                'inventario'         => 'Casa 4 recámaras',
                'articulos_delicados' => 'Refrigerador dúplex, Mesa de billar',
                'observaciones'      => 'Fecha fija de carga.',
            ],
            [
                'lead_id'            => 'LEAD' . strtoupper(substr(uniqid(), -6)),
                'nombre_cliente'     => 'Carlos Hernández Vega',
                'email_cliente'      => 'carlos.hernandez@example.com',
                'telefono_cliente'   => '5544567890',
                'estado_origen'      => 'Jalisco',
                'localidad_origen'   => 'Zapopan',
                'colonia_origen'     => 'Puerta de Hierro',
                'estado_destino'     => 'Quintana Roo',
                'localidad_destino'  => 'Cancún',
                'colonia_destino'    => 'Zona Hotelera',
                'empaque'            => 'Empacado profesional',
                'fecha_recoleccion'  => now()->addDays(30)->toDateString(),
                'tiempo_estimado'    => '3 días',
                'modalidad'          => 'Dedicado',
                'inventario'         => 'Oficina y casa',
                'articulos_delicados' => 'Equipo de cómputo',
                'observaciones'      => null,
            ],
            [
                'lead_id'            => 'LEAD' . strtoupper(substr(uniqid(), -6)),
                'nombre_cliente'     => 'Laura Fernández Mora',
                'email_cliente'      => 'laura.fernandez@example.com',
                'telefono_cliente'   => '5555678901',
                'estado_origen'      => 'Guanajuato',
                'localidad_origen'   => 'León',
                'colonia_origen'     => 'Centro',
                'estado_destino'     => 'Yucatán',
                'localidad_destino'  => 'Mérida',
                'colonia_destino'    => 'Gran Plaza',
                'empaque'            => 'Básico incluido',
                'fecha_recoleccion'  => now()->addDays(10)->toDateString(),
                'tiempo_estimado'    => '2 días',
                'modalidad'          => 'Compartido',
                'inventario'         => '2 recámaras',
                'articulos_delicados' => null,
                'observaciones'      => 'Sin elevador en destino.',
            ],
        ];

        foreach ($leads as $data) {
            Lead::updateOrCreate(
                ['lead_id' => $data['lead_id']],
                array_merge($data, [
                    'piso_origen'       => null,
                    'elevador_origen'  => false,
                    'acarreo_origen'   => 30,
                    'piso_destino'      => null,
                    'elevador_destino' => false,
                    'acarreo_destino'   => 30,
                    'seguro'            => null,
                    'publicada'         => false,
                    'adjudicada'       => false,
                    'concluida'         => false,
                    'vista'             => false,
                ])
            );
        }
    }
}
