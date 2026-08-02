document.addEventListener('DOMContentLoaded', () => {
  const photos = [...document.querySelectorAll('.studio-photo')];
  const lightbox = document.getElementById('studio-lightbox');
  const lightboxImageWrap = document.getElementById('studio-lightbox-img-wrap');
  const closeButton = document.getElementById('studio-lightbox-close');
  let activeIndex = 0;
  let touchStartX = 0;
  let lastTrigger = null;

  const renderLightboxImage = () => {
    const photo = photos[activeIndex];
    const sourceImage = photo?.querySelector('img');
    if (!photo || !sourceImage || !lightboxImageWrap) return;

    const image = document.createElement('img');
    image.src = photo.dataset.fullSrc || sourceImage.currentSrc || sourceImage.src;
    image.alt = sourceImage.alt;
    image.decoding = 'async';
    lightboxImageWrap.replaceChildren(image);
  };

  const openLightbox = (index, trigger) => {
    if (!lightbox || !lightboxImageWrap) return;
    activeIndex = index;
    lastTrigger = trigger;
    renderLightboxImage();
    lightbox.classList.add('open');
    document.body.classList.add('modal-open');
    closeButton?.focus();
  };

  const closeLightbox = () => {
    if (!lightbox?.classList.contains('open')) return;
    lightbox.classList.remove('open');
    document.body.classList.remove('modal-open');
    lightboxImageWrap?.replaceChildren();
    lastTrigger?.focus();
  };

  const moveLightbox = (delta) => {
    activeIndex = (activeIndex + delta + photos.length) % photos.length;
    renderLightboxImage();
  };

  photos.forEach((photo, index) => {
    const img = photo.querySelector('img');
    if (!img) return;

    photo.setAttribute('role', 'button');
    photo.setAttribute('tabindex', '0');
    photo.setAttribute('aria-label', img.alt);
    photo.addEventListener('click', () => openLightbox(index, photo));
    photo.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLightbox(index, photo);
      }
    });

    const hideMock = () => {
      photo.classList.add('loaded');
    };
    const showMock = () => {
      photo.classList.remove('loaded');
    };

    if (img.complete && img.naturalWidth > 0) {
      hideMock();
    } else {
      img.addEventListener('load', hideMock);
      img.addEventListener('error', showMock);
    }
  });

  closeButton?.addEventListener('click', closeLightbox);
  document.getElementById('studio-lightbox-prev')?.addEventListener('click', () => moveLightbox(-1));
  document.getElementById('studio-lightbox-next')?.addEventListener('click', () => moveLightbox(1));
  lightbox?.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  lightbox?.addEventListener('touchstart', (event) => {
    touchStartX = event.touches[0].clientX;
  }, { passive: true });
  lightbox?.addEventListener('touchend', (event) => {
    const deltaX = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(deltaX) >= 50) moveLightbox(deltaX < 0 ? 1 : -1);
  }, { passive: true });
  document.addEventListener('keydown', (event) => {
    if (!lightbox?.classList.contains('open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeLightbox();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveLightbox(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveLightbox(1);
    } else if (event.key === 'Tab') {
      const controls = [...lightbox.querySelectorAll('button')];
      const firstControl = controls[0];
      const lastControl = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === firstControl) {
        event.preventDefault();
        lastControl.focus();
      } else if (!event.shiftKey && document.activeElement === lastControl) {
        event.preventDefault();
        firstControl.focus();
      }
    }
  });
});
