<?php
namespace App\Controllers;

use App\Registry\CategoryRegistry;
use App\Registry\ToolRegistry;
use App\Support\SEO;

class HomeController extends \App\Core\Controller
{
    public function index(): void
    {
        $all = ToolRegistry::getAll();
        // Pick a balanced "popular" set across categories for the homepage grid.
        $popularSlugs = [
            'merge-pdf', 'compress-pdf', 'compress-image', 'remove-background',
            'compress-video', 'audio-converter', 'password-generator', 'qr-code-generator',
            'word-counter', 'case-converter',
        ];
        $popular = [];
        foreach ($popularSlugs as $s) {
            if (isset($all[$s])) {
                $popular[] = $all[$s];
            }
        }

        $meta = SEO::generateMeta([
            'title' => 'FileGenie – Free Online PDF, Image, Video & File Tools',
            'meta_description' => $this->config('default_description'),
        ]);

        $this->render('home/index', [
            'title' => $meta['title'],
            'meta_description' => $meta['description'],
            'canonical' => $meta['canonical'],
            'schema' => $meta['schema'],
            'categories' => CategoryRegistry::getAll(),
            'popularTools' => $popular,
            'allTools' => $all,
            'body_class' => 'page-home',
        ]);
    }
}
