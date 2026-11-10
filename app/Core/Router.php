<?php
namespace App\Core;

class Router
{
    private array $routes = [];
    private array $params = [];

    public function add(string $route, array $params = []): void
    {
        // Quote each literal segment so dots in sitemap.xml and robots.txt
        // cannot become wildcard regex tokens. Placeholders are the only
        // dynamic segments.
        $segments = explode('/', trim($route, '/'));
        $segments = array_map(static function (string $segment): string {
            if (preg_match('/^\{(\w+)\}$/', $segment, $match)) {
                return '(?P<' . $match[1] . '>[^\/]+)';
            }
            return preg_quote($segment, '/');
        }, $segments);
        $route = implode('\/', $segments);
        $regex = '/^' . $route . '$/i';
        $this->routes[$regex] = $params;
    }

    public function dispatch(string $url): void
    {
        if ($this->match($url)) {
            $controllerName = $this->params['controller'];
            $controllerClass = 'App\\Controllers\\' . $this->studly($controllerName) . 'Controller';

            if (class_exists($controllerClass)) {
                $controller = new $controllerClass($this->params);
                $action = $this->camel($this->params['action'] ?? 'index');
                if (is_callable([$controller, $action])) {
                    $controller->$action();
                    return;
                }
            }
        }

        http_response_code(404);
        $view = new View();
        $view->render('errors/404', [
            'title' => 'Page Not Found - FileGenie',
            'meta_description' => 'The page or tool you requested could not be found on FileGenie.',
        ]);
    }

    private function match(string $url): bool
    {
        foreach ($this->routes as $regex => $params) {
            if (preg_match($regex, $url, $matches)) {
                foreach ($matches as $key => $value) {
                    if (is_string($key)) {
                        $params[$key] = $value;
                    }
                }
                $this->params = $params;
                return true;
            }
        }
        return false;
    }

    private function studly(string $value): string
    {
        return str_replace(' ', '', ucwords(str_replace(['-', '_'], ' ', $value)));
    }

    private function camel(string $value): string
    {
        return lcfirst($this->studly($value));
    }
}
