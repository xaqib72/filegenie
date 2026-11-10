<?php
$content = file_get_contents('app/Registry/ToolRegistry.php');
preg_match_all("/'([a-z0-9-]+)' => \[/", $content, $matches);
echo 'Tool entries found: ' . count($matches[0]) . PHP_EOL;

$counts = [];
preg_match_all("/'category' => '([^']+)'/", $content, $catMatches);
foreach ($catMatches[1] as $c) {
    $counts[$c] = ($counts[$c] ?? 0) + 1;
}
echo PHP_EOL . 'By category:' . PHP_EOL;
foreach ($counts as $c => $n) { echo "  $c: $n" . PHP_EOL; }

preg_match_all("/'seo_title' => '([^']+)'/", $content, $titleMatches);
echo PHP_EOL . 'Unique titles: ' . count(array_unique($titleMatches[1])) . '/' . count($titleMatches[1]) . PHP_EOL;

preg_match_all("/'meta_description' => '([^']+)'/", $content, $descMatches);
echo 'Unique metas: ' . count(array_unique($descMatches[1])) . '/' . count($descMatches[1]) . PHP_EOL;

echo 'Localhost in meta: ' . (stripos($content, 'localhost') !== false ? 'YES (BAD)' : 'NONE') . PHP_EOL;
