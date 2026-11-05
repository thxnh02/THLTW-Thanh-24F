<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminContactController extends Controller
{
    public function index(Request $request)
    {
        $data = $request->validate(['status' => ['nullable', Rule::in(['new', 'processed', 'replied'])]]);
        return ContactMessage::query()->when(! empty($data['status']), fn ($q) => $q->where('status', $data['status']))->orderByDesc('id')->paginate(10)->withQueryString();
    }

    public function show(ContactMessage $contact)
    {
        return response()->json(['data' => $contact]);
    }

    public function update(Request $request, ContactMessage $contact)
    {
        $data = $request->validate(['status' => ['required', Rule::in(['new', 'processed'])]]);
        $contact->forceFill($data)->save();
        return response()->json(['data' => $contact]);
    }

    public function reply(Request $request, ContactMessage $contact)
    {
        $data = $request->validate(['reply' => ['required', 'string', 'min:1', 'max:5000']]);
        if (in_array(config('mail.default'), ['log', 'array'], true) && ! app()->environment('testing')) {
            throw ValidationException::withMessages(['reply' => 'Máy chủ chưa cấu hình gửi email.']);
        }
        Mail::raw($data['reply'], function ($message) use ($contact): void {
            $message->to($contact->email)->subject('Phản hồi liên hệ từ cửa hàng');
        });
        $contact->forceFill(['reply' => $data['reply'], 'replied_at' => now(), 'status' => 'replied'])->save();
        return response()->json(['data' => $contact]);
    }

    public function destroy(ContactMessage $contact)
    {
        $contact->delete();
        return response()->noContent();
    }
}
