/**
 * Custom Bundle Builder
 * Handles Power Cookie bundle customization with Bundler.app and Seal Subscriptions integration
 */

(function() {
  'use strict';

  // Namespace for the bundle builder
  window.CustomBundleBuilder = window.CustomBundleBuilder || {};

  // Configuration defaults
  const CONFIG = {
    // Default bulk discount tiers (percentage off)
    // Will be overridden by data attributes from Liquid
    defaultBulkDiscounts: [
      { min: 40, discountPercent: 18 },
      { min: 20, discountPercent: 10 },
      { min: 5, discountPercent: 0 },
      { min: 0, discountPercent: 0 }
    ],
    
    // Default subscription discount (will be fetched from Seal if available)
    defaultSubscriptionDiscount: 0.10, // 10%
    
    // Minimum items required
    minItems: 1
  };

  /**
   * Bundle Builder Class
   */
  class BundleBuilder {
    constructor(containerId) {
      this.container = document.getElementById(containerId);
      if (!this.container) {
        console.error('Bundle builder container not found:', containerId);
        return;
      }

      // State
      this.selections = {};
      this.isSubscription = false;
      this.subscriptionDiscount = CONFIG.defaultSubscriptionDiscount;
      this.deliveryFrequency = null;
      this.bulkDiscounts = this.parseBulkDiscounts();
      
      // DOM elements
      this.flavorCards = this.container.querySelectorAll('.flavor-card');
      this.subscriptionOptions = this.container.querySelectorAll('.subscription-option input[type="radio"]');
      this.addToCartBtn = this.container.querySelector('.bundle-add-to-cart');
      this.totalQuantityEl = this.container.querySelector('.total-quantity');
      this.finalPriceEl = this.container.querySelector('.final-price');
      this.originalPriceEl = this.container.querySelector('.original-price');
      this.pricingHelpText = this.container.querySelector('.pricing-help-text');
      this.errorMessageEl = this.container.querySelector('.bundle-error-message');
      this.deliveryFrequencySelector = this.container.querySelector('.delivery-frequency-selector');
      this.deliveryFrequencySelect = this.container.querySelector('.delivery-frequency-select');
      this.subscriptionInfoBox = this.container.querySelector('.subscription-info-box');
      
      // Initialize
      this.init();
    }

    init() {
      this.bindEvents();
      this.fetchSubscriptionDiscount();
      this.updateUI();
    }

    /**
     * Attempt to fetch discount configuration from Bundler.app
     * Returns null if Bundler data is not available
     */
    fetchFromBundlerApp() {
      try {
        // Method 1: Check for Bundler window object
        if (window.Bundler && window.Bundler.config) {
          console.log('🔍 Found Bundler window config:', window.Bundler.config);
          return this.parseBundlerConfig(window.Bundler.config);
        }

        // Method 2: Check for Bundler elements with data attributes
        const bundlerElements = document.querySelectorAll('[data-shortcode], [data-bndlr-config], .bundler-target-element');
        for (const element of bundlerElements) {
          const config = element.dataset.bundlerConfig || element.dataset.bndlrConfig;
          if (config) {
            console.log('🔍 Found Bundler config in DOM:', config);
            return this.parseBundlerConfig(JSON.parse(config));
          }
        }

        // Method 3: Check for script tags with Bundler configuration
        const scripts = document.querySelectorAll('script[type="application/json"]');
        for (const script of scripts) {
          try {
            const data = JSON.parse(script.textContent);
            if (data.bundler || data.bundlerConfig) {
              console.log('🔍 Found Bundler config in script tag:', data);
              return this.parseBundlerConfig(data.bundler || data.bundlerConfig);
            }
          } catch (e) {
            // Not valid JSON or not Bundler config
          }
        }

        console.log('⚠️ No Bundler.app configuration found in DOM');
        return null;
      } catch (error) {
        console.error('Error fetching from Bundler.app:', error);
        return null;
      }
    }

    /**
     * Parse Bundler config object to extract discount tiers
     * This is speculative - the actual format depends on Bundler.app's implementation
     */
    parseBundlerConfig(config) {
      // Try to find discount/tier configuration in common locations
      if (config.discountTiers) {
        return config.discountTiers.map(tier => ({
          min: tier.quantity || tier.min,
          discountPercent: tier.discount || tier.discountPercent
        }));
      }
      if (config.tiers) {
        return config.tiers.map(tier => ({
          min: tier.quantity || tier.min,
          discountPercent: tier.discount || tier.discountPercent
        }));
      }
      return null;
    }

    /**
     * Parse bulk discount configuration from data attribute
     * Format: "minQty:discountPercent,minQty:discountPercent"
     * Example: "5:0,20:10,40:18" means 5+ = 0% off, 20+ = 10% off, 40+ = 18% off
     */
    parseBulkDiscounts() {
      // FIRST: Try to fetch from Bundler.app if available
      const bundlerDiscounts = this.fetchFromBundlerApp();
      if (bundlerDiscounts && bundlerDiscounts.length > 0) {
        console.log('✅ Using discount tiers from Bundler.app:', bundlerDiscounts);
        bundlerDiscounts.sort((a, b) => b.min - a.min);
        return bundlerDiscounts;
      }

      // SECOND: Try to get from data attribute (metafield or manual configuration)
      const bulkDiscountsAttr = this.container.dataset.bulkDiscounts;
      
      if (!bulkDiscountsAttr) {
        console.log('📋 No bulk discounts configured, using defaults');
        return CONFIG.defaultBulkDiscounts;
      }

      try {
        const discounts = bulkDiscountsAttr.split(',').map(tier => {
          const [min, discountPercent] = tier.split(':').map(val => parseFloat(val.trim()));
          return { min, discountPercent };
        });

        // Sort by minimum quantity (descending) for proper tier matching
        discounts.sort((a, b) => b.min - a.min);
        
        console.log('✅ Parsed bulk discounts from data attribute:', discounts);
        return discounts;
      } catch (error) {
        console.error('Error parsing bulk discounts:', error);
        return CONFIG.defaultBulkDiscounts;
      }
    }

    /**
     * Bind all event listeners
     */
    bindEvents() {
      // Flavor card interactions
      this.flavorCards.forEach(card => {
        const addBtn = card.querySelector('.flavor-add-btn');
        const minusBtn = card.querySelector('.qty-minus');
        const plusBtn = card.querySelector('.qty-plus');
        const qtyInput = card.querySelector('.qty-input');

        if (addBtn) {
          addBtn.addEventListener('click', () => this.handleAddClick(card));
        }

        if (minusBtn) {
          minusBtn.addEventListener('click', () => this.handleQuantityChange(card, -1));
        }

        if (plusBtn) {
          plusBtn.addEventListener('click', () => this.handleQuantityChange(card, 1));
        }

        if (qtyInput) {
          // Handle typing in the input field - update state and UI live
          qtyInput.addEventListener('input', (e) => {
            const value = parseInt(e.target.value) || 0;
            const variantId = card.dataset.variantId;
            
            // Update internal state
            if (value > 0) {
              this.selections[variantId] = value;
            } else {
              delete this.selections[variantId];
            }
            
            // Update UI live as user types
            this.updateUI();
          });
          
          // Handle blur (when user clicks away) - clean up the value
          qtyInput.addEventListener('blur', (e) => {
            const value = parseInt(e.target.value) || 0;
            this.setQuantity(card, value);
          });
          
          // Handle Enter key - blur to finalize the value
          qtyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
              e.target.blur();
            }
          });
          
          // Handle change event for compatibility
          qtyInput.addEventListener('change', (e) => {
            const value = parseInt(e.target.value) || 0;
            this.setQuantity(card, value);
          });
        }
      });

      // Subscription toggle
      this.subscriptionOptions.forEach(option => {
        option.addEventListener('change', () => {
          this.isSubscription = option.value === 'subscribe';
          this.toggleSubscriptionElements();
          this.updateUI();
        });
      });
      
      // Delivery frequency selector
      if (this.deliveryFrequencySelect) {
        this.deliveryFrequencySelect.addEventListener('change', (e) => {
          this.deliveryFrequency = e.target.value;
          this.updateUI();
        });
      }

      // Add to cart button
      if (this.addToCartBtn) {
        this.addToCartBtn.addEventListener('click', () => this.handleAddToCart());
      }
    }

    /**
     * Toggle subscription-related UI elements
     */
    toggleSubscriptionElements() {
      if (this.deliveryFrequencySelector) {
        this.deliveryFrequencySelector.style.display = this.isSubscription ? 'block' : 'none';
      }
      
      if (this.subscriptionInfoBox) {
        this.subscriptionInfoBox.style.display = this.isSubscription ? 'block' : 'none';
      }
      
      // Reset delivery frequency when switching to one-time
      if (!this.isSubscription) {
        this.deliveryFrequency = null;
        if (this.deliveryFrequencySelect) {
          this.deliveryFrequencySelect.value = '';
        }
      }
    }

    /**
     * Handle "Add" button click
     */
    handleAddClick(card) {
      const addBtn = card.querySelector('.flavor-add-btn');
      const qtySelector = card.querySelector('.flavor-quantity-selector');
      
      if (addBtn && qtySelector) {
        addBtn.style.display = 'none';
        qtySelector.style.display = 'flex';
        
        // Set initial quantity to 1
        this.setQuantity(card, 1);
      }
    }

    /**
     * Handle quantity change (+ or -)
     */
    handleQuantityChange(card, delta) {
      const variantId = card.dataset.variantId;
      const currentQty = this.selections[variantId] || 0;
      const newQty = Math.max(0, currentQty + delta);
      
      this.setQuantity(card, newQty);
    }

    /**
     * Set quantity for a flavor
     */
    setQuantity(card, quantity) {
      const variantId = card.dataset.variantId;
      const qtyInput = card.querySelector('.qty-input');
      const addBtn = card.querySelector('.flavor-add-btn');
      const qtySelector = card.querySelector('.flavor-quantity-selector');
      
      quantity = Math.max(0, parseInt(quantity) || 0);
      
      // Update state
      if (quantity > 0) {
        this.selections[variantId] = quantity;
      } else {
        delete this.selections[variantId];
      }
      
      // Update input
      if (qtyInput) {
        qtyInput.value = quantity;
      }
      
      // Toggle between add button and quantity selector
      if (quantity === 0 && addBtn && qtySelector) {
        addBtn.style.display = 'block';
        qtySelector.style.display = 'none';
      }
      
      this.updateUI();
    }

    /**
     * Calculate total quantity
     */
    getTotalQuantity() {
      return Object.values(this.selections).reduce((sum, qty) => sum + qty, 0);
    }

    /**
     * Get bulk discount percentage based on total quantity
     */
    getBulkDiscountPercent(totalQty) {
      for (const tier of this.bulkDiscounts) {
        if (totalQty >= tier.min) {
          return tier.discountPercent;
        }
      }
      return 0;
    }

    /**
     * Calculate total price using actual Shopify variant prices + bulk discount + subscription discount
     */
    calculateTotal() {
      const totalQty = this.getTotalQuantity();
      const bulkDiscountPercent = this.getBulkDiscountPercent(totalQty);
      
      let subtotal = 0;
      
      // Calculate subtotal using actual Shopify variant prices
      this.flavorCards.forEach(card => {
        const variantId = card.dataset.variantId;
        const quantity = this.selections[variantId];
        
        if (quantity && quantity > 0) {
          const basePrice = parseFloat(card.dataset.price);
          if (basePrice) {
            subtotal += basePrice * quantity;
          }
        }
      });
      
      // Apply bulk discount
      let total = subtotal;
      if (bulkDiscountPercent > 0) {
        total = subtotal * (1 - bulkDiscountPercent / 100);
      }
      
      const afterBulkDiscount = total;
      
      // Apply subscription discount
      if (this.isSubscription) {
        total = total * (1 - this.subscriptionDiscount);
      }
      
      return {
        total: total,
        originalTotal: subtotal,
        afterBulkDiscount: afterBulkDiscount,
        bulkDiscountPercent: bulkDiscountPercent,
        quantity: totalQty
      };
    }

    /**
     * Update UI with current state
     */
    updateUI() {
      const totals = this.calculateTotal();
      
      // Update quantity display
      if (this.totalQuantityEl) {
        this.totalQuantityEl.textContent = totals.quantity;
      }
      
      // Update price display
      if (this.finalPriceEl) {
        this.finalPriceEl.textContent = `€${totals.total.toFixed(2)}`;
      }
      
      // Show original price if subscription is active
      if (this.originalPriceEl && this.isSubscription && totals.total !== totals.originalTotal) {
        this.originalPriceEl.textContent = `€${totals.originalTotal.toFixed(2)}`;
        this.originalPriceEl.style.display = 'inline';
      } else if (this.originalPriceEl) {
        this.originalPriceEl.style.display = 'none';
      }
      
      // Update help text for bulk discount tiers
      if (this.pricingHelpText) {
        const nextTier = this.getNextDiscountTier(totals.quantity);
        if (nextTier && nextTier.discountPercent > totals.bulkDiscountPercent) {
          const needed = nextTier.min - totals.quantity;
          const additionalDiscount = nextTier.discountPercent - totals.bulkDiscountPercent;
          this.pricingHelpText.textContent = `Add ${needed} more to save an extra ${additionalDiscount}%`;
          this.pricingHelpText.style.display = 'block';
        } else {
          this.pricingHelpText.style.display = 'none';
        }
      }
      
      // Update "Add" button prices with current discounts
      this.updateAddButtonPrices();
      
      // Enable/disable add to cart button
      if (this.addToCartBtn) {
        const hasMinItems = totals.quantity >= CONFIG.minItems;
        const hasFrequency = !this.isSubscription || this.deliveryFrequency;
        const canAddToCart = hasMinItems && hasFrequency;
        
        this.addToCartBtn.disabled = !canAddToCart;
        
        if (!canAddToCart) {
          this.addToCartBtn.classList.add('disabled');
        } else {
          this.addToCartBtn.classList.remove('disabled');
        }
      }
    }

    /**
     * Get the next available bulk discount tier
     */
    getNextDiscountTier(currentQty) {
      for (const tier of this.bulkDiscounts) {
        if (currentQty < tier.min) {
          return tier;
        }
      }
      return null;
    }

    /**
     * Update all "Add" button prices with current discounts (bulk + subscription)
     */
    updateAddButtonPrices() {
      const currentQty = this.getTotalQuantity();
      
      // Calculate what the bulk discount would be if we added one more item
      const nextQty = currentQty + 1;
      const bulkDiscountPercent = this.getBulkDiscountPercent(nextQty);
      
      this.flavorCards.forEach(card => {
        const addBtn = card.querySelector('.flavor-add-btn');
        const priceValueEl = addBtn ? addBtn.querySelector('.price-value') : null;
        
        if (priceValueEl) {
          // Get the actual Shopify variant price from the card data
          const basePrice = parseFloat(card.dataset.price) || parseFloat(addBtn.dataset.price);
          
          if (!basePrice) {
            console.warn('No base price found for variant');
            return;
          }
          
          // Apply bulk discount
          let finalPrice = basePrice;
          if (bulkDiscountPercent > 0) {
            finalPrice = basePrice * (1 - bulkDiscountPercent / 100);
          }
          
          // Apply subscription discount if active
          if (this.isSubscription) {
            finalPrice = finalPrice * (1 - this.subscriptionDiscount);
          }
          
          // Update the price display
          priceValueEl.textContent = finalPrice.toFixed(2);
        }
      });
    }

    /**
     * Fetch subscription discount from Seal Subscriptions
     */
    async fetchSubscriptionDiscount() {
      // Try to fetch from Seal Subscriptions widget if present
      try {
        const sealContainer = document.querySelector('.sealsubs-container');
        if (sealContainer) {
          const discountEl = sealContainer.querySelector('[data-discount-percentage]');
          if (discountEl) {
            const discount = parseFloat(discountEl.dataset.discountPercentage);
            if (!isNaN(discount)) {
              this.subscriptionDiscount = discount / 100;
              
              // Update the save badge text
              const saveBadge = this.container.querySelector('.save-badge');
              if (saveBadge) {
                saveBadge.textContent = `SAVE ${Math.round(discount)}%`;
              }
            }
          }
        }
      } catch (error) {
        console.warn('Could not fetch subscription discount:', error);
      }
    }

    /**
     * Handle add to cart
     */
    async handleAddToCart() {
      if (this.getTotalQuantity() < CONFIG.minItems) {
        this.showError(`Please select at least ${CONFIG.minItems} cookie(s)`);
        return;
      }
      
      // Validate delivery frequency for subscriptions
      if (this.isSubscription && !this.deliveryFrequency) {
        this.showError('Please select a delivery frequency');
        return;
      }

      this.addToCartBtn.disabled = true;
      this.addToCartBtn.textContent = 'Adding...';

      try {
        await this.addBundleToCart();
        
        // Success - update cart drawer/notification
        this.addToCartBtn.textContent = 'Added!';
        setTimeout(() => {
          this.addToCartBtn.textContent = 'Add to cart';
          this.addToCartBtn.disabled = false;
        }, 2000);
        
        // Trigger cart update event
        document.dispatchEvent(new CustomEvent('cart:update'));
        
        // Open cart drawer if available
        const cartDrawer = document.querySelector('cart-drawer');
        if (cartDrawer && typeof cartDrawer.open === 'function') {
          cartDrawer.open();
        }
        
      } catch (error) {
        console.error('Error adding to cart:', error);
        this.showError('Failed to add to cart. Please try again.');
        this.addToCartBtn.textContent = 'Add to cart';
        this.addToCartBtn.disabled = false;
      }
    }

    /**
     * Add bundle to cart using Shopify Cart API
     */
    async addBundleToCart() {
      const items = [];
      
      // Build cart items array
      this.flavorCards.forEach(card => {
        const variantId = card.dataset.variantId;
        const quantity = this.selections[variantId];
        
        if (quantity && quantity > 0) {
          const item = {
            id: parseInt(variantId),
            quantity: parseInt(quantity),
            properties: {
              '_bundle': 'power-cookie'
            }
          };
          
          // Add subscription properties if subscription is selected
          if (this.isSubscription) {
            const sellingPlanId = this.getSellingPlanId();
            console.log('🔍 [Bundle Builder] Subscription selected, selling plan ID:', sellingPlanId);
            if (sellingPlanId) {
              item.selling_plan = parseInt(sellingPlanId);
              console.log('✅ [Bundle Builder] Added selling plan to item:', item);
            } else {
              console.warn('⚠️ [Bundle Builder] No selling plan ID found for subscription');
            }
          }
          
          items.push(item);
        }
      });
      
      if (items.length === 0) {
        throw new Error('No items selected');
      }
      
      console.log('🛒 [Cart] Adding items to cart:', items);
      
      // Check if UpCart is active
      const isUpCartActive = !!(
        window.UpCart ||
        window.upcart ||
        window.Upcart ||
        document.querySelector('script[src*="upcart"]') ||
        document.querySelector('link[href*="upcart"]')
      );
      
      console.log('🛒 [Cart] UpCart active:', isUpCartActive);
      
      // Get cart drawer/notification for section updates
      const cart = !isUpCartActive && (document.querySelector('cart-notification') || document.querySelector('cart-drawer'));
      console.log('🛒 [Cart] Cart drawer found:', !!cart);
      
      // Build FormData for UpCart compatibility
      const formData = new FormData();
      items.forEach((item, index) => {
        console.log(`🛒 [Cart] Adding item ${index}:`, item);
        formData.append(`items[${index}][id]`, item.id);
        formData.append(`items[${index}][quantity]`, item.quantity);
        
        if (item.selling_plan) {
          console.log(`✅ [Cart] Adding selling_plan to item ${index}:`, item.selling_plan);
          formData.append(`items[${index}][selling_plan]`, item.selling_plan);
        } else if (this.isSubscription) {
          console.warn(`⚠️ [Cart] Subscription active but no selling_plan for item ${index}`);
        }
        
        if (item.properties) {
          Object.entries(item.properties).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              formData.append(`items[${index}][properties][${key}]`, String(value));
            }
          });
        }
      });
      
      // Log FormData contents
      console.log('🛒 [Cart] FormData contents:');
      for (let pair of formData.entries()) {
        console.log('  ', pair[0], '=', pair[1]);
      }
      
      // Prepare sections for cart drawer update
      let url = '/cart/add';
      if (!isUpCartActive && cart && typeof cart.getSectionsToRender === 'function') {
        const sections = cart.getSectionsToRender().map((section) => section.id).join(',');
        const sectionsUrl = window.location.pathname;
        url += `?sections=${encodeURIComponent(sections)}&sections_url=${encodeURIComponent(sectionsUrl)}`;
      }
      
      // Add to cart
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData
      });
      
      // Retry without sections param if it fails (some apps don't support it)
      if (!response.ok && response.status === 400 && url.includes('sections=')) {
        const retryResponse = await fetch('/cart/add', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
          },
          body: formData
        });
        
        if (!retryResponse.ok) {
          const errorText = await retryResponse.text();
          throw new Error(errorText || 'Failed to add to cart');
        }
        
        return await retryResponse.json();
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to add to cart');
      }
      
      const data = await response.json();
      
      // Update cart drawer if present
      if (!isUpCartActive && cart && data.sections) {
        cart.renderContents(data);
      }
      
      return data;
    }

    /**
     * Get Seal Subscriptions selling plan ID based on delivery frequency
     */
    getSellingPlanId() {
      if (!this.isSubscription || !this.deliveryFrequency) {
        console.log('🔍 [Selling Plan] Not subscription or no frequency:', { 
          isSubscription: this.isSubscription, 
          frequency: this.deliveryFrequency 
        });
        return null;
      }
      
      console.log('🔍 [Selling Plan] Looking for selling plan for', this.deliveryFrequency, 'weeks');
      
      // Method 1: Try to get from Seal widget
      const sealWidget = document.querySelector('.sealsubs-container');
      console.log('🔍 [Selling Plan] Seal widget found:', !!sealWidget);
      
      if (sealWidget) {
        // Try to find a selling plan that matches the selected frequency
        const allPlans = sealWidget.querySelectorAll('input[name="selling_plan"]');
        console.log('🔍 [Selling Plan] Found', allPlans.length, 'selling plan inputs');
        
        for (const plan of allPlans) {
          const label = plan.closest('label') || plan.nextElementSibling;
          const labelText = label ? label.textContent : '';
          console.log('🔍 [Selling Plan] Checking plan:', { value: plan.value, label: labelText });
          
          if (labelText.includes(`${this.deliveryFrequency} week`)) {
            console.log('✅ [Selling Plan] Found matching plan by frequency:', plan.value);
            return plan.value;
          }
        }
        
        // Try matching by data attribute
        for (const plan of allPlans) {
          if (plan.dataset.frequency && plan.dataset.frequency === this.deliveryFrequency) {
            console.log('✅ [Selling Plan] Found matching plan by data-frequency:', plan.value);
            return plan.value;
          }
        }
        
        // Fallback: get first available plan
        if (allPlans.length > 0) {
          const firstPlan = allPlans[0];
          console.log('⚠️ [Selling Plan] Using first available plan:', firstPlan.value);
          return firstPlan.value;
        }
      }
      
      // Method 2: Look in product JSON on the page
      const productScripts = document.querySelectorAll('script[type="application/json"]');
      for (const script of productScripts) {
        try {
          const data = JSON.parse(script.textContent);
          if (data.selling_plan_groups && data.selling_plan_groups.length > 0) {
            console.log('🔍 [Selling Plan] Found selling plans in product JSON');
            
            for (const group of data.selling_plan_groups) {
              if (group.selling_plans) {
                for (const plan of group.selling_plans) {
                  console.log('🔍 [Selling Plan] Checking plan:', plan);
                  
                  // Match by name containing frequency
                  if (plan.name && plan.name.toLowerCase().includes(`${this.deliveryFrequency} week`)) {
                    console.log('✅ [Selling Plan] Found matching plan in JSON:', plan.id);
                    return plan.id;
                  }
                }
                
                // Fallback to first plan
                if (group.selling_plans.length > 0) {
                  console.log('⚠️ [Selling Plan] Using first plan from JSON:', group.selling_plans[0].id);
                  return group.selling_plans[0].id;
                }
              }
            }
          }
        } catch (e) {
          // Not a product JSON, continue
        }
      }
      
      // Method 3: Check window objects
      if (window.ShopifyAnalytics && window.ShopifyAnalytics.meta && window.ShopifyAnalytics.meta.product) {
        const sellingPlanGroups = window.ShopifyAnalytics.meta.product.selling_plan_groups;
        if (sellingPlanGroups && sellingPlanGroups.length > 0) {
          console.log('🔍 [Selling Plan] Found selling plans in ShopifyAnalytics');
          
          for (const group of sellingPlanGroups) {
            if (group.selling_plans) {
              for (const plan of group.selling_plans) {
                if (plan.name && plan.name.includes(`${this.deliveryFrequency} week`)) {
                  console.log('✅ [Selling Plan] Found matching plan in analytics:', plan.id);
                  return plan.id;
                }
              }
              
              if (group.selling_plans.length > 0) {
                console.log('⚠️ [Selling Plan] Using first plan from analytics:', group.selling_plans[0].id);
                return group.selling_plans[0].id;
              }
            }
          }
        }
      }
      
      // Final fallback - log warning and return null
      console.error('❌ [Selling Plan] Could not find any selling plan ID for frequency:', this.deliveryFrequency);
      return null;
    }

    /**
     * Show error message
     */
    showError(message) {
      if (this.errorMessageEl) {
        this.errorMessageEl.textContent = message;
        this.errorMessageEl.style.display = 'block';
        
        setTimeout(() => {
          this.errorMessageEl.style.display = 'none';
        }, 5000);
      }
    }
  }

  /**
   * Initialize a bundle builder instance
   */
  window.CustomBundleBuilder.init = function(containerId) {
    return new BundleBuilder(containerId);
  };

})();

