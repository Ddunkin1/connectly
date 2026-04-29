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
            'receiver_id' => ['required', 'exists:users,id'],
            'message' => ['required_without_all:media,post_id', 'nullable', 'string', 'max:5000'],
            'media' => ['nullable', 'file', 'mimes:jpeg,jpg,png,gif,webp,mp4,webm,mov,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,zip', 'max:51200'], // 50MB
            'post_id' => ['nullable', 'integer', 'exists:posts,id'],
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
            'message.required' => 'Message content is required.',
            'message.max' => 'Message cannot exceed 5000 characters.',
        ];
    }
}
