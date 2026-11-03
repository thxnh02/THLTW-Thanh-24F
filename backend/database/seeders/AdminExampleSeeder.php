<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminExampleSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('local', 'testing')) {
            throw new \RuntimeException('Example admin accounts may only be created in local or testing environments.');
        }

        $email = trim((string) config('admin_example.email'));
        $password = (string) config('admin_example.password');
        if (! filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 12) {
            throw new \RuntimeException('Set ADMIN_EXAMPLE_EMAIL and a 12+ character ADMIN_EXAMPLE_PASSWORD in the local backend/.env file.');
        }

        DB::transaction(function () use ($email, $password): void {
            $existing = User::query()->where('email', $email)->lockForUpdate()->first();
            if ($existing !== null) {
                if (! $existing->is_admin) {
                    throw new \RuntimeException('The example admin email already belongs to a customer. Choose a different email.');
                }

                return;
            }

            $user = User::query()->create([
                'name' => 'Quản trị mẫu',
                'email' => $email,
                'password' => Hash::make($password),
            ]);
            $user->forceFill(['email_verified_at' => now(), 'is_admin' => true])->save();
        });
    }
}
