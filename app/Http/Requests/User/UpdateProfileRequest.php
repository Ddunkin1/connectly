<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;

class UpdateProfileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'website' => $this->website ?: null,
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = $this->user()->id;

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'username' => ['sometimes', 'required', 'string', 'max:255', 'unique:users,username,' . $userId, 'regex:/^[a-zA-Z0-9_-]+$/'],
            'bio' => ['nullable', 'string', 'max:500'],
            'location' => ['nullable', 'string', 'max:255'],
            'website' => ['nullable', 'url', 'max:255'],
            'privacy_settings' => ['sometimes', 'in:public,private'],
            'profile_picture' => ['nullable', 'file', 'mimes:jpeg,jpg,png,webp', 'max:5120'], // 5MB max
            'profile_picture_caption' => ['nullable', 'string', 'max:500'],
            'profile_picture_visibility' => ['nullable', 'string', 'in:public,friends'],
            'cover_image' => ['nullable', 'file', 'mimes:jpeg,jpg,png,webp', 'max:5120'], // 5MB max
            'cover_image_caption' => ['nullable', 'string', 'max:500'],
            'cover_image_visibility' => ['nullable', 'string', 'in:public,friends'],
        ];
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'username.regex' => 'Username may only contain letters, numbers, underscores and hyphens.',
            'website.url' => 'Please enter a valid URL.',
            'profile_picture.max' => 'Profile picture must be under 5MB.',
            'cover_image.max' => 'Cover image must be under 5MB.',
        ];
    }
}
