<?php
namespace App\Controllers;

use App\Registry\CategoryRegistry;
use App\Registry\ToolRegistry;
use App\Support\SEO;

class ToolController extends \App\Core\Controller
{
    public function index(): void
    {
        $meta = SEO::generateMeta([
            'title' => '60 Free Online File Tools – PDF, Image, Video & More | FileGenie',
            'meta_description' => 'Browse all ' . ToolRegistry::count() . ' free client-side tools for PDFs, images, video, audio, text, and utilities. No uploads, runs in your browser.',
        ]);

        $this->render('tools/index', [
            'title' => $meta['title'],
            'meta_description' => $meta['description'],
            'canonical' => $meta['canonical'],
            'schema' => $meta['schema'],
            'categories' => CategoryRegistry::getAll(),
            'allTools' => ToolRegistry::getAll(),
            'body_class' => 'page-all-tools',
        ]);
    }

    public function show(): void
    {
        $category = $this->routeParams['category'] ?? '';
        $slug = $this->routeParams['tool'] ?? '';

        $tool = ToolRegistry::get($slug);
        $categoryData = CategoryRegistry::get($category);

        if (!$tool || !$categoryData || $tool['category'] !== $category) {
            http_response_code(404);
            $this->render('errors/404', [
                'title' => 'Tool Not Found — FileGenie',
                'meta_description' => 'The requested tool could not be found.',
            ]);
            return;
        }

        // Related tools (resolved to full records).
        $all = ToolRegistry::getAll();
        $related = [];
        foreach (($tool['related_tools'] ?? []) as $relSlug) {
            if (isset($all[$relSlug])) {
                $related[] = $all[$relSlug];
            }
        }

        $canonicalUrl = SEO::baseUrl() . '/' . $categoryData['slug'] . '/' . $tool['slug'];
        $meta = SEO::generateMeta([
            'title' => $tool['seo_title'],
            'meta_description' => $tool['meta_description'],
            'tool' => $tool,
            'breadcrumbs' => [
                ['name' => 'Home', 'url' => rtrim(SEO::baseUrl(), '/')],
                ['name' => $categoryData['name'], 'url' => SEO::baseUrl() . '/' . $categoryData['slug']],
                ['name' => $tool['name'], 'url' => $canonicalUrl],
            ],
        ]);

        $this->render('tool/show', [
            'title' => $meta['title'],
            'meta_description' => $meta['description'],
            'canonical' => $meta['canonical'],
            'schema' => $meta['schema'],
            'tool' => $tool,
            'category' => $categoryData,
            'relatedTools' => $related,
            'categories' => CategoryRegistry::getAll(),
            'body_class' => 'page-tool tool-' . $tool['id'],
        ]);
    }
}
