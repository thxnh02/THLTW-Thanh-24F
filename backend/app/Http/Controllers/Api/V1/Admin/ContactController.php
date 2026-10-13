<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateContactStatusRequest;
use App\Http\Resources\ContactResource;
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

        return $this->successPaginated($query->paginate((int) $request->integer('per_page', 15)), ContactResource::class);
    }

    public function store(Request $request): JsonResponse
    {
        abort(404);
    }

    public function show(Contact $contact): JsonResponse
    {
        return $this->success(new ContactResource($contact));
    }

    public function update(UpdateContactStatusRequest $request, Contact $contact): JsonResponse
    {
        $validated = $request->validated();
        $contact->update($validated);

        return $this->success(new ContactResource($contact->refresh()), 'Đã cập nhật liên hệ.');
    }

    public function destroy(Contact $contact): JsonResponse
    {
        $contact->delete();

        return $this->success(null, 'Đã xóa liên hệ.');
    }
}
