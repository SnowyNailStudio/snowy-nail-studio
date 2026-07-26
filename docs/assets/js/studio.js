document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.studio-photo').forEach((photo) => {
    const img = photo.querySelector('img');
    if (!img) return;
    const mock = photo.querySelector('.studio-photo-mock');

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
});
