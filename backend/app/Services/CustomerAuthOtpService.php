<?php

namespace App\Services;

use App\Mail\CustomerAuthOtpMail;
use App\Models\CustomerEmailOtp;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class CustomerAuthOtpService
{
    public function issue(User $user, string $purpose): string
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $otpId = DB::transaction(function () use ($user, $purpose, $code): ?int {
            $lockedUser = User::query()->whereKey($user->id)->lockForUpdate()->first();
            if ($lockedUser === null || $lockedUser->blocked_at !== null) {
                return null;
            }

            $latest = CustomerEmailOtp::query()
                ->where('email', $lockedUser->email)
                ->where('purpose', $purpose)
                ->whereNull('consumed_at')
                ->orderByDesc('id')
                ->lockForUpdate()
                ->first();
            if ($latest?->last_sent_at?->gt(now()->subSeconds(60))) {
                return null;
            }

            CustomerEmailOtp::query()
                ->where('email', $lockedUser->email)
                ->where('purpose', $purpose)
                ->whereNull('consumed_at')
                ->update(['consumed_at' => now()]);

            return CustomerEmailOtp::query()->create([
                'user_id' => $lockedUser->id,
                'email' => $lockedUser->email,
                'purpose' => $purpose,
                'otp_hash' => Hash::make($code),
                'expires_at' => now()->addMinutes(5),
                'last_sent_at' => now(),
            ])->id;
        });

        if ($otpId === null) {
            return 'unavailable';
        }

        if (! app()->environment('testing') && in_array(config('mail.default'), ['log', 'array'], true)) {
            $this->markDeliveryFailed($otpId, $purpose);

            return 'failed';
        }

        try {
            Mail::to($user->email)->send(new CustomerAuthOtpMail($code, $purpose));
        } catch (Throwable) {
            $this->markDeliveryFailed($otpId, $purpose);

            return 'failed';
        }

        return 'sent';
    }

    private function markDeliveryFailed(int $otpId, string $purpose): void
    {
        CustomerEmailOtp::query()->whereKey($otpId)->update(['consumed_at' => now()]);
        Log::warning('Customer authentication email delivery failed.', ['purpose' => $purpose]);
    }
}
