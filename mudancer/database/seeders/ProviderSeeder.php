<?php

namespace Database\Seeders;

use App\Models\Provider;
use Illuminate\Database\Seeder;

class ProviderSeeder extends Seeder
{
    public function run(): void
    {
        $names = [
            'Moreno Moving', 'Intermoving', 'Gaestra Mudanzas', 'IS Moving', 'Gomez Transport',
            'Express Mudanzas MX', 'MudaTech Servicios', 'Fletes del Norte', 'Mudanzas Confianza',
            'Traslados Premium GDL', 'Mudanzas Rápidas', 'Flete Seguro CDMX', 'Carga y Mudanza',
            'Mudanzas Económicas', 'Traslados Express', 'Mudanza Total', 'Fletes García',
            'Mudanzas Pro', 'Transporte y Mudanza', 'Mudanzas del Centro',
        ];

        for ($i = 1; $i <= 20; $i++) {
            $email = "provider{$i}@mudancer.com";
            Provider::updateOrCreate(
                ['email' => $email],
                [
                    'nombre'      => $names[$i - 1],
                    'email'       => $email,
                    'telefono'    => '55 ' . str_pad((1000 + $i), 4, '0') . ' ' . str_pad((1000 + $i + 1), 4, '0'),
                    'rfc'         => 'RFC' . strtoupper(substr(md5($email), 0, 10)),
                    'domicilio'   => "Av. Ejemplo {$i}, Col. Centro, CDMX",
                    'responsable' => $names[$i - 1] . ' Admin',
                    'logo'        => null,
                    'reputacion'  => rand(3, 5),
                ]
            );
        }
    }
}
