<?php

namespace App\Http\Requests\ProfileComment;

use Illuminate\Foundation\Http\FormRequest;

class StoreProfileCommentRequest extends FormRequest
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
            'content' => ['required', 'string', 'max:1000'],
            'parent_comment_id' => ['nullable', 'integer', 'exists:profile_comments,id'],
        ];
    }
}
