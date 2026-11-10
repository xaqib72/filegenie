<?php /** @var string $csrf_token */ ?>
<section class="section">
    <div class="container narrow">
        <div class="page-head">
            <h1>Contact us</h1>
            <p class="page-sub">Questions, feedback, or a tool you'd love to see? Send a note.</p>
        </div>
        <form class="contact-form" id="contact-form" method="post" action="/contact/send">
            <input type="hidden" name="_csrf" value="<?= htmlspecialchars($csrf_token, ENT_QUOTES, 'UTF-8') ?>">
            <div class="field">
                <label for="c-name">Name</label>
                <input type="text" id="c-name" name="name" required maxlength="120" autocomplete="name">
            </div>
            <div class="field">
                <label for="c-email">Email</label>
                <input type="email" id="c-email" name="email" required maxlength="160" autocomplete="email">
            </div>
            <div class="field">
                <label for="c-message">Message</label>
                <textarea id="c-message" name="message" rows="6" required minlength="10"></textarea>
            </div>
            <button class="btn btn-primary" type="submit">Send message</button>
            <p class="form-status" id="contact-status" role="status" aria-live="polite"></p>
        </form>
    </div>
</section>

<script>
(function () {
    var form = document.getElementById('contact-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var status = document.getElementById('contact-status');
        status.textContent = 'Sending…';
        var data = new FormData(form);
        fetch('/contact/send', { method: 'POST', body: data })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res.success && res.mailto) {
                    status.textContent = 'Opening your email client…';
                    window.location.href = res.mailto;
                } else {
                    status.textContent = res.error || 'Something went wrong.';
                }
            })
            .catch(function () {
                status.textContent = 'Network error. Please try again.';
            });
    });
})();
</script>
