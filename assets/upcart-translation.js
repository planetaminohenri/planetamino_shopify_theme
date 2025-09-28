/**
 * Upcart Translation Script
 * 
 * Translates hard-coded English text in upcart elements that cannot be translated 
 * through the upcart app settings due to app limitations.
 */

document.addEventListener('DOMContentLoaded', function() {
  // Translation mappings for upcart-specific text
  const translations = {
    'Full price': {
      'fi': 'Kertaostos',
      'en': 'Full price',
      'de': 'Vollpreis',
      'es': 'Precio completo',
      'fr': 'Prix complet',
      'tr': 'Tam fiyat',
      'vi': 'Giá đầy đủ',
      'zh-CN': '原价'
    },
    'Subscription Plans': {
      'fi': 'Kestotilaus',
      'en': 'Subscription Plans',
      'de': 'Abonnement-Pläne',
      'es': 'Planes de suscripción',
      'fr': 'Plans d\'abonnement',
      'tr': 'Abonelik Planları',
      'vi': 'Gói đăng ký',
      'zh-CN': '订阅计划'
    }
  };

  // Get current language from URL or HTML lang attribute
  function getCurrentLanguage() {
    // First try to get from URL path
    const path = window.location.pathname;
    const languageMatch = path.match(/^\/([a-z]{2})(?:\/|$)/);
    if (languageMatch) {
      return languageMatch[1];
    }
    
    // Fallback to HTML lang attribute
    const htmlLang = document.documentElement.lang;
    if (htmlLang) {
      return htmlLang.split('-')[0]; // Get just the language part (e.g., 'en' from 'en-US')
    }
    
    // Default to English
    return 'en';
  }

  // Translate text based on current language
  function translateText(text, language) {
    // Direct translation lookup
    if (translations[text] && translations[text][language]) {
      return translations[text][language];
    }

    // Return original text if no translation found
    return text;
  }

  // Translate all text nodes within upcart elements
  function translateUpcartElements() {
    const currentLanguage = getCurrentLanguage();
    
    // Skip if already in English or no translations needed
    if (currentLanguage === 'en') {
      return;
    }

    // Find all upcart elements, focusing on the specific subscription module
    const upcartSelectors = [
      '.SubscriptionUpgradesModule_dropdown', // Main container
      '.SubscriptionUpgradesModule_dropdownWrapper', // Wrapper
      'select.upcart-subscription-upgrade-dropdown', // The select element
      'optgroup[label="Full price"]', // Specific optgroup for Full price
      'optgroup[label="Subscription plans"]', // Specific optgroup for Subscription plans
      '[class*="upcart"]', // General upcart classes
      '[data-upcart]', // Upcart data attributes
      '.upcart-container',
      '.upcart-drawer',
      '.upcart-popup',
      '.upcart-widget',
      '#upcart-cart-drawer', // Common upcart ID
      '[id*="upcart"]', // Elements with upcart in ID
      '[class*="UpCart"]' // Alternative capitalization
    ];

    let upcartElements = [];
    upcartSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        upcartElements = upcartElements.concat(Array.from(elements));
      } catch (e) {
        // Skip invalid selectors
        console.warn('Invalid selector:', selector);
      }
    });

    // If no specific upcart elements found, check for elements containing upcart text
    if (upcartElements.length === 0) {
      const allElements = document.querySelectorAll('*');
      upcartElements = Array.from(allElements).filter(el => {
        const text = el.textContent;
        return text.includes('Full price') || text.includes('Subscription Plans');
      });
    }

    // Also specifically look for optgroup elements with our target labels
    const optgroups = document.querySelectorAll('optgroup[label="Full price"], optgroup[label="Subscription plans"]');
    optgroups.forEach(optgroup => {
      if (!upcartElements.includes(optgroup)) {
        upcartElements.push(optgroup);
      }
    });

    // Translate text in found elements
    console.log(`Attempting to translate ${upcartElements.length} upcart elements for language: ${currentLanguage}`);
    upcartElements.forEach((element, index) => {
      console.log(`Translating upcart element ${index}:`, element.tagName, element.className);
      translateElementText(element, currentLanguage);
    });
  }

  // Recursively translate text nodes in an element
  function translateElementText(element, language) {
    // Special handling for optgroup elements - translate the label attribute
    if (element.tagName === 'OPTGROUP' && element.hasAttribute('label')) {
      const originalLabel = element.getAttribute('label');
      const translatedLabel = translateText(originalLabel, language);
      if (translatedLabel !== originalLabel) {
        console.log(`Upcart Translation (optgroup label): "${originalLabel}" -> "${translatedLabel}"`);
        element.setAttribute('label', translatedLabel);
      }
    }
    
    // Process all child nodes
    for (let node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const originalText = node.textContent.trim();
        if (originalText) {
          const translatedText = translateText(originalText, language);
          if (translatedText !== originalText) {
            console.log(`Upcart Translation: "${originalText}" -> "${translatedText}"`);
            node.textContent = node.textContent.replace(originalText, translatedText);
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Handle optgroup elements specifically
        if (node.tagName === 'OPTGROUP' && node.hasAttribute('label')) {
          const originalLabel = node.getAttribute('label');
          const translatedLabel = translateText(originalLabel, language);
          if (translatedLabel !== originalLabel) {
            console.log(`Upcart Translation (optgroup label): "${originalLabel}" -> "${translatedLabel}"`);
            node.setAttribute('label', translatedLabel);
          }
        }
        // Recursively process child elements
        translateElementText(node, language);
      }
    }
  }

  // Observer to watch for dynamically added upcart content
  function setupMutationObserver() {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if the added node or its children contain upcart elements
              const containsUpcartText = node.textContent && 
                (node.textContent.includes('Full price') ||
                 node.textContent.includes('Subscription Plans'));
              
              if (containsUpcartText) {
                setTimeout(() => {
                  translateUpcartElements();
                }, 100); // Small delay to allow content to fully render
              }
            }
          });
        }
      });
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Debug function to log what elements we find
  function debugUpcartElements() {
    console.log('=== UPCART DEBUG ===');
    console.log('Current language:', getCurrentLanguage());
    
    const upcartSelectors = [
      '.SubscriptionUpgradesModule_dropdown',
      '.SubscriptionUpgradesModule_dropdownWrapper',
      'select.upcart-subscription-upgrade-dropdown',
      'optgroup[label="Full price"]',
      'optgroup[label="Subscription plans"]',
      '[class*="upcart"]',
      '[data-upcart]',
      '.upcart-container',
      '.upcart-drawer',
      '.upcart-popup',
      '.upcart-widget',
      '#upcart-cart-drawer',
      '[id*="upcart"]',
      '[class*="UpCart"]'
    ];

    upcartSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          console.log(`Found ${elements.length} elements with selector: ${selector}`);
          elements.forEach((el, index) => {
            console.log(`  Element ${index}:`, el);
            console.log(`  Text content:`, el.textContent.substring(0, 200));
          });
        }
      } catch (e) {
        console.warn('Invalid selector:', selector);
      }
    });

    // Also check for text containing our target strings
    const textElements = Array.from(document.querySelectorAll('*')).filter(el => {
      const text = el.textContent;
      return text.includes('Full price') || text.includes('Subscription Plans');
    });
    
    console.log('Elements containing upcart target text:', textElements.length);
    textElements.forEach((el, index) => {
      if (index < 10) { // Limit to first 10 to avoid spam
        console.log(`  Text element ${index}:`, el.tagName, el.className, el.textContent.trim());
      }
    });
    
    console.log('=== END UPCART DEBUG ===');
  }

  // Initial translation attempt
  setTimeout(() => {
    debugUpcartElements(); // Add debug first
    translateUpcartElements();
  }, 500); // Give upcart time to load

  // Also debug after longer delay in case upcart loads slowly
  setTimeout(() => {
    console.log('=== SECOND UPCART DEBUG ATTEMPT ===');
    debugUpcartElements();
    translateUpcartElements();
  }, 2000);

  // Set up observer for dynamic content
  setupMutationObserver();

  // Also translate when upcart events fire (if any)
  document.addEventListener('click', function(event) {
    // Re-translate after clicks that might trigger upcart updates
    const target = event.target;
    if (target.matches('button') || target.closest('button')) {
      setTimeout(() => {
        translateUpcartElements();
      }, 200);
    }
  });

  // Translate on window load as well (in case upcart loads late)
  window.addEventListener('load', function() {
    setTimeout(() => {
      translateUpcartElements();
    }, 1000);
  });

  // Listen for upcart-specific events if they exist
  ['upcart:loaded', 'upcart:updated', 'upcart:opened', 'upcart:closed'].forEach(eventName => {
    document.addEventListener(eventName, function() {
      setTimeout(() => {
        translateUpcartElements();
      }, 100);
    });
  });
});
