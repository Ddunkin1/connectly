<?php

namespace App\Http\Requests\GroupMessage;

use Illuminate\Foundation\Http\FormRequest;

class StoreGroupMessageRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'group_conversation_id' => ['required', 'integer', 'exists:group_conversations,id'],
            'content' => ['required_without:media', 'nullable', 'string', 'max:5000'],
            'media' => ['nullable', 'file', 'mimes:jpeg,jpg,png,gif,webp,mp4,webm,mov', 'max:51200'],
        ];
    }
}
