// Bandhan Store - Dynamic Website with JSON Configuration Support
// Supports multiple JSON configuration formats and dynamic content loading

// Global variables
let configData = null;
let isLoading = false;
let cartData = [];

// Configuration file paths to try (in order of preference) - Only latest
const CONFIG_PATHS = [
  'organizations/bandhan/data/current configuration.json'
];

// Cart Management System with localStorage
class CartManager {
  constructor() {
    this.cartKey = 'bandhanstore_cart';
    this.loadCartFromStorage();
  }

  // Load cart from localStorage
  loadCartFromStorage() {
    try {
      const storedCart = localStorage.getItem(this.cartKey);
      cartData = storedCart ? JSON.parse(storedCart) : [];
      this.updateCartDisplay();
    } catch (error) {
      console.error('Error loading cart from storage:', error);
      cartData = [];
    }
  }

  // Save cart to localStorage
  saveCartToStorage() {
    try {
      localStorage.setItem(this.cartKey, JSON.stringify(cartData));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  }

  // Add item to cart
  addToCart(product) {
    const existingItem = cartData.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cartData.push({
        id: product.id || Date.now(),
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
        category: product.category || 'Fashion'
      });
    }
    
    this.saveCartToStorage();
    this.updateCartDisplay();
    showNotification(`${product.name} added to cart!`, 'success');
  }

  // Remove item from cart
  removeFromCart(productId) {
    const itemIndex = cartData.findIndex(item => item.id === productId);
    if (itemIndex > -1) {
      const removedItem = cartData[itemIndex];
      cartData.splice(itemIndex, 1);
      this.saveCartToStorage();
      this.updateCartDisplay();
      showNotification(`${removedItem.name} removed from cart!`, 'info');
    }
  }

  // Update quantity
  updateQuantity(productId, newQuantity) {
    const item = cartData.find(item => item.id === productId);
    if (item) {
      if (newQuantity <= 0) {
        this.removeFromCart(productId);
      } else {
        item.quantity = newQuantity;
        this.saveCartToStorage();
        this.updateCartDisplay();
      }
    }
  }

  // Get cart total
  getCartTotal() {
    return cartData.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  // Get cart item count
  getCartItemCount() {
    return cartData.reduce((count, item) => count + item.quantity, 0);
  }

  // Clear cart
  clearCart() {
    cartData = [];
    this.saveCartToStorage();
    this.updateCartDisplay();
    showNotification('Cart cleared!', 'info');
  }

  // Update cart display
  updateCartDisplay() {
    const cartCount = document.getElementById('cart-count');
    const cartModal = document.querySelector('#cartModal .modal-body');
    
    // Update cart count badge
    if (cartCount) {
      const totalItems = this.getCartItemCount();
      cartCount.textContent = totalItems;
      cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }

    // Update cart modal content
    if (cartModal) {
      if (cartData.length === 0) {
        cartModal.innerHTML = `
          <div class="empty-cart text-center py-5">
            <i class="fas fa-shopping-bag fa-4x text-muted mb-3"></i>
            <h4 class="mb-3">Your bag is empty</h4>
            <p class="text-muted mb-4">Add some beautiful items to get started!</p>
            <button class="btn btn-luxury btn-lg" data-bs-dismiss="modal">
              <i class="fas fa-arrow-left me-2"></i>Continue Shopping
            </button>
          </div>
        `;
      } else {
        cartModal.innerHTML = `
          <div class="cart-items">
            ${cartData.map(item => `
              <div class="cart-item d-flex align-items-center mb-3 p-3 border rounded">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image me-3" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
                <div class="cart-item-details flex-grow-1">
                  <h6 class="mb-1">${item.name}</h6>
                  <p class="text-muted mb-1">${item.category}</p>
                  <p class="fw-bold mb-0 text-primary">₹${item.price.toLocaleString()}</p>
                </div>
                <div class="cart-item-controls d-flex align-items-center">
                  <button class="btn btn-sm btn-outline-secondary me-2" onclick="cart.updateQuantity(${item.id}, ${item.quantity - 1})">
                    <i class="fas fa-minus"></i>
                  </button>
                  <span class="mx-2 fw-bold">${item.quantity}</span>
                  <button class="btn btn-sm btn-outline-secondary me-2" onclick="cart.updateQuantity(${item.id}, ${item.quantity + 1})">
                    <i class="fas fa-plus"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" onclick="cart.removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="cart-summary mt-4 p-3 bg-light rounded">
            <div class="d-flex justify-content-between mb-3">
              <span class="fw-bold">Total Items:</span>
              <span>${this.getCartItemCount()}</span>
            </div>
            <div class="d-flex justify-content-between mb-3">
              <span class="fw-bold">Total Amount:</span>
              <span class="fw-bold text-primary">₹${this.getCartTotal().toLocaleString()}</span>
            </div>
            <div class="d-grid gap-2">
              <button class="btn btn-luxury btn-lg" onclick="cart.proceedToWhatsApp()">
                <i class="fab fa-whatsapp me-2"></i>Buy via WhatsApp
              </button>
              <button class="btn btn-outline-secondary" onclick="cart.clearCart()">
                <i class="fas fa-trash me-2"></i>Clear Cart
              </button>
            </div>
          </div>
        `;
      }
    }
  }

  // Proceed to WhatsApp with cart data
  proceedToWhatsApp() {
    if (cartData.length === 0) {
      showNotification('Your cart is empty!', 'warning');
      return;
    }

    const total = this.getCartTotal();
    const itemCount = this.getCartItemCount();
    
    // Create WhatsApp message
    let message = `🛍️ *Bandhan Store Order*\n\n`;
    message += `📋 *Order Details:*\n`;
    
    cartData.forEach((item, index) => {
      message += `${index + 1}. ${item.name}\n`;
      message += `   - Category: ${item.category}\n`;
      message += `   - Price: ₹${item.price.toLocaleString()}\n`;
      message += `   - Quantity: ${item.quantity}\n`;
      message += `   - Subtotal: ₹${(item.price * item.quantity).toLocaleString()}\n\n`;
    });
    
    message += `💰 *Total Amount: ₹${total.toLocaleString()}*\n`;
    message += `📦 *Total Items: ${itemCount}*\n\n`;
    message += `Please confirm this order and provide delivery details. Thank you! 🙏`;

    // WhatsApp phone number - can be configured via footer phone or default
    const phoneNumber = configData?.footer?.phone?.replace(/\D/g, '') || '919876543210';
    
    // Ensure phone number starts with country code
    const formattedPhone = phoneNumber.startsWith('91') ? phoneNumber : '91' + phoneNumber;
    
    // Create WhatsApp URL
    const whatsappURL = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp
    window.open(whatsappURL, '_blank');
    
    // Show confirmation
    showNotification('Redirecting to WhatsApp...', 'success');
    
    // Optional: Clear cart after successful order (uncomment if desired)
    // setTimeout(() => this.clearCart(), 2000);
  }
}

// Initialize cart manager
let cart;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  // Initialize cart manager first
  cart = new CartManager();
  
  // Then initialize website
  initializeWebsite();
});

// Initialize website
async function initializeWebsite() {
  showPageLoader();
  
  try {
    await loadConfiguration();
    await setupWebsite();
    hidePageLoader();
    initializeAnimations();
    setupEventListeners();
    
    console.log('✨ Bandhan Store website loaded successfully!');
    console.log('📊 Configuration data:', configData);
    
  } catch (error) {
    console.error('❌ Error initializing website:', error);
    hidePageLoader();
    showErrorMessage('Failed to load website. Please try again later.');
  }
}

// Load configuration from available JSON files
async function loadConfiguration() {
  for (const configPath of CONFIG_PATHS) {
    try {
      console.log(`🔍 Trying to load configuration from: ${configPath}`);
      const response = await fetch(configPath);
      
      if (response.ok) {
        const data = await response.json();
        configData = normalizeConfigData(data);
        console.log(`✅ Configuration loaded from: ${configPath}`);
        return;
      }
    } catch (error) {
      console.log(`⚠️ Failed to load ${configPath}:`, error.message);
    }
  }
  
  // If no configuration file is found, use default data
  console.log('📋 Using default configuration data');
  configData = getDefaultConfiguration();
}

// Normalize different JSON formats to a common structure
function normalizeConfigData(rawData) {
  // Check if it's the organization format (with data property)
  if (rawData.data) {
    return normalizeOrganizationFormat(rawData.data);
  }
  
  // Check if it's the legacy clothing-data format
  if (rawData.brand && rawData.categories) {
    return rawData;
  }
  
  // Return as-is if it's already in the expected format
  return rawData;
}

// Normalize organization JSON format
function normalizeOrganizationFormat(data) {
  const normalized = {
    brand: {
      name: data.brand?.brand_name || 'Bandhan Store',
      tagline: data.brand?.brand_tagline || 'Premium Fashion',
      logo: data.brand?.brand_logo || '',
      website: data.brand?.brand_website || '',
      description: data.brand?.brand_description || 'Premium fashion crafted with tradition and excellence'
    },
    categories: [],
    hero_slider: [],
    shop_by_category: [],
    new_arrivals: [],
    instagram_feed: [],
    footer: {
      company: data.footer?.footer_company || 'Bandhan Store',
      address: data.footer?.footer_address || 'Mumbai, India',
      phone: data.footer?.footer_phone || '+91 98765 43210',
      email: data.footer?.footer_email || 'info@bandhanstore.com',
      copyright: data.footer?.footer_copyright || '© 2025 Bandhan Store. All rights reserved.',
      brand_description: 'Premium fashion crafted with tradition and excellence',
      shop_links: [
        { name: 'New Arrivals', url: '#products' },
        { name: 'Collections', url: '#categories' },
        { name: 'Sale', url: '#sale' },
        { name: 'Gift Cards', url: '#gifts' }
      ],
      support_links: [
        { name: 'Size Guide', url: '#size-guide' },
        { name: 'Returns', url: '#returns' },
        { name: 'Shipping', url: '#shipping' },
        { name: 'FAQ', url: '#faq' }
      ],
      company_links: [
        { name: 'About Us', url: '#about' },
        { name: 'Careers', url: '#careers' },
        { name: 'Press', url: '#press' },
        { name: 'Contact', url: '#contact' }
      ],
      social_media: [
        { name: 'Facebook', url: '#facebook', icon: 'fab fa-facebook-f' },
        { name: 'Instagram', url: '#instagram', icon: 'fab fa-instagram' },
        { name: 'Twitter', url: '#twitter', icon: 'fab fa-twitter' },
        { name: 'YouTube', url: '#youtube', icon: 'fab fa-youtube' }
      ]
    }
  };

  // Process categories
  if (data.categories && Array.isArray(data.categories)) {
    data.categories.forEach((category, index) => {
      if (category.category_name) {
        normalized.categories.push({
          name: category.category_name,
          image: category.category_image || '',
          description: category[`category_description_${index}`] || '',
          url: `#category-${category.category_name.toLowerCase().replace(/\s+/g, '-')}`,
          slug: category.category_name.toLowerCase().replace(/\s+/g, '-')
        });
      }
    });
  }

  // Process hero slides
  if (data.hero && Array.isArray(data.hero)) {
    let currentHero = {};
    data.hero.forEach((hero, index) => {
      if (hero.hero_title !== undefined || hero.hero_image) {
        if (hero.hero_title !== undefined) {
          currentHero.title = hero.hero_title || `Slide ${Math.floor(index / 3) + 1}`;
        }
        if (hero.hero_image) {
          currentHero.image = hero.hero_image;
        }
      }
      
      if (hero[`hero_description_${index}`]) {
        currentHero.description = hero[`hero_description_${index}`];
      }
      
      if (hero[`hero_button_text_${index}`] || hero[`hero_button_link_${index}`]) {
        currentHero.button_text = hero[`hero_button_text_${index}`] || 'Explore';
        currentHero.link = hero[`hero_button_link_${index}`] || '#categories';
      }
      
      // If we have enough data for a slide, add it
      if (currentHero.image && Object.keys(currentHero).length >= 2) {
        normalized.hero_slider.push({
          title: currentHero.title || 'Discover Fashion',
          description: currentHero.description || 'Premium collections await you',
          image: currentHero.image,
          link: currentHero.link || '#categories',
          price: ''
        });
        currentHero = {};
      }
    });
  }

  // Process shop categories (use categories for shop section)
  normalized.shop_by_category = normalized.categories.map(category => ({
    name: category.name,
    image: category.image,
    description: category.description || 'Explore our collection',
    url: category.url
  }));

  // Process products (if any)
  if (data.products && Array.isArray(data.products)) {
    data.products.forEach(product => {
      if (product.product_name) {
        normalized.new_arrivals.push({
          name: product.product_name,
          price: parseFloat(product.product_price) || 2999,
          original_price: parseFloat(product.product_price) * 1.2 || 3599,
          image: product.product_image || '',
          description: product.product_description || '',
          category: 'New Arrival',
          url: `#product-${product.product_name.toLowerCase().replace(/\s+/g, '-')}`
        });
      }
    });
  }

  // Process Instagram feed
  if (data.instagram && Array.isArray(data.instagram)) {
    data.instagram.forEach((insta, index) => {
      // Only add Instagram posts that have actual data
      if (insta.instagram_image && insta.instagram_image.trim() !== '' && 
          insta.instagram_link && insta.instagram_link.trim() !== '') {
        normalized.instagram_feed.push({
          image: insta.instagram_image,
          url: insta.instagram_link,
          caption: insta[`instagram_caption_${index}`] || 'Follow us on Instagram'
        });
      }
    });
  }

  return normalized;
}

// Get default configuration when no files are available
function getDefaultConfiguration() {
  return {
    brand: {
      name: 'Bandhan Store',
      tagline: 'Premium Fashion',
      logo: '',
      description: 'Premium fashion crafted with tradition and excellence'
    },
    categories: [
      {
        name: 'Premium Collection',
        image: 'https://via.placeholder.com/600x400/667eea/ffffff?text=Premium+Collection',
        description: 'Discover our finest pieces',
        url: '#premium',
        slug: 'premium-collection'
      },
      {
        name: 'New Arrivals',
        image: 'https://via.placeholder.com/600x400/764ba2/ffffff?text=New+Arrivals',
        description: 'Latest fashion trends',
        url: '#new-arrivals',
        slug: 'new-arrivals'
      }
    ],
    hero_slider: [
      {
        title: 'Welcome to Bandhan Store',
        description: 'Discover premium fashion collections',
        image: 'https://via.placeholder.com/1920x800/667eea/ffffff?text=Hero+Slide',
        link: '#categories',
        price: ''
      }
    ],
    shop_by_category: [
      {
        name: 'Premium Collection',
        image: 'https://via.placeholder.com/600x400/667eea/ffffff?text=Premium+Collection',
        description: 'Discover our finest pieces',
        url: '#premium'
      }
    ],
    new_arrivals: [
      {
        name: 'Premium Outfit',
        price: 2999,
        original_price: 3599,
        image: 'https://via.placeholder.com/400x500/f8f9fa/6c757d?text=Premium+Outfit',
        category: 'New Arrival',
        url: '#product-premium-outfit'
      }
    ],
    instagram_feed: [
      {
        image: 'https://via.placeholder.com/300x300/667eea/ffffff?text=Instagram',
        url: '#instagram',
        caption: 'Follow us @bandhanstore'
      }
    ],
    footer: {
      company: 'Bandhan Store',
      address: 'Mumbai, India',
      phone: '+91 98765 43210',
      email: 'info@bandhanstore.com',
      copyright: '© 2025 Bandhan Store. All rights reserved.',
      brand_description: 'Premium fashion crafted with tradition and excellence',
      shop_links: [
        { name: 'New Arrivals', url: '#products' },
        { name: 'Collections', url: '#categories' },
        { name: 'Sale', url: '#sale' },
        { name: 'Gift Cards', url: '#gifts' }
      ],
      support_links: [
        { name: 'Size Guide', url: '#size-guide' },
        { name: 'Returns', url: '#returns' },
        { name: 'Shipping', url: '#shipping' },
        { name: 'FAQ', url: '#faq' }
      ],
      company_links: [
        { name: 'About Us', url: '#about' },
        { name: 'Careers', url: '#careers' },
        { name: 'Press', url: '#press' },
        { name: 'Contact', url: '#contact' }
      ],
      social_media: [
        { name: 'Facebook', url: '#facebook', icon: 'fab fa-facebook-f' },
        { name: 'Instagram', url: '#instagram', icon: 'fab fa-instagram' },
        { name: 'Twitter', url: '#twitter', icon: 'fab fa-twitter' },
        { name: 'YouTube', url: '#youtube', icon: 'fab fa-youtube' }
      ]
    }
  };
}

// Setup website with loaded configuration
async function setupWebsite() {
  setupBrand();
  setupNavigation();
  setupHeroSlider();
  setupCategories();
  setupProducts();
  setupInstagramFeed();
  setupFooter();
}

// Setup brand elements
function setupBrand() {
  const brand = configData.brand;

  // Update page title
  document.getElementById('pageTitle').textContent = `${brand.name} - ${brand.tagline}`;

  // Update brand logo and name
  const brandLogoImg = document.getElementById('brandLogoImg');
  const brandName = document.getElementById('brandName');
  const brandTagline = document.getElementById('brandTagline');

  if (brand.logo && brandLogoImg) {
    brandLogoImg.src = brand.logo;
    brandLogoImg.style.display = 'block';
    brandLogoImg.onerror = function() {
      this.style.display = 'none';
    };
  }

  if (brandName) brandName.textContent = brand.name;
  if (brandTagline) brandTagline.textContent = brand.tagline;
}

// Setup navigation
function setupNavigation() {
  const categoryNav = document.getElementById('categoryNav');
  if (!categoryNav || !configData.categories.length) return;

  // Keep default navigation and add category links
  const categoryLinks = configData.categories.slice(0, 3).map(category => `
    <li class="nav-item">
      <a class="nav-link" href="${category.url}" data-category="${category.slug}">
        ${category.name}
      </a>
    </li>
  `).join('');

  // Insert category links after "Collections" item
  const collectionsItem = categoryNav.querySelector('a[href="#categories"]')?.parentElement;
  if (collectionsItem) {
    collectionsItem.insertAdjacentHTML('afterend', categoryLinks);
  }
}

// Setup hero slider
function setupHeroSlider() {
  const heroCarouselInner = document.getElementById('heroCarouselInner');
  const heroIndicators = document.getElementById('heroIndicators');

  if (!heroCarouselInner || !heroIndicators) return;

  const heroSlides = configData.hero_slider;
  
  if (heroSlides.length === 0) return;

  // Create carousel items
  heroCarouselInner.innerHTML = heroSlides.map((slide, index) => `
    <div class="carousel-item ${index === 0 ? 'active' : ''}">
      <div class="hero-slide" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0) 0%, rgba(118, 75, 162, 0.8) 100%), url('${slide.image}') center/cover;">
        <div class="container h-100">
          <div class="row h-100 align-items-center">
            <div class="col-lg-6" data-aos="fade-right" data-aos-duration="1000">
              <div class="hero-content">
                <h1 class="hero-title display-2 fw-bold mb-4">
                  ${slide.title}
                </h1>
                <p class="hero-description lead mb-4">
                  ${slide.description}
                </p>
                ${slide.price ? `<div class="hero-price mb-4">${slide.price}</div>` : ''}
                <div class="hero-buttons">
                  <a href="${slide.link}" class="btn btn-luxury btn-lg me-3">
                    <i class="fas fa-star me-2"></i>Explore Now
                  </a>
                  <a href="#about" class="btn btn-outline-light btn-lg">
                    <i class="fas fa-play me-2"></i>Learn More
                  </a>
                </div>
              </div>
            </div>
            <div class="col-lg-6" data-aos="fade-left" data-aos-duration="1000" data-aos-delay="200">
              <div class="hero-image">
                <div class="floating-elements">
                  <div class="floating-element element-1"></div>
                  <div class="floating-element element-2"></div>
                  <div class="floating-element element-3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  // Create indicators
  heroIndicators.innerHTML = heroSlides.map((_, index) => `
    <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="${index}" 
            ${index === 0 ? 'class="active"' : ''}></button>
  `).join('');

  // Initialize carousel
  const carousel = new bootstrap.Carousel(document.getElementById('heroCarousel'), {
    interval: 6000,
    wrap: true
  });
}

// Setup categories section
function setupCategories() {
  const shopCategoryGrid = document.getElementById('shopCategoryGrid');
  if (!shopCategoryGrid) return;

  const categories = configData.shop_by_category;
  
  if (categories.length === 0) return;

  shopCategoryGrid.innerHTML = categories.map((category, index) => `
    <div class="col-lg-${categories.length <= 2 ? '6' : '4'} col-md-6 mb-4" data-aos="fade-up" data-aos-delay="${(index + 1) * 100}">
      <div class="category-card ${index === 0 ? 'category-card-large' : ''}">
        <div class="category-image">
          <img src="${category.image || 'https://via.placeholder.com/600x400/f8f9fa/6c757d?text=' + encodeURIComponent(category.name)}" 
               alt="${category.name}" 
               class="img-fluid"
               onerror="this.src='https://via.placeholder.com/600x400/f8f9fa/6c757d?text=' + encodeURIComponent('${category.name}')">
          <div class="category-overlay">
            <div class="category-content">
              <h4 class="category-title">${category.name}</h4>
              <p class="category-description">${category.description}</p>
              <a href="${category.url}" class="btn btn-luxury" onclick="navigateToCategory('${category.url}', '${category.name}')">
                Explore Collection
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// Setup products section
function setupProducts() {
  const productsGrid = document.getElementById('productsGrid');
  if (!productsGrid) return;

  const products = configData.new_arrivals;
  
  if (products.length === 0) return;

  productsGrid.innerHTML = products.map((product, index) => {
    const productId = product.id || `product-${Date.now()}-${index}`;
    const safeProductName = product.name.replace(/'/g, "\\'");
    const safeImageUrl = (product.image || '').replace(/'/g, "\\'");
    const safeCategory = (product.category || 'Fashion').replace(/'/g, "\\'");
    
    return `
    <div class="col-lg-3 col-md-6 mb-4" data-aos="fade-up" data-aos-delay="${(index + 1) * 100}">
      <div class="product-card">
        <div class="product-image">
          <img src="${product.image || 'https://via.placeholder.com/300x400/f8f9fa/6c757d?text=' + encodeURIComponent(product.name)}" 
               alt="${product.name}" 
               class="img-fluid"
               onerror="this.src='https://via.placeholder.com/300x400/f8f9fa/6c757d?text=' + encodeURIComponent('${product.name}')">
          <div class="product-overlay">
            <button class="btn btn-luxury btn-sm me-2" onclick="addToCartFromProduct('${productId}', '${safeProductName}', ${product.price}, '${safeImageUrl}', '${safeCategory}')">
              <i class="fas fa-shopping-bag me-1"></i>Add to Cart
            </button>
            <button class="btn btn-outline-light btn-sm" onclick="navigateToProduct('${product.url}', '${safeProductName}')">
              Quick View
            </button>
          </div>
          <div class="product-badges">
            <span class="badge badge-new">New</span>
          </div>
        </div>
        <div class="product-info">
          <h5 class="product-name">${product.name}</h5>
          <p class="product-category">${product.category}</p>
          <div class="product-price">
            <span class="current-price">₹${product.price.toLocaleString()}</span>
            ${product.original_price > product.price ? 
              `<span class="original-price">₹${product.original_price.toLocaleString()}</span>` : ''}
          </div>
          <button class="btn btn-luxury btn-sm w-100 mt-2" onclick="addToCartFromProduct('${productId}', '${safeProductName}', ${product.price}, '${safeImageUrl}', '${safeCategory}')">
            <i class="fas fa-shopping-bag me-1"></i>Add to Cart
          </button>
        </div>
      </div>
    </div>
  `;
  }).join('');
}

// Setup Instagram feed using local image paths from JSON
function setupInstagramFeed() {
  const instagramGrid = document.getElementById('instagramGrid');
  const instagramSection = document.querySelector('.instagram-section');
  
  if (!instagramGrid) return;

  const instagramPosts = configData.instagram_feed;
  
  // If no Instagram posts or all posts are empty, hide the entire section
  if (!instagramPosts || instagramPosts.length === 0) {
    console.log('No Instagram data found - hiding Instagram section');
    if (instagramSection) {
      instagramSection.style.display = 'none';
    }
    return;
  }

  // Check if posts have valid images (local paths from JSON)
  const hasValidData = instagramPosts.some(post => {
    const image = post.image || post.instagram_image || '';
    return image.trim() !== '' && !image.includes('placeholder') && image.includes('/');
  });

  if (!hasValidData) {
    console.log('No valid Instagram images found - hiding Instagram section');
    if (instagramSection) {
      instagramSection.style.display = 'none';
    }
    return;
  }

  // Show Instagram section if hidden
  if (instagramSection) {
    instagramSection.style.display = 'block';
  }

  // Filter and load only posts with valid images
  const validPosts = instagramPosts.filter(post => {
    const image = post.image || post.instagram_image || '';
    return image.trim() !== '' && !image.includes('placeholder') && image.includes('/');
  });

  if (validPosts.length === 0) {
    console.log('No valid Instagram posts found - hiding Instagram section');
    if (instagramSection) {
      instagramSection.style.display = 'none';
    }
    return;
  }

  // Load Instagram posts using local image paths from JSON
  instagramGrid.innerHTML = validPosts.map((post, index) => {
    const url = post.url || post.instagram_link || '#instagram';
    const caption = post.caption || post.instagram_caption || `Instagram Post ${index + 1}`;
    const image = post.image || post.instagram_image;
    
    // Use the local image path directly from JSON data
    const imageUrl = image.startsWith('/') ? `.${image}` : image;
    
    return `
      <div class="col-lg-2 col-md-4 col-6 mb-3" data-aos="fade-up" data-aos-delay="${(index + 1) * 100}">
        <div class="instagram-post" onclick="openInstagramPost('${url}')">
          <img src="${imageUrl}" 
               alt="${caption}" 
               class="img-fluid"
               onerror="this.src='https://via.placeholder.com/300x300/B91C1C/ffffff?text=Gallery+${index + 1}'">
          <div class="instagram-overlay">
            <i class="fab fa-instagram"></i>
            <p class="instagram-caption mt-2 text-white small">${caption}</p>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  console.log(`✅ Instagram section loaded with ${validPosts.length} local images`);
}

// Function to generate Instagram-style images from URLs
function generateInstagramImageFromURL(instagramURL, index) {
  // Since we can't directly fetch from Instagram due to CORS, 
  // we'll use fashion/clothing themed images from Unsplash
  const fashionKeywords = [
    'fashion-men-indian-wear',
    'traditional-clothing-indian',
    'mens-ethnic-wear',
    'kurta-fashion',
    'indian-wedding-outfit',
    'traditional-menswear'
  ];
  
  const keyword = fashionKeywords[(index - 1) % fashionKeywords.length];
  return `https://source.unsplash.com/300x300/?${keyword}&${index}`;
}

// Function to automatically load Instagram photos from links using URL-based images
function loadInstagramFromLinks() {
  const instagramGrid = document.getElementById('instagramGrid');
  const instagramSection = document.querySelector('.instagram-section');
  
  if (!instagramGrid) return;
  
  // Hide Instagram section instead of loading fake data
  console.log('No Instagram data available - hiding Instagram section');
  if (instagramSection) {
    instagramSection.style.display = 'none';
  }
}

// Fallback function for Instagram when JSON data is not available
function loadInstagramFallback() {
  const instagramSection = document.querySelector('.instagram-section');
  
  // Hide Instagram section instead of showing fake data
  console.log('Instagram fallback triggered - hiding Instagram section');
  if (instagramSection) {
    instagramSection.style.display = 'none';
  }
}

// Enhanced function to fetch Instagram photos from custom URLs
async function loadInstagramFromCustomURLs(urls) {
  const instagramGrid = document.getElementById('instagramGrid');
  if (!instagramGrid || !urls || !Array.isArray(urls)) return;

  try {
    const posts = urls.map((urlData, index) => ({
      image: urlData.image || `https://picsum.photos/300/300?random=${index + 10}`,
      url: urlData.link || 'https://instagram.com/bandhanstore',
      caption: urlData.caption || `Post ${index + 1}`
    }));

    instagramGrid.innerHTML = posts.map((post, index) => `
      <div class="col-lg-2 col-md-4 col-6 mb-3" data-aos="fade-up" data-aos-delay="${(index + 1) * 100}">
        <div class="instagram-post" onclick="openInstagramPost('${post.url}')">
          <img src="${post.image}" 
               alt="${post.caption}" 
               class="img-fluid"
               onerror="this.src='https://via.placeholder.com/250x250/B91C1C/ffffff?text=Instagram'">
          <div class="instagram-overlay">
            <i class="fab fa-instagram"></i>
            <p class="instagram-caption mt-2 text-white small">${post.caption}</p>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading Instagram photos:', error);
    loadInstagramFromLinks(); // Fallback to default images
  }
}

// Global function to update Instagram photos from URLs
window.updateInstagramPhotos = function(photoUrls) {
  if (!Array.isArray(photoUrls)) {
    console.error('photoUrls must be an array');
    return;
  }
  
  loadInstagramFromCustomURLs(photoUrls);
};

// Global function to add single Instagram photo
window.addInstagramPhoto = function(imageUrl, instagramLink, caption) {
  const newPhoto = {
    image: imageUrl,
    link: instagramLink || 'https://instagram.com/bandhanstore',
    caption: caption || 'New post'
  };
  
  // Add to existing photos
  const currentPosts = document.querySelectorAll('.instagram-post').length;
  const instagramGrid = document.getElementById('instagramGrid');
  
  if (instagramGrid) {
    const newPostHTML = `
      <div class="col-lg-2 col-md-4 col-6 mb-3" data-aos="fade-up" data-aos-delay="${(currentPosts + 1) * 100}">
        <div class="instagram-post" onclick="openInstagramPost('${newPhoto.link}')">
          <img src="${newPhoto.image}" 
               alt="${newPhoto.caption}" 
               class="img-fluid"
               onerror="this.src='https://via.placeholder.com/250x250/B91C1C/ffffff?text=Instagram'">
          <div class="instagram-overlay">
            <i class="fab fa-instagram"></i>
            <p class="instagram-caption mt-2 text-white small">${newPhoto.caption}</p>
          </div>
        </div>
      </div>
    `;
    instagramGrid.insertAdjacentHTML('beforeend', newPostHTML);
  }
};

// Function to load Instagram photos from Unsplash (as demo)
window.loadInstagramFromUnsplash = function(categories = ['fashion', 'clothing', 'style']) {
  const photoUrls = categories.map((category, index) => ({
    image: `https://source.unsplash.com/300x300/?${category}`,
    link: 'https://instagram.com/bandhanstore',
    caption: `${category.charAt(0).toUpperCase() + category.slice(1)} inspiration`
  }));
  
  loadInstagramFromCustomURLs(photoUrls);
};

// Setup footer
function setupFooter() {
  const footer = configData.footer;

  // Update footer brand information
  const footerBrandName = document.getElementById('footerBrandName');
  const footerBrandDescription = document.getElementById('footerBrandDescription');
  const footerCopyright = document.getElementById('footerCopyright');
  const footerPhone = document.getElementById('footerPhone');
  const footerEmail = document.getElementById('footerEmail');
  const footerAddress = document.getElementById('footerAddress');

  if (footerBrandName) footerBrandName.textContent = configData.brand.name;
  if (footerBrandDescription) footerBrandDescription.textContent = footer.brand_description;
  if (footerCopyright) footerCopyright.textContent = footer.copyright;
  if (footerPhone) footerPhone.textContent = footer.phone;
  if (footerEmail) footerEmail.textContent = footer.email;
  if (footerAddress) footerAddress.textContent = footer.address;

  // Setup footer links
  setupFooterLinks('footerShopLinks', footer.shop_links);
  setupFooterLinks('footerSupportLinks', footer.support_links);
  setupFooterLinks('footerCompanyLinks', footer.company_links);

  // Setup social links
  const socialLinks = document.getElementById('socialLinks');
  if (socialLinks && footer.social_media) {
    socialLinks.innerHTML = footer.social_media.map(social => `
      <a href="${social.url}" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="${social.name}">
        <i class="${social.icon}"></i>
      </a>
    `).join('');
  }
}

// Helper function to setup footer links
function setupFooterLinks(elementId, links) {
  const element = document.getElementById(elementId);
  if (element && links) {
    element.innerHTML = links.map(link => `
      <li><a href="${link.url}" class="footer-link">${link.name}</a></li>
    `).join('');
  }
}

// Page loader functions
function showPageLoader() {
  const loader = document.getElementById('pageLoader');
  if (loader) {
    loader.style.display = 'flex';
  }
}

function hidePageLoader() {
  const loader = document.getElementById('pageLoader');
  if (loader) {
    setTimeout(() => {
      loader.style.opacity = '0';
      setTimeout(() => {
        loader.style.display = 'none';
      }, 500);
    }, 1000);
  }
}

// Error message function
function showErrorMessage(message) {
  document.body.innerHTML = `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6 text-center">
          <i class="fas fa-exclamation-triangle fa-4x text-danger mb-4"></i>
          <h3 class="mb-3">Error Loading Website</h3>
          <p class="text-muted mb-4">${message}</p>
          <button class="btn btn-luxury" onclick="location.reload()">
            <i class="fas fa-redo me-2"></i>Retry
          </button>
        </div>
      </div>
    </div>
  `;
}

// Navigation functions
function navigateToCategory(url, categoryName) {
  showNotification(`Opening ${categoryName} collection...`, 'info');
  setTimeout(() => {
    if (url.startsWith('#')) {
      document.querySelector(url)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = url;
    }
  }, 1000);
}

function navigateToProduct(url, productName) {
  showNotification(`Viewing ${productName}...`, 'info');
  setTimeout(() => {
    if (url.startsWith('#')) {
      // For demo purposes, scroll to products section
      document.querySelector('#products')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = url;
    }
  }, 1000);
}

function openInstagramPost(url) {
  if (url.startsWith('#') || url === '#instagram') {
    showNotification('Gallery item viewed!', 'info');
    return;
  }
  
  // For actual Instagram URLs, open in new tab
  if (url.includes('instagram.com')) {
    window.open(url, '_blank', 'noopener,noreferrer');
    showNotification('Opening Instagram link...', 'info');
  } else {
    showNotification('Gallery item viewed!', 'info');
  }
}

// Cart helper function
function addToCartFromProduct(productId, name, price, image, category) {
  const product = {
    id: productId,
    name: name,
    price: price,
    image: image || 'https://via.placeholder.com/300x400/f8f9fa/6c757d?text=' + encodeURIComponent(name),
    category: category || 'Fashion'
  };
  
  cart.addToCart(product);
}

// Initialize animations and interactions
function initializeAnimations() {
  // Smooth scrolling for anchor links
  document.addEventListener('click', function(e) {
    if (e.target.matches('a[href^="#"]')) {
      e.preventDefault();
      const targetId = e.target.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  });

  // Back to top button
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', function() {
      if (window.pageYOffset > 300) {
        backToTop.classList.add('show');
      } else {
        backToTop.classList.remove('show');
      }
    });

    backToTop.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // Navbar background on scroll
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', function() {
      if (window.pageYOffset > 100) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }
}

// Setup event listeners
function setupEventListeners() {
  // Newsletter form
  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const email = this.querySelector('input[type="email"]').value;

      if (email) {
        showNotification('Thank you for subscribing to our newsletter!', 'success');
        this.querySelector('input[type="email"]').value = '';
      } else {
        showNotification('Please enter a valid email address.', 'warning');
      }
    });
  }

  // Search form
  const searchForm = document.querySelector('.search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const query = this.querySelector('input[type="text"]').value;

      if (query) {
        showNotification(`Searching for "${query}"...`, 'info');
        // Implement search functionality here
      }
    });
  }

  // Category navigation
  document.querySelectorAll('[data-category]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const categoryName = this.textContent.trim();
      navigateToCategory(this.getAttribute('href'), categoryName);
    });
  });
}

// Utility functions
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `alert alert-${type} alert-dismissible fade show position-fixed notification-toast`;
  notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 350px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
  notification.innerHTML = `
    <div class="d-flex align-items-center">
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
      <span>${message}</span>
    </div>
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;

  document.body.appendChild(notification);

  // Auto remove after 4 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }
  }, 4000);
}

// Console information
console.log('🎨 Bandhan Store Dynamic Website Initialized');
console.log('📁 This website loads content from JSON configuration files');
console.log('🔧 Supports multiple JSON formats and graceful fallbacks');
console.log('✨ Features: Dynamic content, responsive design, animations, Bootstrap integration');

// Export functions for global access
window.BandhanStore = {
  navigateToCategory,
  navigateToProduct,
  openInstagramPost,
  showNotification
};