<?php

namespace App\Http\Requests\Message;

use Illuminate\Foundation\Http\FormRequest;

class StoreMessageRequest extends FormRequest
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
            'receiver_id' => ['required', 'exists:users,id', 'different:' . $this->user()->id],
            'message' => ['required_without:media', 'nullable', 'string', 'max:5000'],
            'media' => ['nullable', 'file', 'mimes:jpeg,jpg,png,gif,webp,mp4,webm,mov', 'max:51200'], // 50MB
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'receiver_id.required' => 'Receiver is required.',
            'receiver_id.exists' => 'Receiver user not found.',
            'receiver_id.different' => 'You cannot send a message to yourself.',
            'message.required' => 'Message content is required.',
            'message.max' => 'Message cannot exceed 5000 characters.',
        ];
    }
}
