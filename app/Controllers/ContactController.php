<?php
namespace App\Controllers;

use App\Support\Security;
use App\Support\SEO;

class ContactController extends \App\Core\Controller
{
    public function show(): void
    {
        $meta = SEO::generateMeta([
            'title' => 'Contact FileGenie',
            'meta_description' => 'Get in touch with the FileGenie team with feedback, questions, or tool requests.',
        ]);
        $this->render('pages/contact', [
            'title' => $meta['title'],
            'meta_description' => $meta['description'],
            'canonical' => $meta['canonical'],
            'schema' => $meta['schema'],
            'csrf_token' => Security::generateCsrfToken(),
            'body_class' => 'page-contact',
        ]);
    }

    public function send(): void
    {
        // This platform is 100% client-side; contact uses a mailto fallback.
        // We validate the CSRF token and required fields, then redirect.
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->json(['error' => 'Method not allowed.'], 405);
        }

        $token = $_POST['_csrf'] ?? null;
        if (!Security::verifyCsrfToken($token)) {
            $this->json(['error' => 'Invalid security token. Please refresh and try again.'], 403);
        }

        $name = trim($_POST['name'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $message = trim($_POST['message'] ?? '');

        $errors = [];
        if ($name === '') $errors[] = 'Please enter your name.';
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Please enter a valid email address.';
        if (strlen($message) < 10) $errors[] = 'Please enter a message of at least 10 characters.';

        if (!empty($errors)) {
            $this->json(['error' => implode(' ', $errors)], 422);
        }

        // No server-side storage: build a mailto link for the client to open.
        $this->json([
            'success' => true,
            'mailto' => 'mailto:' . $this->config('contact_email') .
                '?subject=' . rawurlencode('FileGenie Contact: ' . $name) .
                '&body=' . rawurlencode("Name: {$name}\nEmail: {$email}\n\n{$message}"),
        ]);
    }
}
