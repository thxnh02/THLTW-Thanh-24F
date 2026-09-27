<x-mail::message>
# Dat lai mat khau

Ma OTP cua ban la:

<x-mail::panel>
<div style="font-size: 28px; font-weight: 700; letter-spacing: 8px; text-align: center;">{{ $code }}</div>
</x-mail::panel>

Ma nay co hieu luc trong {{ $expiresInMinutes }} phut va chi duoc su dung mot lan.

Neu ban khong yeu cau dat lai mat khau, hay bo qua email nay.

Tran trong,<br>
{{ config('app.name') }}
</x-mail::message>
