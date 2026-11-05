<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Post extends Model
{
    use SoftDeletes;

    protected $fillable = ['title', 'slug', 'content', 'status', 'topic_id'];

    public function topic(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(PostTopic::class, 'topic_id');
    }

    protected function casts(): array
    {
        return ['status' => 'boolean'];
    }
}
