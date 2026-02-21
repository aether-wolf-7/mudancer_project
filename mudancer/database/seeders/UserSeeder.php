<?php

namespace Database\Seeders;

use App\Models\Provider;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Create 20 provider users (run AFTER ProviderSeeder). Link providers to users by email.
     */
    public function run(): void
    {
        for ($i = 1; $i <= 20; $i++) {
            $email = "provider{$i}@mudancer.com";
            $phone = '555' . str_pad(1000000 + $i, 7, '0');
            User::updateOrCreate(
                ['email' => $email],
                [
                    'name'     => "Provider {$i} Admin",
                    'phone'    => $phone,
                    'password' => Hash::make('password'),
                    'role'     => 'provider',
                ]
            );
        }

        foreach (Provider::all() as $provider) {
            $user = User::where('email', $provider->email)->first();
            if ($user) {
                $provider->update(['user_id' => $user->id]);
            }
        }
    }
}
