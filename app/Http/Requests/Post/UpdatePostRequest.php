<?php

namespace App\Http\Requests\Post;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePostRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->id === $this->route('post')->user_id;
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('content')) {
            $this->merge(['content' => strip_tags($this->input('content'))]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'content' => ['sometimes', 'required', 'string', 'max:5000'],
            'media_url' => ['nullable', 'url', 'max:500'],
            'media_type' => ['nullable', 'in:image,video'],
            'visibility' => ['sometimes', 'in:public,followers,private'],
            'is_archived' => ['sometimes', 'boolean'],
        ];
    }
}
