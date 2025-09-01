const menu = document.getElementById("menu");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const productList = document.getElementById("productList");
const pagination = document.getElementById("pagination");
const priceSlider = document.getElementById("price");
const priceValue = document.getElementById("priceValue");
const applyButton = document.getElementById("applyFilters");
const sortSelect = document.getElementById("sortSelect");
const toast = document.getElementById("toast");
const cartCount = document.getElementById("cartCount");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

let products = [];
let filteredProducts = [];
const productsPerPage = 12;
let currentPage = 1;
let currentSort = "default";
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let isSearchActive = false;
let searchQuery = "";

document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();
  setupEventListeners();
  setupSearchListeners();
  initCarousel();

  // Initialize wishlist icons based on localStorage
  initializeWishlistIcons();
  updateCartCount();
});

function fetchProducts() {
  fetch("./products.json")
    .then((res) => res.json())
    .then((data) => {
      products = data.products;
      filteredProducts = [...products];

      const maxPrice = Math.max(...products.map((p) => p.cost));
      priceSlider.max = maxPrice;
      priceSlider.value = maxPrice;
      priceValue.textContent = `Max: $${maxPrice}`;

      renderProducts(currentPage);
      renderPagination();
    })
    .catch((err) => console.error("Error loading products:", err));
}

function initializeWishlistIcons() {
  const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
  document.querySelectorAll('.product').forEach(product => {
    const productId = product.querySelector('.add-to-cart-btn').dataset.id;
    const likeIcon = product.querySelector('.like i');
    if (wishlist.includes(parseInt(productId))) {
      likeIcon.classList.add('liked');
    }
  });
}

function setupEventListeners() {
  menu.addEventListener("click", (e) => {
    e.preventDefault();
    sidebar.classList.add("active");
    overlay.classList.add("active");
    document.body.style.overflow = 'hidden';
  });

  overlay.addEventListener("click", () => {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
    document.body.style.overflow = '';
  });

  priceSlider.addEventListener("input", () => {
    priceValue.textContent = `Max: $${priceSlider.value}`;
  });

  applyButton.addEventListener("click", applyFilters);

  sortSelect.addEventListener("change", () => {
    currentSort = sortSelect.value;
    sortProducts();
  });

  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("add-to-cart-btn")) {
      addToCart(e);
    }

    if (e.target.closest(".like")) {
      toggleWishlist(e);
    }
  });
}

function setupSearchListeners() {
  searchBtn.addEventListener("click", handleSearch);
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  });
}

function handleSearch() {
  searchQuery = searchInput.value.trim().toLowerCase();
  
  if (searchQuery === "") {
    clearSearch();
    return;
  }
  
  isSearchActive = true;
  
  // Filter products based on search query
  filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery) ||
    (product.description && product.description.toLowerCase().includes(searchQuery)) ||
    product.category.toLowerCase().includes(searchQuery)
  );
  
  currentPage = 1;
  renderSearchResults();
}

function renderSearchResults() {
  // Update page heading to show search results
  const pageHeading = document.querySelector('.page-heading');
  
  if (!document.getElementById('searchResultsHeader')) {
    pageHeading.innerHTML = `
      <div id="searchResultsHeader" class="search-results-header">
        <h2>Search Results for "${searchQuery}"</h2>
        <button class="clear-search" id="clearSearch">
          <i class="fa-solid fa-times"></i> Clear Search
        </button>
      </div>
      <div class="sort-options">
        <label>Sort by:</label>
        <select id="sortSelect">
          <option value="default">Default</option>
          <option value="priceLow">Price: Low to High</option>
          <option value="priceHigh">Price: High to Low</option>
          <option value="ratingHigh">Rating: High to Low</option>
        </select>
      </div>
    `;
    
    document.getElementById('clearSearch').addEventListener('click', clearSearch);
    document.getElementById('sortSelect').addEventListener("change", () => {
      currentSort = document.getElementById('sortSelect').value;
      sortProducts();
    });
  } else {
    document.querySelector('#searchResultsHeader h2').textContent = `Search Results for "${searchQuery}"`;
  }
  
  // Render products
  renderProducts(currentPage);
  renderPagination();
  
  // Scroll to results
  document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

function clearSearch() {
  isSearchActive = false;
  searchQuery = "";
  searchInput.value = "";
  
  // Reset to show all products with current filters
  applyFilters();
}

function toggleWishlist(e) {
  const icon = e.target.closest(".like").querySelector("i");
  icon.classList.toggle("liked");

  const productId = e.target.closest(".product").querySelector(".add-to-cart-btn").dataset.id;
  const product = products.find((p) => p.id.toString() === productId);

  if (!product) return;

  const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
  const productIdNum = parseInt(productId);
  
  if (icon.classList.contains("liked")) {
    if (!wishlist.includes(productIdNum)) {
      wishlist.push(productIdNum);
      showToast('Added to wishlist');
    }
  } else {
    const index = wishlist.indexOf(productIdNum);
    if (index !== -1) {
      wishlist.splice(index, 1);
      showToast('Removed from wishlist');
    }
  }

  localStorage.setItem("wishlist", JSON.stringify(wishlist));
}

function applyFilters() {
  const selectedCategory = document.querySelector('input[name="category"]:checked').value;
  const selectedRating = parseInt(document.querySelector('input[name="rating"]:checked').value);
  const selectedPrice = parseFloat(priceSlider.value);

  // Start with all products or search results
  let productsToFilter = isSearchActive ? 
    products.filter(product => 
      product.name.toLowerCase().includes(searchQuery) ||
      (product.description && product.description.toLowerCase().includes(searchQuery)) ||
      product.category.toLowerCase().includes(searchQuery)
    ) : 
    [...products];

  filteredProducts = productsToFilter.filter((product) => {
    let categoryMatch = false;

    if (selectedCategory === "all") {
      categoryMatch = true;
    } else {
      switch (selectedCategory) {
        case "mobile-accessories":
          categoryMatch = product.category === "Mobile Accessories";
          break;
        case "computers":
          categoryMatch = product.category === "Computers & Laptops";
          break;
        case "home-kitchen":
          categoryMatch = product.category === "Home & Kitchen";
          break;
        case "beauty":
          categoryMatch = product.category === "Beauty & Personal Care";
          break;
        case "sports":
          categoryMatch = product.category === "Sports & Outdoors";
          break;
        default:
          categoryMatch = product.category.toLowerCase() === selectedCategory.toLowerCase();
      }
    }

    const matchRating = product.rating >= selectedRating;
    const matchPrice = product.cost <= selectedPrice;

    return categoryMatch && matchRating && matchPrice;
  });

  currentPage = 1;
  sortProducts();
  sidebar.classList.remove("active");
  overlay.classList.remove("active");
  document.body.style.overflow = '';
  
  if (isSearchActive) {
    renderSearchResults();
  } else {
    // Restore original page heading if not in search mode
    const pageHeading = document.querySelector('.page-heading');
    if (!document.getElementById('searchResultsHeader')) {
      pageHeading.innerHTML = `
        <h1>All Products</h1>
        <div class="sort-options">
          <label>Sort by:</label>
          <select id="sortSelect">
            <option value="default">Default</option>
            <option value="priceLow">Price: Low to High</option>
            <option value="priceHigh">Price: High to Low</option>
            <option value="ratingHigh">Rating: High to Low</option>
          </select>
        </div>
      `;
      
      sortSelect.addEventListener("change", () => {
        currentSort = sortSelect.value;
        sortProducts();
      });
    }
    
    renderProducts(currentPage);
    renderPagination();
  }
  
  showToast(`Found ${filteredProducts.length} products matching your ${isSearchActive ? 'search and filters' : 'filters'}`);
}

function sortProducts() {
  let sortedProducts = [...filteredProducts];

  switch (currentSort) {
    case "priceLow":
      sortedProducts.sort((a, b) => a.cost - b.cost);
      break;
    case "priceHigh":
      sortedProducts.sort((a, b) => b.cost - a.cost);
      break;
    case "ratingHigh":
      sortedProducts.sort((a, b) => b.rating - a.rating);
      break;
    default:
      break;
  }

  filteredProducts = sortedProducts;
  renderProducts(currentPage);
  renderPagination();
}

function renderProducts(page = 1) {
  productList.innerHTML = "";
  const start = (page - 1) * productsPerPage;
  const end = start + productsPerPage;
  const paginatedProducts = filteredProducts.slice(start, end);

  if (paginatedProducts.length === 0) {
    if (isSearchActive) {
      productList.innerHTML = `
        <div class="no-products">
          <i class="fa-solid fa-search"></i>
          <h3>No products found for "${searchQuery}"</h3>
          <p>Try adjusting your search terms or filters to see more results.</p>
          <button class="clear-search" onclick="clearSearch()" style="margin-top: 1rem;">
            <i class="fa-solid fa-times"></i> Clear Search
          </button>
        </div>
      `;
    } else {
      productList.innerHTML = `
        <div class="no-products">
          <i class="fa-solid fa-filter"></i>
          <h3>No products found</h3>
          <p>Try adjusting your filters to see more results.</p>
        </div>
      `;
    }
    return;
  }

  paginatedProducts.forEach((product, index) => {
    const productDiv = document.createElement("div");
    productDiv.classList.add("product", "fade-in");
    productDiv.style.animationDelay = `${index * 0.1}s`;
    
    const stars = '⭐'.repeat(Math.floor(product.rating)) + 
                 (product.rating % 1 >= 0.5 ? '½' : '');
    
    productDiv.innerHTML = `
      <div class="product-card">
        <img src="${product.img}" alt="${product.name}" class="product-image" loading="lazy"/>
        <div class="like"><i class="fa-solid fa-heart"></i></div>
      </div>
      <div class="product-info">
        <h3 class="product-title">${product.name}</h3>
        <p class="product-price">$${product.cost.toFixed(2)}</p>
        <p class="product-rating">${stars} (${product.rating})</p>
        <p class="product-description">${product.description || ''}</p>
      </div>
      <div class="add-to-cart">
        <button class="add-to-cart-btn" data-id="${product.id}">
          <i class="fa-solid fa-cart-shopping"></i> Add to Cart
        </button>
      </div>
    `;
    productList.appendChild(productDiv);
  });

  // Re-initialize wishlist icons after rendering
  initializeWishlistIcons();
}

function renderPagination() {
  pagination.innerHTML = "";
  const pageCount = Math.ceil(filteredProducts.length / productsPerPage);

  if (pageCount <= 1) return;

  // Previous button
  if (currentPage > 1) {
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.addEventListener('click', () => {
      currentPage--;
      renderProducts(currentPage);
      renderPagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    pagination.appendChild(prevBtn);
  }

  for (let i = 1; i <= pageCount; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.classList.add("pagination-btn");
    if (i === currentPage) btn.classList.add("active");

    btn.addEventListener("click", () => {
      currentPage = i;
      renderProducts(currentPage);
      renderPagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    pagination.appendChild(btn);
  }

  // Next button
  if (currentPage < pageCount) {
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.addEventListener('click', () => {
      currentPage++;
      renderProducts(currentPage);
      renderPagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    pagination.appendChild(nextBtn);
  }
}

function addToCart(e) {
  const id = e.target.dataset.id;
  const product = products.find((p) => p.id.toString() === id);

  if (!product) return;

  const existingItem = cart.find(item => item.id.toString() === id);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.cost,
      image: product.img,
      quantity: 1,
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  showToast(`${product.name} added to cart`);
}

function updateCartCount() {
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  cartCount.textContent = totalItems;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function initCarousel() {
  const carousel = document.querySelector('.carousel-3d');
  if (!carousel) return;
  
  let isPaused = false;
  
  carousel.addEventListener('mouseenter', () => {
    isPaused = true;
  });
  
  carousel.addEventListener('mouseleave', () => {
    isPaused = false;
  });
}

// 3D Carousel functionality
document.addEventListener('DOMContentLoaded', function() {
  const carousel = document.querySelector('.carousel-3d');
  const items = document.querySelectorAll('.carousel-item');
  const dots = document.querySelectorAll('.carousel-dot');
  const prevBtn = document.querySelector('.carousel-control.prev');
  const nextBtn = document.querySelector('.carousel-control.next');
  
  let currentAngle = 0;
  let currentIndex = 0;
  const angleIncrement = 45; // 360deg / 8 items
  
  // Function to update carousel rotation
  function updateCarousel() {
    carousel.style.transform = `translateZ(-400px) rotateY(${currentAngle}deg)`;
    
    // Update active dot
    dots.forEach((dot, index) => {
      if (index === currentIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }
  
  // Next button click
  if (nextBtn) {
    nextBtn.addEventListener('click', function() {
      currentAngle -= angleIncrement;
      currentIndex = (currentIndex + 1) % items.length;
      updateCarousel();
    });
  }
  
  // Previous button click
  if (prevBtn) {
    prevBtn.addEventListener('click', function() {
      currentAngle += angleIncrement;
      currentIndex = (currentIndex - 1 + items.length) % items.length;
      updateCarousel();
    });
  }
  
  // Dot navigation
  dots.forEach((dot, index) => {
    dot.addEventListener('click', function() {
      const diff = index - currentIndex;
      currentAngle -= diff * angleIncrement;
      currentIndex = index;
      updateCarousel();
    });
  });
  
  // Initialize carousel
  updateCarousel();
});