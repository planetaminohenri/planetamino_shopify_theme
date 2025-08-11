function hideProductModal() {
  const productModal = document.querySelectorAll('product-modal[open]');
  productModal && productModal.forEach((modal) => modal.hide());
}

document.addEventListener('shopify:block:select', function (event) {
  hideProductModal();
  const blockSelectedIsSlide = event.target.classList.contains('slideshow__slide');
  if (!blockSelectedIsSlide) return;

  const parentSlideshowComponent = event.target.closest('slideshow-component');
  parentSlideshowComponent.pause();

  setTimeout(function () {
    parentSlideshowComponent.slider.scrollTo({
      left: event.target.offsetLeft,
    });
  }, 200);
});

document.addEventListener('shopify:block:deselect', function (event) {
  const blockDeselectedIsSlide = event.target.classList.contains('slideshow__slide');
  if (!blockDeselectedIsSlide) return;
  const parentSlideshowComponent = event.target.closest('slideshow-component');
  if (parentSlideshowComponent.autoplayButtonIsSetToPlay) parentSlideshowComponent.play();
});

document.addEventListener('shopify:section:load', () => {
  hideProductModal();
  const zoomOnHoverScript = document.querySelector('[id^=EnableZoomOnHover]');
  if (!zoomOnHoverScript) return;
  if (zoomOnHoverScript) {
    const newScriptTag = document.createElement('script');
    newScriptTag.src = zoomOnHoverScript.src;
    zoomOnHoverScript.parentNode.replaceChild(newScriptTag, zoomOnHoverScript);
  }
});

document.addEventListener('shopify:section:unload', (event) => {
  document.querySelectorAll(`[data-section="${event.detail.sectionId}"]`).forEach((element) => {
    element.remove();
    document.body.classList.remove('overflow-hidden');
  });
});

document.addEventListener('shopify:section:reorder', () => hideProductModal());

document.addEventListener('shopify:section:select', () => hideProductModal());

document.addEventListener('shopify:section:deselect', () => hideProductModal());

document.addEventListener('shopify:inspector:activate', () => hideProductModal());

document.addEventListener('shopify:inspector:deactivate', () => hideProductModal());




// Cookie Quantity
document.addEventListener('DOMContentLoaded', function() {
  // Configuration - update these values for your pricing tiers
  const discountTiers = [
    { minQty: 12, pricePer: 3.25 },
    { minQty: 24, pricePer: 2.75 },
    { minQty: 36, pricePer: 2.50 }
  ];
  const basePrice = 3.99; // Price per cookie with no discount

  const quantityInput = document.querySelector('input[name="quantity"]');
  if (!quantityInput) return;

  function updateCookieDisplay() {
    const currentQty = parseInt(quantityInput.value);
    const currentElement = document.querySelector('.js-current-quantity');
    const messageElement = document.querySelector('.js-discount-message');
    
    if (currentElement) currentElement.textContent = currentQty;
    
    // Find the next discount tier
    const nextTier = discountTiers.find(tier => tier.minQty > currentQty);
    const currentTier = [...discountTiers].reverse().find(tier => tier.minQty <= currentQty);
    
    if (nextTier && messageElement) {
      const cookiesNeeded = nextTier.minQty - currentQty;
      const currentPrice = currentTier ? currentTier.pricePer : basePrice;
      const savings = (currentPrice - nextTier.pricePer).toFixed(2);
      
      document.querySelector('.js-cookies-needed').textContent = cookiesNeeded;
      document.querySelector('.js-savings-amount').textContent = `$${savings}`;
      messageElement.style.display = 'block';
    } else if (messageElement) {
      messageElement.style.display = 'none';
    }
  }

  // Initialize
  updateCookieDisplay();
  
  // Update on quantity change
  quantityInput.addEventListener('change', updateCookieDisplay);
  
  // For themes with quantity buttons
  document.body.addEventListener('click', function(e) {
    if (e.target.classList.contains('quantity__button')) {
      setTimeout(updateCookieDisplay, 100);
    }
  });
});