<?php

namespace App\Http\Requests\Post;

use Illuminate\Foundation\Http\FormRequest;

class StorePostRequest extends FormRequest
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
            'content' => ['nullable', 'string', 'max:5000'],
            'media' => [
                'nullable',
                'file',
                'max:51200',
                function ($attribute, $value, $fail) {
                    if (!$value instanceof \Illuminate\Http\UploadedFile) {
                        return;
                    }
                    $mime = $value->getMimeType();
                    $validImage = str_starts_with($mime ?? '', 'image/');
                    $validVideo = str_starts_with($mime ?? '', 'video/');
                    if (!$validImage && !$validVideo) {
                        $fail('File must be an image (JPEG, PNG, GIF, WebP) or video (MP4, MOV, AVI, WebM).');
                    }
                },
            ],
            'visibility' => ['nullable', 'in:public,followers'],
            'shared_post_id' => ['nullable', 'integer', 'exists:posts,id'],
        ];
    }

    /**
     * Configure the validator instance.
     *
     * @param  \Illuminate\Validation\Validator  $validator
     * @return void
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $content = $this->input('content');
            $hasMedia = $this->hasFile('media');
            $isShare = $this->filled('shared_post_id');

            // Either content, media, or shared_post_id must be present
            if (empty(trim($content ?? '')) && !$hasMedia && !$isShare) {
                $validator->errors()->add('content', 'Either content, media file, or shared post is required.');
            }
        });
    }
}
