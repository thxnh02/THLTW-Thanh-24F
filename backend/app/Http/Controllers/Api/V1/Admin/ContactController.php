<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Models\Contact;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    use ApiResponses;

    public function index(Request $request): JsonResponse
    {
        $query = Contact::query()->latest('id');

        if ($request->filled('q')) {
            $needle = $request->string('q')->trim()->toString();
            $query->where(function ($contactQuery) use ($needle): void {
                $contactQuery
                    ->where('name', 'like', '%'.$needle.'%')
                    ->orWhere('email', 'like', '%'.$needle.'%')
                    ->orWhere('subject', 'like', '%'.$needle.'%');
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return $this->success($query->paginate((int) $request->integer('per_page', 15)));
    }

    public function store(Request $request): JsonResponse
    {
        abort(404);
    }

    public function show(Contact $contact): JsonResponse
    {
        return $this->success($contact);
    }

    public function update(Request $request, Contact $contact): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:new,processing,resolved'],
            'admin_note' => ['nullable', 'string', 'max:3000'],
        ]);
        $contact->update($validated);

        return $this->success($contact->refresh(), 'Da cap nhat lien he.');
    }

    public function destroy(Contact $contact): JsonResponse
    {
        $contact->delete();

        return $this->success(null, 'Da xoa lien he.');
    }
}
