<?php

namespace App\Http\Requests\Message;

use App\Models\Message;
use Illuminate\Foundation\Http\FormRequest;

class UpdateMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'message' => ['nullable', 'string', 'max:5000'],
            'media' => ['nullable', 'file', 'mimes:jpeg,jpg,png,gif,webp,mp4,webm,mov', 'max:51200'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $message = $this->input('message');
            $hasText = is_string($message) && trim($message) !== '';
            $hasMedia = $this->hasFile('media');
            /** @var Message|null $messageModel */
            $messageModel = $this->route('message');
            $hasExistingAttachment = !empty($messageModel?->attachment_url);

            if (! $hasText && ! $hasMedia && ! $hasExistingAttachment) {
                $validator->errors()->add('message', 'Message or media is required.');
            }
        });
    }
}
