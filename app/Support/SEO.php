<?php
namespace App\Support;

class SEO
{
    public static function baseUrl(): string
    {
        $config = $GLOBALS['fg_config'] ?? [];
        if (!empty($config['base_url'])) {
            return rtrim($config['base_url'], '/');
        }
        $scheme = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'filegenie.tech';
        return $scheme . '://' . $host;
    }

    public static function currentPath(): string
    {
        $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
        return '/' . trim($path, '/');
    }

    public static function canonical(): string
    {
        return self::baseUrl() . self::currentPath();
    }

    public static function generateMeta(array $data): array
    {
        $title = $data['title'] ?? (($GLOBALS['fg_config']['default_title'] ?? 'FileGenie'));
        $description = $data['meta_description'] ?? ($GLOBALS['fg_config']['default_description'] ?? '');
        $canonical = self::canonical();

        return [
            'title'         => $title,
            'description'   => $description,
            'canonical'     => $canonical,
            'og_title'      => $data['og_title'] ?? $title,
            'og_description'=> $data['og_description'] ?? $description,
            'og_url'        => $canonical,
            'og_type'       => $data['og_type'] ?? 'website',
            'schema'        => self::generateStructuredData($data, $canonical),
        ];
    }

    private static function generateStructuredData(array $data, string $url): array
    {
        $org = self::baseUrl();
        $schemas = [
            [
                '@context' => 'https://schema.org',
                '@type'    => 'Organization',
                'name'     => 'FileGenie',
                'url'      => $org,
                'logo'     => $org . '/assets/img/logo.svg',
                'sameAs'   => [],
            ],
            [
                '@context' => 'https://schema.org',
                '@type'    => 'WebSite',
                'name'     => 'FileGenie',
                'url'      => $org,
                'potentialAction' => [
                    '@type'       => 'SearchAction',
                    'target'      => $org . '/api/search?q={search_term_string}',
                    'query-input' => 'required name=search_term_string',
                ],
            ],
        ];

        if (isset($data['tool'])) {
            $tool = $data['tool'];
            $schemas[] = [
                '@context'           => 'https://schema.org',
                '@type'              => 'WebApplication',
                'name'               => $tool['name'],
                'url'                => $url,
                'applicationCategory' => 'UtilityApplication',
                'operatingSystem'    => 'All',
                'description'        => $tool['short_description'] ?? '',
                'offers'             => ['@type' => 'Offer', 'price' => '0', 'priceCurrency' => 'USD'],
            ];

            if (!empty($tool['faq'])) {
                $schemas[] = [
                    '@context' => 'https://schema.org',
                    '@type'    => 'FAQPage',
                    'mainEntity' => array_map(function ($f) {
                        return [
                            '@type' => 'Question',
                            'name'  => $f['q'],
                            'acceptedAnswer' => [
                                '@type' => 'Answer',
                                'text'  => $f['a'],
                            ],
                        ];
                    }, $tool['faq']),
                ];
            }
        }

        if (isset($data['breadcrumbs']) && is_array($data['breadcrumbs'])) {
            $schemas[] = [
                '@context'  => 'https://schema.org',
                '@type'     => 'BreadcrumbList',
                'itemListElement' => array_values(array_map(function ($crumb, $index) use ($url) {
                    return [
                        '@type'    => 'ListItem',
                        'position'  => $index + 1,
                        'name'     => $crumb['name'],
                        'item'     => $crumb['url'],
                    ];
                }, $data['breadcrumbs'], array_keys($data['breadcrumbs']))),
            ];
        }

        return $schemas;
    }
}
