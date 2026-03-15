<?php

namespace App\Http\Requests\ProfileComment;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'content' => ['required', 'string', 'max:1000'],
        ];
    }
}
