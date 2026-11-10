<?php
echo "Checking PHP Environment Compatibility...\n";

if (version_compare(PHP_VERSION, '8.1.0', '<')) {
    echo "ERROR: PHP 8.1+ required. Current version: " . PHP_VERSION . "\n";
    exit(1);
}

echo "PHP Version: " . PHP_VERSION . " [OK]\n";
echo "Shared Hosting Environment Check Passed!\n";
