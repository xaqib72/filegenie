<?php
namespace App\Controllers;

use App\Registry\CategoryRegistry;
use App\Registry\ToolRegistry;
use App\Support\SEO;

class CategoryController extends \App\Core\Controller
{
    public function show(): void
    {
        $categoryId = $this->routeParams['category'] ?? '';
        $category = CategoryRegistry::get($categoryId);

        if (!$category) {
            http_response_code(404);
            $this->render('errors/404', [
                'title' => 'Category Not Found — FileGenie',
                'meta_description' => 'The requested category could not be found.',
            ]);
            return;
        }

        $tools = ToolRegistry::byCategory($categoryId);

        $categoryTitles = [
            'pdf-tools' => 'Free PDF Tools Online – Merge, Split, Compress & More | FileGenie',
            'image-tools' => 'Free Image Tools Online – Compress, Resize, Convert & Edit | FileGenie',
            'video-tools' => 'Free Video Tools Online – Compress, Trim & Convert | FileGenie',
            'audio-tools' => 'Free Audio Tools Online – Trim, Merge, Convert & Compress | FileGenie',
            'text-tools' => 'Free Text & Font Tools Online | FileGenie',
            'utility-tools' => 'Free Online Utility Tools – QR, Barcode, Password & More | FileGenie',
        ];
        $meta = SEO::generateMeta([
            'title' => $categoryTitles[$categoryId] ?? ($category['name'] . ' — Free Online Tools | FileGenie'),
            'meta_description' => $category['short_description'],
            'breadcrumbs' => [
                ['name' => 'Home', 'url' => rtrim(SEO::baseUrl(), '/')],
                ['name' => $category['name'], 'url' => SEO::canonical()],
            ],
        ]);

        $this->render('category/show', [
            'title' => $meta['title'],
            'meta_description' => $meta['description'],
            'canonical' => $meta['canonical'],
            'schema' => $meta['schema'],
            'category' => $category,
            'tools' => $tools,
            'categories' => CategoryRegistry::getAll(),
            'body_class' => 'page-category category-' . $categoryId,
        ]);
    }
}
