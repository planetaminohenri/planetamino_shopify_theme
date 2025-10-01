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

    console.log(`🔍 Starting translation for language: ${currentLanguage}`);

    // Gather all searchable roots (document, shadow roots, and same-origin iframes)
    const roots = getAllRoots();
    console.log(`🔍 Search contexts: ${roots.length} (document + shadow roots + same-origin iframes)`);

    // Directly target optgroup elements first across all roots
    const optgroups = queryAllInRoots('optgroup', roots);
    console.log(`🔍 Found ${optgroups.length} optgroup elements total across all contexts`);
    
    optgroups.forEach((optgroup, index) => {
      const label = optgroup.getAttribute('label');
      console.log(`🔍 Optgroup ${index}: label="${label}"`);
      
      if (label && ['full price', 'subscription plans'].includes(label.toLowerCase())) {
        const translatedLabel = translateText(label, currentLanguage);
        if (translatedLabel !== label) {
          console.log(`✅ Translating optgroup label: "${label}" -> "${translatedLabel}"`);
          optgroup.setAttribute('label', translatedLabel);
        } else {
          console.log(`❌ No translation found for: "${label}"`);
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
        console.log(`🔍 Selector "${selector}" found ${elements.length} elements across contexts`);
        upcartElements = upcartElements.concat(Array.from(elements));
      } catch (e) {
        console.warn('Invalid selector:', selector);
      }
    });

    // Translate text in found elements
    console.log(`🔍 Processing ${upcartElements.length} additional upcart elements`);
    upcartElements.forEach((element, index) => {
      console.log(`🔍 Processing element ${index}:`, element.tagName, element.className);
      translateElementText(element, currentLanguage);
    });

    // Fallback: if nothing matched, scan the whole document for our two strings
    if (optgroups.length === 0 && upcartElements.length === 0) {
      console.log('🛟 Fallback: scanning entire document for target texts');
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
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          console.log(`👁️ MutationObserver detected ${mutation.addedNodes.length} added node(s)`);
          
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              console.log('  Added node:', node.tagName, node.className || '(no class)', (node.textContent || '').substring(0, 50));
              
              // Check if the added node contains optgroup elements
              const hasOptgroups = node.querySelectorAll && node.querySelectorAll('optgroup').length > 0;
              
              // Check if the added node or its children contain upcart elements
              const containsUpcartText = node.textContent && /full price|subscription\s+plans/i.test(node.textContent);
              
              // Check for upcart-specific classes
              const hasUpcartClasses = node.className && (
                node.className.includes('upcart') || 
                node.className.includes('SubscriptionUpgradesModule')
              );
              
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
        console.log('⚠️ Cross-origin iframe, skipping:', iframe.src || '(no src)');
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
  console.log('🔍 Upcart Translation Script Loaded - Starting in 500ms...');
  setTimeout(() => {
    console.log('🔍 First attempt (500ms delay):');
    debugUpcartElements(); // Add debug first
    translateUpcartElements();
  }, 500); // Give upcart time to load

  // Also debug after longer delay in case upcart loads slowly
  setTimeout(() => {
    console.log('🔍 Second attempt (2000ms delay):');
    debugUpcartElements();
    translateUpcartElements();
  }, 2000);

  // Add even longer delay for very slow loading
  setTimeout(() => {
    console.log('🔍 Third attempt (5000ms delay):');
    debugUpcartElements();
    translateUpcartElements();
  }, 5000);

  // Set up observer for dynamic content
  setupMutationObserver();

  // Also translate when upcart events fire (if any)
  document.addEventListener('click', function(event) {
    const target = event.target;
    
    console.log('🖱️ Click detected on:', target.tagName, target.className, target.textContent?.substring(0, 50));
    console.log('   Element details:', {
      id: target.id,
      classList: Array.from(target.classList || []),
      innerHTML: target.innerHTML?.substring(0, 100)
    });
    
    // Log parent elements to help identify the structure
    let parent = target.parentElement;
    for (let i = 0; i < 3 && parent; i++) {
      console.log(`   Parent ${i+1}:`, parent.tagName, parent.className, Array.from(parent.classList || []));
      parent = parent.parentElement;
    }
    
    // Check if clicked element might open cart/drawer
    const cartTriggers = [
      '[data-cart-drawer-toggle]',
      '.cart-count-bubble',
      '[href*="cart"]',
      '.cart-drawer-toggle',
      '.header__icon--cart',
      // Upcart subscription upgrade entry point (div, not button)
      '.upcart-subscription-upgrade-button'
    ];
    
    // Check each selector individually for debugging
    let matchedSelector = null;
    for (let selector of cartTriggers) {
      if (target.matches(selector) || target.closest(selector)) {
        matchedSelector = selector;
        break;
      }
    }
    
    if (matchedSelector) {
      console.log(`✅ Cart trigger matched: ${matchedSelector}`);
      console.log('🛒 Cart trigger clicked, will check for upcart content...');
      console.log('Target element:', target);
      console.log('Closest match:', target.closest(matchedSelector));
      
      // Multiple delayed attempts since cart content loads progressively
      [200, 500, 1000, 2000, 3000, 5000].forEach(delay => {
        setTimeout(() => {
          // We now query across roots, so simply trigger translation
          console.log(`🔄 Running translation pass after ${delay}ms due to cart/upgrade trigger`);
          console.log(`🔍 Checking for new DOM roots after ${delay}ms...`);
          const roots = getAllRoots();
          console.log(`   Found ${roots.length} roots at ${delay}ms delay`);
          debugUpcartElements();
          translateUpcartElements();
        }, delay);
      });
    } else {
      console.log('❌ No cart trigger selector matched for this click');
    }
    
    // Re-translate after any button clicks that might trigger upcart updates
    if (target.matches('button') || target.closest('button')) {
      setTimeout(() => {
        console.log('🔄 Button clicked; running translation pass');
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
    console.log('🔧 Manual debug triggered:');
    debugUpcartElements();
    translateUpcartElements();
  };

  window.forceUpcartTranslation = function() {
    console.log('🔧 Force translation triggered:');
    translateUpcartElements();
  };

  // Quick test function to check optgroups directly
  window.testOptgroups = function() {
    console.log('🧪 Testing optgroups directly:');
    const optgroups = document.querySelectorAll('optgroup');
    console.log(`Found ${optgroups.length} optgroups:`);
    optgroups.forEach((og, i) => {
      console.log(`${i}: label="${og.getAttribute('label')}" parent=${og.parentElement.tagName}.${og.parentElement.className}`);
    });
    
    // Try direct translation
    optgroups.forEach(og => {
      const label = og.getAttribute('label');
      if (label === 'Full price') {
        og.setAttribute('label', 'Kertaostos');
        console.log('✅ Manually set Full price -> Kertaostos');
      }
      if (label === 'Subscription plans') {
        og.setAttribute('label', 'Kestotilaus');
        console.log('✅ Manually set Subscription plans -> Kestotilaus');
      }
    });
  };
});
