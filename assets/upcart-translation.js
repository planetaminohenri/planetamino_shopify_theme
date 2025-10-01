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

  // Build a lowercase-keyed map for case-insensitive lookups
  const normalizedTranslations = {};
  Object.keys(translations).forEach(function(key) {
    normalizedTranslations[key.toLowerCase()] = translations[key];
  });

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
    var original = text == null ? '' : String(text);
    var trimmed = original.trim();

    // Direct translation lookup (exact match)
    if (translations[trimmed] && translations[trimmed][language]) {
      return translations[trimmed][language];
    }

    // Case-insensitive fallback (e.g., 'Subscription plans' vs 'Subscription Plans')
    var lower = trimmed.toLowerCase();
    if (normalizedTranslations[lower] && normalizedTranslations[lower][language]) {
      return normalizedTranslations[lower][language];
    }

    // Return original text if no translation found
    return original;
  }

  // Translate all text nodes within upcart elements
  function translateUpcartElements() {
    const currentLanguage = getCurrentLanguage();
    
    // Skip if already in English or no translations needed
    if (currentLanguage === 'en') {
      return;
    }

    // Gather all searchable roots (document, shadow roots, and same-origin iframes)
    const roots = getAllRoots();

    // Directly target optgroup elements first across all roots
    const optgroups = queryAllInRoots('optgroup', roots);
    
    optgroups.forEach((optgroup) => {
      const label = optgroup.getAttribute('label');
      
      if (label && ['full price', 'subscription plans'].includes(label.toLowerCase())) {
        const translatedLabel = translateText(label, currentLanguage);
        if (translatedLabel !== label) {
          optgroup.setAttribute('label', translatedLabel);
        }
      }
    });

    // Also search by specific selectors
    const upcartSelectors = [
      '.SubscriptionUpgradesModule_dropdown',
      '.SubscriptionUpgradesModule_dropdownWrapper', 
      'select.upcart-subscription-upgrade-dropdown',
      '[class*="upcart"]'
    ];

    let upcartElements = [];
    upcartSelectors.forEach(selector => {
      try {
        const elements = queryAllInRoots(selector, roots);
        upcartElements = upcartElements.concat(Array.from(elements));
      } catch (e) {
        // ignore invalid selectors
      }
    });

    // Translate text in found elements
    upcartElements.forEach((element) => {
      translateElementText(element, currentLanguage);
    });

    // Fallback: if nothing matched, scan the whole document for our two strings
    if (optgroups.length === 0 && upcartElements.length === 0) {
      replaceTextNodesGlobally(currentLanguage, roots);
    }
  }

  // Recursively translate text nodes in an element
  function translateElementText(element, language) {
    // Special handling for optgroup elements - translate the label attribute
    if (element.tagName === 'OPTGROUP' && element.hasAttribute('label')) {
      const originalLabel = element.getAttribute('label');
      const translatedLabel = translateText(originalLabel, language);
      if (translatedLabel !== originalLabel) {
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
            node.textContent = node.textContent.replace(originalText, translatedText);
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Handle optgroup elements specifically
        if (node.tagName === 'OPTGROUP' && node.hasAttribute('label')) {
          const originalLabel = node.getAttribute('label');
          const translatedLabel = translateText(originalLabel, language);
          if (translatedLabel !== originalLabel) {
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
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          console.log(`👁️ MutationObserver detected ${mutation.addedNodes.length} added node(s)`);
          
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              console.log('  Added node:', node.tagName, node.className || '(no class)', (node.textContent || '').substring(0, 50));
              console.log('  Node ID:', node.id || '(no id)');
              console.log('  Node innerHTML length:', node.innerHTML?.length || 0);
              
              // Check if the added node contains optgroup elements
              const hasOptgroups = node.querySelectorAll && node.querySelectorAll('optgroup').length > 0;
              if (hasOptgroups) {
                console.log(`  🎯 Found ${node.querySelectorAll('optgroup').length} optgroups in added node!`);
                node.querySelectorAll('optgroup').forEach((og, i) => {
                  console.log(`     Optgroup ${i}: label="${og.getAttribute('label')}"`);
                });
              }
              
              // Check if the added node or its children contain upcart elements
              const containsUpcartText = node.textContent && /full price|subscription\s+plans/i.test(node.textContent);
              if (containsUpcartText) {
                console.log(`  🎯 Contains target text! Match: ${node.textContent.match(/full price|subscription\s+plans/i)?.[0]}`);
              }
              
              // Check for upcart-specific classes
              const hasUpcartClasses = node.className && (
                node.className.includes('upcart') || 
                node.className.includes('SubscriptionUpgradesModule')
              );
              if (hasUpcartClasses) {
                console.log(`  🎯 Has upcart classes!`);
              }
              
              console.log(`  Analysis: optgroups=${hasOptgroups}, upcartText=${containsUpcartText}, upcartClasses=${hasUpcartClasses}`);
              
              if (hasOptgroups || containsUpcartText || hasUpcartClasses) {
                console.log('✅ MutationObserver: Detected upcart content added, translating...');
                setTimeout(() => {
                  translateUpcartElements();
                }, 100); // Small delay to allow content to fully render
              } else {
                console.log('⏭️ MutationObserver: Node not upcart-related, skipping translation');
              }
            }
          });
        }
      });
    });

    // Start observing
    console.log('👁️ MutationObserver started, watching document.body for changes');
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Debug function to log what elements we find
  function debugUpcartElements() {
    console.log('=== UPCART DEBUG ===');
    console.log('Current language:', getCurrentLanguage());
    const roots = getAllRoots();
    console.log('Debug contexts (document + shadow roots + same-origin iframes):', roots.length);
    
    const upcartSelectors = [
      '.SubscriptionUpgradesModule_dropdown',
      '.SubscriptionUpgradesModule_dropdownWrapper',
      'select.upcart-subscription-upgrade-dropdown',
      'optgroup[label="Full price" i]',
      'optgroup[label="Subscription Plans" i]',
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
        const elements = queryAllInRoots(selector, roots);
        if (elements.length > 0) {
          console.log(`Found ${elements.length} elements with selector: ${selector}`);
          elements.forEach((el, index) => {
            if (index < 10) {
              console.log(`  Element ${index}:`, el);
              console.log('  Text content:', (el.textContent || '').substring(0, 200));
            }
          });
        }
      } catch (e) {
        console.warn('Invalid selector:', selector);
      }
    });

    // Also check for text containing our target strings
    const textElements = [];
    roots.forEach(function(root) {
      const els = Array.from(root.querySelectorAll('*')).filter(function(el) {
        const text = el.textContent || '';
        return /(^|\b)(Full price|Subscription\s+Plans)(\b|$)/i.test(text);
      });
      els.forEach(function(el) { if (!textElements.includes(el)) textElements.push(el); });
    });

    console.log('Elements containing upcart target text across contexts:', textElements.length);
    textElements.slice(0, 10).forEach(function(el, index) {
      console.log(`  Text element ${index}:`, el.tagName, el.className, (el.textContent || '').trim().substring(0, 200));
    });
    
    console.log('=== END UPCART DEBUG ===');
  }

  // -------- Helpers for shadow roots and iframes --------
  function getAllRoots() {
    const roots = [document];

    // Same-origin iframes
    document.querySelectorAll('iframe').forEach(function(iframe) {
      try {
        const doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
        if (doc) {
          roots.push(doc);
        }
      } catch (e) {
        // Cross-origin iframe; cannot access
      }
    });

    // Collect open shadow roots recursively within each root
    function collectShadowRoots(root) {
      try {
        const all = root.querySelectorAll('*');
        all.forEach(function(el) {
          if (el.shadowRoot) {
            roots.push(el.shadowRoot);
            collectShadowRoots(el.shadowRoot);
          }
        });
      } catch (e) {
        // ignore
      }
    }

    // Start collection for each current root (document + iframes)
    roots.slice().forEach(function(r) { collectShadowRoots(r); });

    return roots;
  }

  function queryAllInRoots(selector, roots) {
    const results = [];
    roots.forEach(function(root) {
      try {
        root.querySelectorAll(selector).forEach(function(el) { results.push(el); });
      } catch (e) {
        // ignore invalid selectors per root
      }
    });
    return results;
  }

  function replaceTextNodesGlobally(language, roots) {
    const targets = Object.keys(translations);
    const regex = new RegExp(`\\b(${targets.map(function(t) { return t.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&'); }).join('|')})\\b`, 'gi');

    roots.forEach(function(root) {
      try {
        const walker = root.createTreeWalker(root instanceof Document || root instanceof ShadowRoot ? root : document, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          const original = node.nodeValue || '';
          if (regex.test(original)) {
            const replaced = original.replace(regex, function(match) { return translateText(match, language); });
            if (replaced !== original) {
              node.nodeValue = replaced;
            }
          }
        }
      } catch (e) {
        // some roots may not allow createTreeWalker
      }
    });
  }

  // Initial translation attempt
  setTimeout(() => {
    translateUpcartElements();
  }, 500); // Give upcart time to load

  setTimeout(() => {
    translateUpcartElements();
  }, 2000);

  setTimeout(() => {
    translateUpcartElements();
  }, 5000);

  // Set up observer for dynamic content
  setupMutationObserver();

  // Also translate when upcart events fire (if any)
  document.addEventListener('click', function(event) {
    const target = event.target;
    
    // Check if clicked element might open cart/drawer
    const cartTriggers = [
      '[data-cart-drawer-toggle]',
      '.cart-count-bubble',
      '[href*="cart"]',
      '.cart-drawer-toggle',
      '.header__icon--cart',
      // Upcart subscription upgrade entry point (div, not button)
      '.upcart-subscription-upgrade-button',
      // Upcart popup trigger - the actual element that gets clicked
      '#upCart'
    ];
    
    // Check each selector individually
    let matchedSelector = null;
    for (let selector of cartTriggers) {
      if (target.matches(selector) || target.closest(selector)) {
        matchedSelector = selector;
        break;
      }
    }
    
    if (matchedSelector) {
      // Multiple delayed attempts since cart content loads progressively
      [200, 500, 1000, 2000, 3000, 5000].forEach(delay => {
        setTimeout(() => {
          translateUpcartElements();
        }, delay);
      });
    }
    
    // Re-translate after any button clicks that might trigger upcart updates
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

  // Expose debug functions globally for manual testing
  window.debugUpcart = function() {
    debugUpcartElements();
    translateUpcartElements();
  };

  window.forceUpcartTranslation = function() {
    translateUpcartElements();
  };

  // Quick test function to check optgroups directly
  window.testOptgroups = function() {
    const optgroups = document.querySelectorAll('optgroup');
    
    // Try direct translation
    optgroups.forEach(og => {
      const label = og.getAttribute('label');
      if (label === 'Full price') {
        og.setAttribute('label', 'Kertaostos');
      }
      if (label === 'Subscription plans') {
        og.setAttribute('label', 'Kestotilaus');
      }
    });
  };
});
