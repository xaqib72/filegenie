<?php
namespace App\Controllers;

use App\Registry\ToolRegistry;

class SearchController extends \App\Core\Controller
{
    public function query(): void
    {
        $q = trim($_GET['q'] ?? '');
        if ($q === '') {
            $this->json(['query' => '', 'results' => []]);
        }

        $results = ToolRegistry::search($q);
        $out = [];
        foreach ($results as $tool) {
            $out[] = [
                'id' => $tool['id'],
                'name' => $tool['name'],
                'slug' => $tool['slug'],
                'category' => $tool['category'],
                'short_description' => $tool['short_description'],
                'url' => '/' . $tool['category'] . '/' . $tool['slug'],
            ];
        }

        $this->json(['query' => $q, 'count' => count($out), 'results' => $out]);
    }
}
