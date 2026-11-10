<?php
namespace App\Controllers;

use App\Support\SEO;

class PageController extends \App\Core\Controller
{
    public function about(): void
    {
        $meta = SEO::generateMeta([
            'title' => 'About FileGenie — 100% Client-Side File Tools',
            'meta_description' => 'FileGenie runs every tool inside your browser. Learn how we keep your files private and why we built a no-upload platform.',
        ]);
        $this->render('pages/about', [
            'title' => $meta['title'],
            'meta_description' => $meta['description'],
            'canonical' => $meta['canonical'],
            'schema' => $meta['schema'],
            'body_class' => 'page-about',
        ]);
    }

    public function privacy(): void
    {
        $meta = SEO::generateMeta([
            'title' => 'Privacy Policy — FileGenie',
            'meta_description' => 'How FileGenie protects your privacy. All processing is client-side; your files are never uploaded.',
        ]);
        $this->render('pages/privacy', [
            'title' => $meta['title'],
            'meta_description' => $meta['description'],
            'canonical' => $meta['canonical'],
            'schema' => $meta['schema'],
            'body_class' => 'page-privacy',
            'contact_email' => $this->config('contact_email', 'hello@filegenie.com'),
        ]);
    }

    public function terms(): void
    {
        $meta = SEO::generateMeta([
            'title' => 'Terms of Service — FileGenie',
            'meta_description' => 'The terms governing use of the free FileGenie client-side tools.',
        ]);
        $this->render('pages/terms', [
            'title' => $meta['title'],
            'meta_description' => $meta['description'],
            'canonical' => $meta['canonical'],
            'schema' => $meta['schema'],
            'body_class' => 'page-terms',
        ]);
    }
}
