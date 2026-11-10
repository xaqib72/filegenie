<section class="section">
    <div class="container prose">
        <h1>Privacy Policy</h1>
        <p><strong>Last updated:</strong> <?= date('F j, Y') ?></p>
        <p>FileGenie is designed so that privacy is the default, not a setting. This policy explains exactly what we do and do not collect.</p>

        <h2>What we process</h2>
        <p>All file processing (compression, conversion, merging, splitting, transcription, hashing, and so on) happens <strong>locally in your browser</strong>. Your files are read by your device, transformed in memory, and the result is offered for download. The files are <strong>never transmitted to our servers</strong>.</p>

        <h2>Analytics and your choice</h2>
        <?php if (!empty($GLOBALS['fg_config']['google_tag_id'])): ?>
        <p>We use Google Analytics only if you choose “Allow analytics.” It helps us understand visits and page usage. Google may use cookies and receive information such as pages visited, browser and device details, and approximate network information. We never send the contents of files you process to Google. You can reject analytics or change your choice using “Privacy settings” in the footer. See <a href="https://policies.google.com/privacy" rel="noopener noreferrer">Google’s Privacy Policy</a>.</p>
        <?php else: ?>
        <p>Google Analytics is not currently active. If enabled, it will load only after you choose to allow analytics. File contents are never sent to analytics.</p>
        <?php endif; ?>

        <h2>What we store</h2>
        <p>We do not operate accounts, and we do not store the content of any file you process.</p>

        <h2>Contact</h2>
        <p>If you have questions about this policy, reach us at <a href="/contact"><?= htmlspecialchars($contact_email ?? 'hello@filegenie.com', ENT_QUOTES, 'UTF-8') ?></a>.</p>
    </div>
</section>
