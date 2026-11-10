<?php
// Extract tool data from ToolRegistry.php
$content = file_get_contents('app/Registry/ToolRegistry.php');

// Extract each tool entry with regex
$entries = [];
preg_match_all(
    "/'([a-z0-9-]+)' => \[(.*?)(?=\n        '[a-z0-9-]+' => \[|\n    \];\n\};)/s",
    $content,
    $matches,
    PREG_SET_ORDER
);

foreach ($matches as $m) {
    $slug = $m[1];
    $body = $m[2];
    preg_match("/'name' => '([^']+)'/", $body, $name);
    preg_match("/'category' => '([^']+)'/", $body, $cat);
    preg_match("/'seo_title' => '([^']+)'/", $body, $title);
    preg_match("/'meta_description' => '([^']+)'/", $body, $desc);
    preg_match("/'short_description' => '([^']+)'/", $body, $short);
    preg_match_all("/'([a-z0-9-]+)'/", $body, $keywords);
    $kw = $keywords[1];
    preg_match_all("/'([a-z0-9-]+)'/", $body, $rels);
    preg_match("/'related_tools' => \[(.*?)\]/s", $body, $relBody);
    preg_match_all("/'([a-z0-9-]+)'/", $relBody[1] ?? '', $relSlugs);

    $entries[$slug] = [
        'name' => $name[1] ?? $slug,
        'category' => $cat[1] ?? '',
        'seo_title' => $title[1] ?? '',
        'meta_description' => $desc[1] ?? '',
        'primary_kw' => $kw[1] ?? '',
        'related' => array_slice($relSlugs[0], 0, 4),
    ];
}

echo json_encode($entries, JSON_PRETTY_PRINT);
