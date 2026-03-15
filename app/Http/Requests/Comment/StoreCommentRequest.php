<?php

namespace App\Http\Requests\Comment;

use Illuminate\Foundation\Http\FormRequest;

class StoreCommentRequest extends FormRequest
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
            'content' => ['nullable', 'string', 'max:1000'],
            'parent_comment_id' => ['nullable', 'exists:comments,id'],
            'media' => ['nullable', 'file', 'mimes:jpeg,jpg,png,gif,webp,mp4,mov,webm', 'max:51200'], // 50MB for video
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if (!$this->filled('content') && !$this->hasFile('media')) {
                $validator->errors()->add('content', 'Comment must have text or a photo/video.');
            }
        });
    }
}
