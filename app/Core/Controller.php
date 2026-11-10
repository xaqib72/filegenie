<?php
namespace App\Core;

abstract class Controller
{
    protected array $routeParams = [];

    public function __construct(array $routeParams = [])
    {
        $this->routeParams = $routeParams;
    }

    protected function render(string $view, array $data = [], string $layout = 'main'): void
    {
        (new View())->render($view, $data, $layout);
    }

    protected function json(array $data, int $status = 200): void
    {
        http_response_code($status);
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=utf-8');
        }
        echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    protected function config(string $key, $default = null)
    {
        return $GLOBALS['fg_config'][$key] ?? $default;
    }
}
