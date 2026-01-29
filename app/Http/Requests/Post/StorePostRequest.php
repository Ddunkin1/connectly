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
            'media' => ['nullable', 'file', 'mimes:jpeg,jpg,png,gif,webp,mp4,mov,avi', 'max:10240'], // 10MB max
            'visibility' => ['nullable', 'in:public,followers'],
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
            
            // Either content or media must be present
            if (empty(trim($content ?? '')) && !$hasMedia) {
                $validator->errors()->add('content', 'Either content or media file is required.');
            }
        });
    }
}
