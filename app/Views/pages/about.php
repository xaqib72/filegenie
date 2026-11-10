<?php
// ToolRegistry is loaded by the App\ autoloader in app/bootstrap.php. Keeping
// the view free of path-relative includes also makes /about work in the
// flattened Hostinger deployment layout.
$aboutCount = \App\Registry\ToolRegistry::count();
?>
<section class="section">
    <div class="container prose">
        <h1>About FileGenie</h1>
        <p>FileGenie is a worldwide, all-in-one file toolkit built on a simple principle: <strong>your files should never have to leave your device to be useful.</strong></p>
        <p>Every one of our <?= $aboutCount ?> tools — across PDFs, images, video, audio, text, and utilities — runs entirely inside your web browser using HTML5, the Canvas API, Web Audio, Web Crypto, and WebAssembly. There is no upload step, no server-side processing, and no database storing your content.</p>
        <h2>Why client-side?</h2>
        <ul>
            <li><strong>Privacy:</strong> Files are processed locally and discarded when you close the tab.</li>
            <li><strong>Speed:</strong> No network round-trips means instant feedback.</li>
            <li><strong>Cost:</strong> Running on standard PHP shared hosting keeps the service free to operate.</li>
        </ul>
        <h2>How it works technically</h2>
        <p>Pages are served by a lightweight PHP router on shared hosting, but the heavy lifting happens in your browser. PDFs are assembled with PDF libraries compiled to WebAssembly, images are manipulated with the Canvas API, video and audio are trans-coded with FFmpeg WASM, and cryptographic operations use the Web Crypto API.</p>
        <p class="cta-line"><a class="btn btn-primary" href="/all-tools">Try the tools</a></p>
    </div>
</section>
