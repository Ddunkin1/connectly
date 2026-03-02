<?php

namespace App\Http\Requests\GroupMessage;

use App\Models\GroupMessage;
use Illuminate\Foundation\Http\FormRequest;

class UpdateGroupMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'content' => ['nullable', 'string', 'max:5000'],
            'media' => ['nullable', 'file', 'mimes:jpeg,jpg,png,gif,webp,mp4,webm,mov,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,zip', 'max:51200'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $content = $this->input('content');
            $hasText = is_string($content) && trim($content) !== '';
            $hasMedia = $this->hasFile('media');
            /** @var GroupMessage|null $messageModel */
            $messageModel = $this->route('groupMessage');
            $hasExistingAttachment = !empty($messageModel?->attachment_url);

            if (! $hasText && ! $hasMedia && ! $hasExistingAttachment) {
                $validator->errors()->add('content', 'Message or media is required.');
            }
        });
    }
}
