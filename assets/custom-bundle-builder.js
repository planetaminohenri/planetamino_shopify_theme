/**
 * Custom Bundle Builder
 * Handles Power Cookie bundle customization with Bundler.app and Seal Subscriptions integration
 */

(function() {
  'use strict';

  // Namespace for the bundle builder
  window.CustomBundleBuilder = window.CustomBundleBuilder || {};

  // Configuration
  const CONFIG = {
    // Tiered pricing structure (price per cookie based on quantity)
    priceTiers: [
      { min: 40, price: 2.29 },
      { min: 20, price: 2.49 },
      { min: 5, price: 2.79 },
      { min: 0, price: 2.79 }
    ],
    
    // Subscription discount (will be fetched from Seal if available)
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
          // Handle typing in the input field
          qtyInput.addEventListener('input', (e) => {
            const value = parseInt(e.target.value) || 0;
            const variantId = card.dataset.variantId;
            
            // Update internal state without triggering full UI update yet
            if (value > 0) {
              this.selections[variantId] = value;
            } else {
              delete this.selections[variantId];
            }
          });
          
          // Handle blur (when user clicks away or presses Enter)
          qtyInput.addEventListener('blur', (e) => {
            const value = parseInt(e.target.value) || 0;
            this.setQuantity(card, value);
          });
          
          // Handle Enter key
          qtyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
              e.target.blur(); // Trigger blur event
            }
          });
          
          // Handle change event for compatibility
          qtyInput.addEventListener('change', (e) => {
            const value = parseInt(e.target.value) || 0;
            this.setQuantity(card, value);
          });
          
          // Live update totals as user types
          qtyInput.addEventListener('input', () => {
            this.updateUI();
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
     * Get price per cookie based on total quantity
     */
    getPricePerCookie(totalQty) {
      for (const tier of CONFIG.priceTiers) {
        if (totalQty >= tier.min) {
          return tier.price;
        }
      }
      return CONFIG.priceTiers[CONFIG.priceTiers.length - 1].price;
    }

    /**
     * Calculate total price
     */
    calculateTotal() {
      const totalQty = this.getTotalQuantity();
      const pricePerCookie = this.getPricePerCookie(totalQty);
      let total = totalQty * pricePerCookie;
      
      const originalTotal = total;
      
      // Apply subscription discount
      if (this.isSubscription) {
        total = total * (1 - this.subscriptionDiscount);
      }
      
      return {
        total: total,
        originalTotal: originalTotal,
        pricePerCookie: pricePerCookie,
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
      
      // Update help text for tiered pricing
      if (this.pricingHelpText) {
        const nextTier = this.getNextPriceTier(totals.quantity);
        if (nextTier) {
          const needed = nextTier.min - totals.quantity;
          const savings = (totals.pricePerCookie - nextTier.price).toFixed(2);
          this.pricingHelpText.textContent = `Add ${needed} more to save €${savings}/cookie`;
          this.pricingHelpText.style.display = 'block';
        } else {
          this.pricingHelpText.style.display = 'none';
        }
      }
      
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
     * Get the next available price tier
     */
    getNextPriceTier(currentQty) {
      for (const tier of CONFIG.priceTiers) {
        if (currentQty < tier.min) {
          return tier;
        }
      }
      return null;
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
            if (sellingPlanId) {
              item.selling_plan = sellingPlanId;
            }
          }
          
          items.push(item);
        }
      });
      
      if (items.length === 0) {
        throw new Error('No items selected');
      }
      
      // Check if UpCart is active
      const isUpCartActive = !!(
        window.UpCart ||
        window.upcart ||
        window.Upcart ||
        document.querySelector('script[src*="upcart"]') ||
        document.querySelector('link[href*="upcart"]')
      );
      
      // Get cart drawer/notification for section updates
      const cart = !isUpCartActive && (document.querySelector('cart-notification') || document.querySelector('cart-drawer'));
      
      // Build FormData for UpCart compatibility
      const formData = new FormData();
      items.forEach((item, index) => {
        formData.append(`items[${index}][id]`, item.id);
        formData.append(`items[${index}][quantity]`, item.quantity);
        
        if (item.selling_plan) {
          formData.append(`items[${index}][selling_plan]`, item.selling_plan);
        }
        
        if (item.properties) {
          Object.entries(item.properties).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              formData.append(`items[${index}][properties][${key}]`, String(value));
            }
          });
        }
      });
      
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
        return null;
      }
      
      // Try to get from Seal widget first
      const sealWidget = document.querySelector('.sealsubs-container');
      if (sealWidget) {
        // Try to find a selling plan that matches the selected frequency
        const allPlans = sealWidget.querySelectorAll('input[name="selling_plan"]');
        for (const plan of allPlans) {
          const label = plan.closest('label') || plan.nextElementSibling;
          if (label && label.textContent.includes(`${this.deliveryFrequency} week`)) {
            return plan.value;
          }
        }
        
        // Fallback: get any checked plan
        const selectedPlan = sealWidget.querySelector('input[name="selling_plan"]:checked');
        if (selectedPlan) {
          return selectedPlan.value;
        }
      }
      
      // If Seal widget is not present, try to get selling plans from page data
      // Look for selling plan groups in window.ShopifyAnalytics or product JSON
      if (window.ShopifyAnalytics && window.ShopifyAnalytics.meta && window.ShopifyAnalytics.meta.product) {
        const sellingPlanGroups = window.ShopifyAnalytics.meta.product.selling_plan_groups;
        if (sellingPlanGroups && sellingPlanGroups.length > 0) {
          // Find a plan that matches the frequency
          for (const group of sellingPlanGroups) {
            if (group.selling_plans) {
              for (const plan of group.selling_plans) {
                // Match by delivery frequency in weeks
                if (plan.name && plan.name.includes(`${this.deliveryFrequency} week`)) {
                  return plan.id;
                }
              }
            }
          }
          // Fallback to first plan in first group
          if (sellingPlanGroups[0].selling_plans && sellingPlanGroups[0].selling_plans.length > 0) {
            return sellingPlanGroups[0].selling_plans[0].id;
          }
        }
      }
      
      // Final fallback - log warning and return null
      console.warn('Could not find selling plan ID for frequency:', this.deliveryFrequency);
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

