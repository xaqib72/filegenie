(() => {
    const panel = document.getElementById('analytics-consent');
    if (!panel) return;

    const googleTagId = panel.dataset.googleTagId || '';
    const storageKey = 'filegenie_analytics_consent';
    let consent = null;
    let tagInitialized = false;

    try {
        consent = localStorage.getItem(storageKey);
    } catch (error) {
        consent = null;
    }

    const updateGoogleConsent = (choice) => {
        if (typeof window.gtag === 'function') {
            window.gtag('consent', 'update', {
                analytics_storage: choice === 'granted' ? 'granted' : 'denied',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
            });
        }
    };

    const loadGoogleTag = () => {
        if (tagInitialized || !/^(G-[A-Z0-9]+|GTM-[A-Z0-9]+)$/.test(googleTagId)) return;
        tagInitialized = true;
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
        window.gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
        });
        const script = document.createElement('script');
        script.async = true;
        if (googleTagId.startsWith('GTM-')) {
            updateGoogleConsent('granted');
            window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
            script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(googleTagId)}`;
        } else {
            updateGoogleConsent('granted');
            window.gtag('js', new Date());
            window.gtag('config', googleTagId);
            script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleTagId)}`;
        }
        document.head.appendChild(script);
    };

    const saveChoice = (choice) => {
        consent = choice;
        try {
            localStorage.setItem(storageKey, choice);
        } catch (error) {
            // Keep the choice for this page view when storage is unavailable.
        }

        if (choice === 'granted') {
            if (tagInitialized) {
                updateGoogleConsent('granted');
            } else {
                loadGoogleTag();
            }
        } else {
            updateGoogleConsent('denied');
        }
        panel.hidden = true;
    };

    panel.addEventListener('click', (event) => {
        const choiceButton = event.target.closest('[data-analytics-choice]');
        if (!choiceButton) return;
        saveChoice(choiceButton.dataset.analyticsChoice === 'granted' ? 'granted' : 'denied');
    });

    document.querySelectorAll('[data-privacy-settings]').forEach((button) => {
        button.addEventListener('click', () => {
            panel.hidden = false;
            panel.querySelector('[data-analytics-choice="denied"]')?.focus();
        });
    });

    if (consent === 'granted') {
        loadGoogleTag();
    } else if (consent !== 'denied') {
        panel.hidden = false;
    }
})();
