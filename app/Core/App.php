<?php
namespace App\Core;

class App
{
    private Router $router;

    public function __construct()
    {
        $this->router = new Router();
        $this->registerRoutes();
    }

    private function registerRoutes(): void
    {
        // Static pages.
        $this->router->add('', ['controller' => 'Home', 'action' => 'index']);
        $this->router->add('all-tools', ['controller' => 'Tool', 'action' => 'index']);
        $this->router->add('about', ['controller' => 'Page', 'action' => 'about']);
        $this->router->add('privacy', ['controller' => 'Page', 'action' => 'privacy']);
        $this->router->add('terms', ['controller' => 'Page', 'action' => 'terms']);
        $this->router->add('contact', ['controller' => 'Contact', 'action' => 'show']);
        $this->router->add('contact/send', ['controller' => 'Contact', 'action' => 'send']);
        $this->router->add('sitemap.xml', ['controller' => 'Sitemap', 'action' => 'index']);
        $this->router->add('robots.txt', ['controller' => 'Sitemap', 'action' => 'robots']);
        $this->router->add('api/search', ['controller' => 'Search', 'action' => 'query']);
        $this->router->add('api/ip', ['controller' => 'Api', 'action' => 'ip']);

        // Category index pages.
        $categories = ['pdf-tools', 'image-tools', 'video-tools', 'audio-tools', 'text-tools', 'utility-tools'];
        foreach ($categories as $cat) {
            $this->router->add($cat, ['controller' => 'Category', 'action' => 'show', 'category' => $cat]);
        }

        // Tool detail pages (category-scoped).
        foreach ($categories as $cat) {
            $this->router->add($cat . '/{tool}', ['controller' => 'Tool', 'action' => 'show', 'category' => $cat]);
        }
    }

    public function run(): void
    {
        \App\Support\Security::setSecurityHeaders();

        $url = $_SERVER['REQUEST_URI'] ?? '/';
        $url = parse_url($url, PHP_URL_PATH) ?: '/';
        $url = trim($url, '/');

        $this->router->dispatch($url);
    }
}
