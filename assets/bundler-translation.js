/**
 * Bundler Translation Script
 * 
 * Translates hard-coded English text in bundler elements that cannot be translated 
 * through the bundler settings due to bundler limitations.
 */

document.addEventListener('DOMContentLoaded', function() {
  // Translation mappings for bundler-specific text
  const translations = {
    'Add': {
      'fi': 'Lisää',
      'en': 'Add',
      'de': 'Hinzufügen',
      'es': 'Agregar',
      'fr': 'Ajouter',
      'tr': 'Ekle',
      'vi': 'Thêm',
      'zh-CN': '添加'
    },
    'Your bundle needs 1 more item.': {
      'fi': 'Lisää vähintään 1 tuote',
      'en': 'Your bundle needs 1 more item.',
      'de': 'Ihr Paket benötigt 1 weiteren Artikel.',
      'es': 'Su paquete necesita 1 artículo más.',
      'fr': 'Votre paquet nécessite 1 article de plus.',
      'tr': 'Paketiniz 1 ürün daha gerektirir.',
      'vi': 'Gói của bạn cần thêm 1 sản phẩm.',
      'zh-CN': '您的套餐还需要1个商品。'
    },
    'Your bundle:': {
      'fi': 'Valitut tuotteet:',
      'en': 'Your bundle:',
      'de': 'Ihr Paket:',
      'es': 'Su paquete:',
      'fr': 'Votre paquet:',
      'tr': 'Paketiniz:',
      'vi': 'Gói của bạn:',
      'zh-CN': '您的套餐：'
    },
  };

  // Pattern for "Your bundle needs X more item(s)." with dynamic number
  const bundleNeedsPattern = {
    'fi': 'Lisää vähintään {count} tuotetta',
    'en': 'Your bundle needs {count} more item(s).',
    'de': 'Ihr Paket benötigt {count} weitere Artikel.',
    'es': 'Su paquete necesita {count} artículos más.',
    'fr': 'Votre paquet nécessite {count} articles de plus.',
    'tr': 'Paketiniz {count} ürün daha gerektirir.',
    'vi': 'Gói của bạn cần thêm {count} sản phẩm.',
    'zh-CN': '您的套餐还需要{count}个商品。'
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

    // Check for dynamic bundle needs pattern
    const bundleNeedsMatch = text.match(/Your bundle needs (\d+) more item\(?s?\)?\./);
    if (bundleNeedsMatch) {
      const count = parseInt(bundleNeedsMatch[1]);
      
      // Handle singular case (1 item) with direct translation
      if (count === 1) {
        const singularKey = 'Your bundle needs 1 more item.';
        if (translations[singularKey] && translations[singularKey][language]) {
          return translations[singularKey][language];
        }
      }
      
      // Handle plural case (2+ items) with pattern
      if (count > 1 && bundleNeedsPattern[language]) {
        return bundleNeedsPattern[language].replace('{count}', count);
      }
    }

    // Return original text if no translation found
    return text;
  }

  // Translate all text nodes within bundler elements
  function translateBundlerElements() {
    const currentLanguage = getCurrentLanguage();
    
    // Skip if already in English or no translations needed
    if (currentLanguage === 'en') {
      return;
    }

    // Find all bundler elements (they typically have specific classes or are within app blocks)
    const bundlerSelectors = [
      '[data-shortcode]', // Bundler elements often have data-shortcode attributes
      '.bundler-target-element', // From CSS analysis
      '[data-bndlr-ccid]', // From CSS analysis - bundler container identifier
      '.bndlr-container', // From CSS analysis
      '.bndlr-add-to-bundle', // Specific "Add" button class
      '.bndlr-mnm-instructions-text', // Specific bundle instructions text class
      '.bndlr-mnm-selected-products-title', // Specific "Your bundle:" title class
      '.bundler-app', // Common bundler class
      '.bundler-element',
      '[class*="bundler"]',
      '[class*="bndlr"]', // Bundler abbreviated classes
      '.shopify-app-block', // Shopify app blocks
      '[data-bundler]'
    ];

    let bundlerElements = [];
    bundlerSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      bundlerElements = bundlerElements.concat(Array.from(elements));
    });

    // If no specific bundler elements found, check for elements containing typical bundler text
    if (bundlerElements.length === 0) {
      const allElements = document.querySelectorAll('*');
      bundlerElements = Array.from(allElements).filter(el => {
        const text = el.textContent;
        return text.includes('Your bundle needs') || 
               (text.trim() === 'Add' && el.tagName === 'BUTTON') ||
               el.textContent.match(/bundle.*more.*item/i);
      });
    }

    // Translate text in found elements
    bundlerElements.forEach((element, index) => {
      translateElementText(element, currentLanguage);
    });
  }

  // Recursively translate text nodes in an element
  function translateElementText(element, language) {
    // Process all child nodes
    for (let node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const originalText = node.textContent.trim();
        if (originalText) {
          const translatedText = translateText(originalText, language);
          if (translatedText !== originalText) {
            node.textContent = node.textContent.replace(originalText, translatedText);
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Recursively process child elements
        translateElementText(node, language);
      }
    }
  }

  // Observer to watch for dynamically added bundler content
  function setupMutationObserver() {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if the added node or its children contain bundler elements
              const containsBundlerText = node.textContent && 
                (node.textContent.includes('Your bundle needs') || 
                 node.textContent.includes('Add'));
              
              if (containsBundlerText) {
                setTimeout(() => {
                  translateBundlerElements();
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


  // Initial translation attempt
  setTimeout(() => {
    translateBundlerElements();
  }, 500); // Give bundler time to load

  // Also translate after longer delay in case bundler loads slowly
  setTimeout(() => {
    translateBundlerElements();
  }, 2000);

  // Set up observer for dynamic content
  setupMutationObserver();

  // Also translate when bundler events fire (if any)
  document.addEventListener('click', function(event) {
    // Re-translate after clicks that might trigger bundler updates
    const target = event.target;
    if (target.matches('button') || target.closest('button')) {
      setTimeout(() => {
        translateBundlerElements();
      }, 200);
    }
  });

  // Translate on window load as well (in case bundler loads late)
  window.addEventListener('load', function() {
    setTimeout(() => {
      translateBundlerElements();
    }, 1000);
  });
});
