/**
 * Custom Product Localization Handler - Alternative Version
 * 
 * This version intercepts form submissions directly instead of relying on click events
 */

document.addEventListener('DOMContentLoaded', function() {
  // Define product redirect mappings
  const productRedirectMap = {
    'power-cookie': {
      'fi': '/fi/products/voimakeksi-fi',
      'en': '/products/power-cookie'
    },
    'vegan-protein-powder': {
      'fi': '/fi/products/proteiinijauhe',
      'en': '/products/vegan-protein-powder'
    },
    'i-want-to-taste-them-all-bundle': {
      'fi': '/fi/products/haluan-maistaa-kaikkia',
      'en': '/products/i-want-to-taste-them-all-bundle'
    },
    'haluan-maistaa-kaikkia': {
      'fi': '/fi/products/haluan-maistaa-kaikkia',
      'en': '/products/i-want-to-taste-them-all-bundle'
    },
    'voimakeksi-fi': {
      'fi': '/fi/products/voimakeksi-fi',
      'en': '/products/power-cookie'
    },
    'proteiinijauhe': {
      'fi': '/fi/products/proteiinijauhe',
      'en': '/products/vegan-protein-powder'
    }
  };

  // Get current product handle from URL
  function getCurrentProductHandle() {
    const path = window.location.pathname;
    const productMatch = path.match(/\/products\/([^\/\?]+)/);
    return productMatch ? productMatch[1] : null;
  }

  // Check if we should handle this product
  function shouldHandleCustomRedirect(productHandle) {
    return productHandle && productRedirectMap.hasOwnProperty(productHandle);
  }

  // Get target URL for product and language
  function getTargetUrl(productHandle, targetLanguage) {
    const mapping = productRedirectMap[productHandle];
    return mapping && mapping[targetLanguage] ? mapping[targetLanguage] : null;
  }

  // Intercept all form submissions
  document.addEventListener('submit', function(event) {
    const form = event.target;
    
    // Check if this is a localization form
    if (form.action && form.action.includes('/localization')) {
      const localeInput = form.querySelector('input[name="locale_code"]');
      if (localeInput) {
        const targetLanguage = localeInput.value;
        const currentProductHandle = getCurrentProductHandle();
        
        if (shouldHandleCustomRedirect(currentProductHandle)) {
          const targetUrl = getTargetUrl(currentProductHandle, targetLanguage);
          
          if (targetUrl) {
            event.preventDefault();
            window.location.href = targetUrl;
            return false;
          }
        }
      }
    }
  });

  // Also try to intercept click events on language links as backup
  document.addEventListener('click', function(event) {
    const target = event.target.closest('a[data-value]');
    if (target && target.closest('localization-form')) {
      const targetLanguage = target.dataset.value;
      const currentProductHandle = getCurrentProductHandle();
      
      if (shouldHandleCustomRedirect(currentProductHandle)) {
        const targetUrl = getTargetUrl(currentProductHandle, targetLanguage);
        
        if (targetUrl) {
          event.preventDefault();
          event.stopPropagation();
          window.location.href = targetUrl;
          return false;
        }
      }
    }
  });
});
