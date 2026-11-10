<?php
namespace App\Core;

class View
{
    public function render(string $view, array $data = [], string $layout = 'main'): void
    {
        $viewFile = BASE_PATH . '/app/Views/' . $view . '.php';
        $layoutFile = BASE_PATH . '/app/Views/layouts/' . $layout . '.php';

        if (!is_file($viewFile)) {
            throw new \RuntimeException("View not found: {$view}");
        }

        extract($data, EXTR_SKIP);

        ob_start();
        require $viewFile;
        $content = ob_get_clean();

        if ($layout !== '' && is_file($layoutFile)) {
            // Expose commonly used data to the layout.
            $GLOBALS['fg_view_content'] = $content;
            if (isset($data['title'])) {
                $GLOBALS['fg_view_title'] = $data['title'];
            }
            if (isset($data['meta_description'])) {
                $GLOBALS['fg_view_description'] = $data['meta_description'];
            }
            if (isset($data['canonical'])) {
                $GLOBALS['fg_view_canonical'] = $data['canonical'];
            }
            if (isset($data['schema'])) {
                $GLOBALS['fg_view_schema'] = $data['schema'];
            }
            if (isset($data['body_class'])) {
                $GLOBALS['fg_body_class'] = $data['body_class'];
            }
            require $layoutFile;
        } else {
            echo $content;
        }
    }
}
