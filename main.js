// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Contact form handling is implemented inside initContactInteractions()
// to provide unified toast feedback and copy-to-clipboard interactions.



// Theme toggle functionality
const initTheme = () => {
    // Force dark theme only
    document.documentElement.setAttribute('data-theme', 'dark');
};

// Navigation hover animation
const initNavAnimation = () => {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    const links = [...navLinks.getElementsByTagName('a')];
    
    // Funzione per calcolare la posizione e larghezza esatte della pillola
    // Funzione per calcolare la posizione e larghezza esatte della pillola
    const updatePill = (link) => {
        const linkRect = link.getBoundingClientRect();
        const navRect = navLinks.getBoundingClientRect();
        
        // Calcola la posizione rispetto al contenitore nav
        const x = linkRect.left - navRect.left;
        
        // *** NUOVE VARIABILI PER LA RIDUZIONE ***
        const PILL_REDUCTION = 10; // Riduci la larghezza di 16px totali (8px per lato)
        const newWidth = linkRect.width - PILL_REDUCTION - 2;
        const newX = x + (PILL_REDUCTION / 2); // Sposta la pillola a destra per centrarla
        
        // Imposta posizione e larghezza ridotte
        navLinks.style.setProperty('--pill-x', `${newX}px`);
        navLinks.style.setProperty('--pill-width', `${newWidth}px`);
    };
    // Aggiungi gli eventi per ogni link
    links.forEach(link => {
        link.addEventListener('mouseenter', () => updatePill(link));
        link.addEventListener('click', (e) => {
            e.preventDefault();
            updatePill(link);
            // Scroll to section
            const targetId = link.getAttribute('href');
            document.querySelector(targetId).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Imposta lo stato iniziale sul primo link
    updatePill(links[0]);

    // Aggiorna la posizione della pillola quando la finestra viene ridimensionata
    window.addEventListener('resize', () => {
        const activeLink = navLinks.querySelector('a.active');
        if (activeLink) updatePill(activeLink);
    });
};

// Initialize theme
initTheme();

// Initialize navigation animation
initNavAnimation();

// Prevent downloading/dragging original gallery images — offer logo instead
const initImageProtection = () => {
    const logoEl = document.querySelector('.logo img');
    const logoURL = logoEl ? logoEl.src : 'img/logoPNG.png';

    // Intercept right-click on gallery images
    document.addEventListener('contextmenu', (e) => {
        // MODIFICATO: Ora cerchiamo il contenitore .img-wrapper
        const wrapper = e.target.closest('.gallery-item .img-wrapper');
        if (!wrapper) return; // not a gallery image wrapper
        
        e.preventDefault(); // Blocca il menu contestuale

        // Trigger a download of the logo instead
        try {
            const a = document.createElement('a');
            a.href = logoURL;
            a.download = 'logo.png';
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) {
            // fallback: open the logo in a new tab
            window.open(logoURL, '_blank');
        }
    });

    // Intercept dragstart so dragged data is the logo
    document.addEventListener('dragstart', (e) => {
        // MODIFICATO: Ora cerchiamo il contenitore .img-wrapper
        const wrapper = e.target.closest('.gallery-item .img-wrapper');
        if (!wrapper) return;
        
        e.preventDefault(); // Blocca il trascinamento nativo
        
        try {
            // Provide the logo URL as the dragged resource
            e.dataTransfer.setData('text/uri-list', logoURL);
            e.dataTransfer.setData('text/plain', logoURL);
        } catch (err) {
            // ignore
        }

        // Use the logo as drag image if available
        const dragImg = new Image();
        dragImg.src = logoURL;
        dragImg.onload = () => {
            try { e.dataTransfer.setDragImage(dragImg, dragImg.width / 2, dragImg.height / 2); } catch (_) {}
        };
    });
};

    // Intercept dragstart so dragged data is the logo
    document.addEventListener('dragstart', (e) => {
        const img = e.target.closest('.gallery-item .img-wrapper img');
        if (!img) return;
        try {
            // Provide the logo URL as the dragged resource
            e.dataTransfer.setData('text/uri-list', logoURL);
            e.dataTransfer.setData('text/plain', logoURL);
        } catch (err) {
            // ignore
        }

        // Use the logo as drag image if available
        const dragImg = new Image();
        dragImg.src = logoURL;
        dragImg.onload = () => {
            try { e.dataTransfer.setDragImage(dragImg, dragImg.width / 2, dragImg.height / 2); } catch (_) {}
        };
    });

// Initialize image protection
initImageProtection();

// Contact interactions: validation, copy-to-clipboard, toast, brochure download
const initContactInteractions = () => {
    const form = document.getElementById('contact-form');
    const toast = document.getElementById('toast');

    const showToast = (msg, ms = 2500) => {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toast._t);
        toast._t = setTimeout(() => toast.classList.remove('show'), ms);
    };

    // Form submission with basic validation and a friendly toast
    if (form) {
        // Il tag <form action="https://formsubmit.co/..." method="POST"> 
        // invia i dati direttamente. Questo JS gestisce solo la validazione pre-invio.
        form.addEventListener('submit', (e) => {
            // Non blocchiamo l'azione di default, Formsubmit gestirà l'invio.
            // e.preventDefault(); 
            
            const name = form.querySelector('#name').value.trim();
            const cognome = form.querySelector('#cognome') ? form.querySelector('#cognome').value.trim() : '';
            const email = form.querySelector('#email').value.trim();
            const message = form.querySelector('#message').value.trim();

            if (!name || !cognome || !email || !message) {
                e.preventDefault(); // Blocca l'invio se manca un campo
                showToast('Per favore compila tutti i campi obbligatori: Nome, Cognome, Email e Messaggio.');
                return;
            }

            // Basic email check
            const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRx.test(email)) {
                e.preventDefault(); // Blocca l'invio se l'email non è valida
                showToast('Indirizzo email non valido.');
                return;
            }

            // Se la validazione passa, il form viene inviato al servizio (Formsubmit)
            // Formsubmit reindirizzerà a una pagina di ringraziamento (o alla stessa pagina)
            showToast('Invio in corso...');
            
            // Aggiungi un campo nascosto per forzare il reindirizzamento alla stessa pagina 
            // dopo l'invio del modulo (Formsubmit). Questo campo non è necessario, 
            // ma migliora l'esperienza post-invio.
            // Formsubmit usa `?subject` nel `_next` per personalizzare l'oggetto.
            const subject = encodeURIComponent(`Nuovo contatto da ${name} ${cognome}`);
            const redirectTo = `${window.location.href}#contact?subject=${subject}`;
            
            // Aggiungi il campo nascosto per il reindirizzamento
            const redirectInput = document.createElement('input');
            redirectInput.type = 'hidden';
            redirectInput.name = '_next';
            redirectInput.value = redirectTo;
            form.appendChild(redirectInput);
            
            // Aggiungi il campo nascosto per l'oggetto dell'email
            const subjectInput = document.createElement('input');
            subjectInput.type = 'hidden';
            subjectInput.name = '_subject';
            subjectInput.value = `Nuovo Messaggio da FerroPh: ${name}`;
            form.appendChild(subjectInput);
            
            // (L'invio effettivo continua perché non abbiamo chiamato e.preventDefault())
            
            // Reset del form subito prima dell'invio (non necessario ma pulisce l'UI)
            setTimeout(() => form.reset(), 500); 
        });
    }
};

// Initialize contact interactions
initContactInteractions();

// Lightweight parallax for hero (respects reduced motion)
const initParallax = () => {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const onScroll = () => {
        const scrolled = window.scrollY;
        // Move background slightly for parallax
        hero.style.backgroundPosition = `center ${Math.max(-20, -scrolled * 0.15)}px`;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
};

initParallax();

// Animazioni allo scroll
const initScrollAnimations = () => {
    const animateOnScroll = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.remove('hidden');
                    const animation = entry.target.dataset.animation;
                    if (animation) {
                        entry.target.classList.add(animation);
                    }
                    
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px'
        });

        // Seleziona tutti gli elementi da animare
        document.querySelectorAll('[data-animation]').forEach(el => {
            el.classList.add('hidden');
            observer.observe(el);
        });
    };

    // Inizializza le animazioni
    animateOnScroll();
};

// Inizializza le animazioni allo scroll
//initScrollAnimations();