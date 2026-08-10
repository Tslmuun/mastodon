// Bing Daily Image Background Loader
// Fetches the daily Bing wallpaper and applies it as the page background

(function () {
  'use strict';

  const BING_API_URL = 'https://www.bing.com/HPImageArchive.aspx';
  const CACHE_KEY = 'bing_daily_bg';
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  // Create the background container element
  function createBackgroundElement() {
    const bgDiv = document.createElement('div');
    bgDiv.id = 'bing-bg';
    bgDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-size: cover;
      background-position: center center;
      background-repeat: no-repeat;
      z-index: -1;
      transition: opacity 0.8s ease-in-out;
      opacity: 0;
    `;
    document.body.prepend(bgDiv);
    return bgDiv;
  }

  // Fetch Bing daily image URL
  async function fetchBingImageUrl() {
    try {
      // Use format=json to get JSON response
      const response = await fetch(
        `${BING_API_URL}?format=js&idx=0&n=1&mkt=zh-CN`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Bing API responded with status: ${response.status}`);
      }

      const data = await response.json();
      if (data.images && data.images.length > 0) {
        const imageUrl = data.images[0].url;
        // Ensure HTTPS
        return imageUrl.startsWith('//')
          ? `https:${imageUrl}`
          : imageUrl.startsWith('http')
            ? imageUrl.replace('http://', 'https://')
            : `https://www.bing.com${imageUrl}`;
      }
    } catch (error) {
      console.warn('Failed to fetch Bing daily image:', error);
    }
    return null;
  }

  // Check if cached image is still valid
  function getCachedImage() {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { url, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION && url) {
          return url;
        }
      }
    } catch (e) {
      // Ignore cache errors
    }
    return null;
  }

  // Cache the image URL
  function cacheImage(url) {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          url,
          timestamp: Date.now(),
        })
      );
    } catch (e) {
      // Ignore cache errors
    }
  }

  // Apply the background image
  function applyBackground(bgElement, imageUrl) {
    bgElement.style.backgroundImage = `url('${imageUrl}')`;
    // Fade in after image starts loading
    bgElement.style.opacity = '1';
  }

  // Fallback gradient background if image fails to load
  function applyFallbackBackground(bgElement) {
    bgElement.style.background = `
      linear-gradient(135deg, 
        #0a192f 0%, 
        #112240 25%, 
        #1a365d 50%, 
        #234e8e 75%, 
        #2d6bc4 100%
      )
    `;
    bgElement.style.opacity = '1';
  }

  // Initialize the background
  async function init() {
    // Don't run on admin or auth pages
    if (
      window.location.pathname.startsWith('/admin') ||
      window.location.pathname.startsWith('/auth')
    ) {
      return;
    }

    const bgElement = createBackgroundElement();

    // Try cached image first
    const cachedUrl = getCachedImage();
    if (cachedUrl) {
      applyBackground(bgElement, cachedUrl);
      // Still fetch fresh image in background
      fetchBingImageUrl().then((newUrl) => {
        if (newUrl && newUrl !== cachedUrl) {
          cacheImage(newUrl);
          applyBackground(bgElement, newUrl);
        }
      });
      return;
    }

    // Fetch fresh image
    const imageUrl = await fetchBingImageUrl();
    if (imageUrl) {
      cacheImage(imageUrl);
      applyBackground(bgElement, imageUrl);
    } else {
      applyFallbackBackground(bgElement);
    }
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
