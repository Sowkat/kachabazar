/* =========================================================
   ১০ নং সাতবাড়ীয়া কাঁচাবাজার
   CUSTOMER WEBSITE SCRIPT
========================================================= */

/* =========================================================
   FIREBASE CONFIG
========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyDGZjvwvZ_mbiVPgKtUAdMWWsBl3347xfA",
    authDomain: "kachabazar-87e97.firebaseapp.com",
    databaseURL: "https://kachabazar-87e97-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "kachabazar-87e97",
    storageBucket: "kachabazar-87e97.firebasestorage.app",
    messagingSenderId: "1033389997118",
    appId: "1:1033389997118:web:3af50b0e824f9e3cbf656f",
    measurementId: "G-63C54C7KH8"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.database();

/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let allProducts = {};
let filteredProducts = {};
let selectedCategory = "all";

let cart = JSON.parse(
    localStorage.getItem("kachabazar_cart") || "{}"
);

let shopSettings = {
    shopName: "১০ নং সাতবাড়ীয়া কাঁচাবাজার",
    shopPhone: "",
    shopWhatsApp: "",
    shopFacebook: "",
    shopAddress: "১০ নং সাতবাড়ীয়া ইউনিয়ন",
    deliveryCharge: 20,
    freeDeliveryMin: 300,
    noticeText: "",
    isNoticeActive: false,
    heroDescription: "তাজা কাঁচামাল সহজেই অর্ডার করুন।",
    footerDescription: "তাজা কাঁচামাল সহজেই আপনার ঘরে।"
};

let directOrderAction = null;

/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    initializeSite();
});

function initializeSite() {
    const yearEl = document.getElementById("currentYear");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
    setupSearch();
    setupModalEvents();
    loadSettings();
    loadProducts();
    updateCart();

    const trackingInput = document.getElementById("trackingInput");
    if (trackingInput) {
        trackingInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                trackOrder();
            }
        });
    }
}

/* =========================================================
   SETTINGS
========================================================= */

function loadSettings() {
    db.ref("settings").on("value", function (snapshot) {
        const data = snapshot.val() || {};
        shopSettings = {
            ...shopSettings,
            ...data
        };
        applySettings();
        updateCart();
    });
}

function applySettings() {
    const name = shopSettings.shopName || "১০ নং সাতবাড়ীয়া কাঁচাবাজার";
    const phone = shopSettings.shopPhone || "";
    const whatsapp = shopSettings.shopWhatsApp || "";
    const facebook = shopSettings.shopFacebook || "";

    safeSetText("headerShopName", name);
    safeSetText("heroDescription", shopSettings.heroDescription || "তাজা কাঁচামাল সহজেই অর্ডার করুন।");
    safeSetText("shopAddress", shopSettings.shopAddress || "১০ নং সাতবাড়ীয়া ইউনিয়ন");
    safeSetText("shopPhone", phone || "যোগাযোগ করুন");

    const baseDelivery = Number(shopSettings.deliveryCharge || 20);
    const minFree = Number(shopSettings.freeDeliveryMin || 300);

    safeSetText("deliveryInfo", `ডেলিভারি ৳${formatNumber(baseDelivery)} (৳${formatNumber(minFree)}+ এ ফ্রি)`);

    const badgeEl = document.getElementById("shopDeliveryBadge");
    if(badgeEl) {
        badgeEl.textContent = `৳${formatNumber(minFree)} টাকার অর্ডারে ফ্রি ডেলিভারি`;
    }

    safeSetText("footerShopName", name);
    safeSetText("footerDescription", shopSettings.footerDescription || "তাজা কাঁচামাল সহজেই আপনার ঘরে।");
    safeSetText("footerAddress", shopSettings.shopAddress || "১০ নং সাতবাড়ীয়া ইউনিয়ন");
    safeSetText("footerPhone", phone || "-");
    safeSetText("copyrightName", name);

    const noticeWrap = document.getElementById("noticeTicker");
    const noticeContent = document.getElementById("tickerContent");

    if (noticeWrap && noticeContent) {
        if (shopSettings.isNoticeActive && shopSettings.noticeText && shopSettings.noticeText.trim() !== "") {
            noticeContent.textContent = shopSettings.noticeText;
            noticeWrap.style.display = "block";
        } else {
            noticeWrap.style.display = "none";
        }
    }

    const floatingCall = document.getElementById("floatingCall");
    if (floatingCall) {
        if (phone) {
            floatingCall.href = "tel:" + cleanPhone(phone);
            floatingCall.style.display = "flex";
        } else {
            floatingCall.style.display = "none";
        }
    }

    const floatingWhatsApp = document.getElementById("floatingWhatsApp");
    if (floatingWhatsApp) {
        if (whatsapp) {
            floatingWhatsApp.href = "https://wa.me/" + cleanWhatsApp(whatsapp);
            floatingWhatsApp.style.display = "flex";
        } else {
            floatingWhatsApp.style.display = "none";
        }
    }

    const floatingFacebook = document.getElementById("floatingFacebook");
    if (floatingFacebook) {
        if (facebook) {
            floatingFacebook.href = facebook;
            floatingFacebook.style.display = "flex";
        } else {
            floatingFacebook.style.display = "none";
        }
    }

    const footerFacebook = document.getElementById("footerFacebook");
    const footerWhatsApp = document.getElementById("footerWhatsApp");

    if (footerFacebook) {
        if (facebook) {
            footerFacebook.href = facebook;
            footerFacebook.style.display = "inline-block";
        } else {
            footerFacebook.style.display = "none";
        }
    }

    if (footerWhatsApp) {
        if (whatsapp) {
            footerWhatsApp.href = "https://wa.me/" + cleanWhatsApp(whatsapp);
            footerWhatsApp.style.display = "inline-block";
        } else {
            footerWhatsApp.style.display = "none";
        }
    }
}

function safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = text;
    }
}

/* =========================================================
   PRODUCTS & SLIDER SETUP
========================================================= */

function loadProducts() {
    db.ref("products").on("value", function (snapshot) {
        allProducts = snapshot.val() || {};
        const loadingEl = document.getElementById("productsLoading");
        if (loadingEl) loadingEl.classList.add("hidden");
        
        renderCategories();
        applyProductFilter();
        setupProductSlider(allProducts);
    }, function (error) {
        console.error(error);
        const loadingEl = document.getElementById("productsLoading");
        if (loadingEl) {
            loadingEl.innerHTML = `
                <i class="fa-solid fa-circle-exclamation"></i>
                <span>পণ্য লোড করা যায়নি।</span>
            `;
        }
    });
}

/* =========================================================
   PRODUCT SLIDER
========================================================= */

function setupProductSlider(productsData) {
    const sliderWrapper = document.getElementById('heroSlidesWrapper');
    const dotsWrapper = document.getElementById('sliderDots');
    if (!sliderWrapper) return;

    let slideImages = [];
    if (productsData) {
        Object.values(productsData).forEach(p => {
            let imgUrl = p.productImage || p.image;
            if (imgUrl && typeof imgUrl === 'string' && imgUrl.startsWith('http')) {
                slideImages.push(imgUrl);
            }
        });
    }

    if (slideImages.length === 0) {
        slideImages = [
            'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500',
            'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=500'
        ];
    }

    sliderWrapper.innerHTML = slideImages.map((img, index) => `
        <div class="hero-slide ${index === 0 ? 'active' : ''}">
            <img src="${escapeHtml(img)}" alt="Product Slide">
        </div>
    `).join('');

    if (dotsWrapper) {
        dotsWrapper.innerHTML = slideImages.map((_, index) => `
            <div class="slider-dot ${index === 0 ? 'active' : ''}" onclick="currentSlide(${index})"></div>
        `).join('');
    }

    startSlideInterval(slideImages.length);
}

if (typeof window.currentSlideIndex === 'undefined') {
    window.currentSlideIndex = 0;
}
if (typeof window.slideInterval !== 'undefined') {
    clearInterval(window.slideInterval);
}

function startSlideInterval(totalSlides) {
    window.slideInterval = setInterval(() => {
        window.currentSlideIndex = (window.currentSlideIndex + 1) % totalSlides;
        showSlide(window.currentSlideIndex);
    }, 3000);
}

function showSlide(index) {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.slider-dot');
    if(slides.length === 0) return;

    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));

    window.currentSlideIndex = index;
    if(slides[window.currentSlideIndex]) slides[window.currentSlideIndex].classList.add('active');
    if(dots[window.currentSlideIndex]) dots[window.currentSlideIndex].classList.add('active');
}

function currentSlide(index) {
    showSlide(index);
}

/* =========================================================
   CATEGORIES
========================================================= */

function renderCategories() {
    const categoryContainer = document.getElementById("categoryList");
    if (!categoryContainer) return;
    
    const categories = new Set();

    Object.values(allProducts).forEach(function (product) {
        if (product && product.category) {
            categories.add(product.category);
        }
    });

    let html = `
        <button
            class="category-btn ${selectedCategory === "all" ? "active" : ""}"
            data-category="all"
            onclick="selectCategory('all')">
            সব
        </button>
    `;

    Array.from(categories).sort().forEach(function (category) {
        html += `
            <button
                class="category-btn ${selectedCategory === category ? "active" : ""}"
                data-category="${escapeHtml(category)}"
                onclick="selectCategory(${JSON.stringify(category)})">
                ${escapeHtml(category)}
            </button>
        `;
    });

    categoryContainer.innerHTML = html;
}

function selectCategory(category) {
    selectedCategory = category;
    renderCategories();
    applyProductFilter();
}

/* =========================================================
   SEARCH
========================================================= */

function setupSearch() {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", function () {
            applyProductFilter();
        });
    }
}

function clearSearch() {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = "";
    applyProductFilter();
}

function applyProductFilter() {
    const searchInput = document.getElementById("searchInput");
    const search = searchInput ? searchInput.value.trim().toLowerCase() : "";
    filteredProducts = {};

    Object.entries(allProducts).forEach(function ([id, product]) {
        if (!product) return;

        const name = String(product.name || "").toLowerCase();
        const category = String(product.category || "").toLowerCase();
        const description = String(product.description || "").toLowerCase();

        const matchesSearch = !search || name.includes(search) || category.includes(search) || description.includes(search);
        const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;

        if (matchesSearch && matchesCategory) {
            filteredProducts[id] = product;
        }
    });

    renderProducts();
}

/* =========================================================
   DYNAMIC QTY & UNIT HANDLERS
========================================================= */

function onUnitChange(productId) {
    const qtyInput = document.getElementById(`qty-${productId}`);
    const unitSelect = document.getElementById(`unit-${productId}`);
    if (!qtyInput || !unitSelect) return;

    if (unitSelect.value === 'gram') {
        qtyInput.value = 250;
        qtyInput.step = 50;
        qtyInput.min = 50;
    } else {
        qtyInput.value = 1;
        qtyInput.step = 0.5;
        qtyInput.min = 0.1;
    }
}

function changeQty(productId, amount) {
    let qtyInput = document.getElementById(`qty-${productId}`);
    if (!qtyInput) return;

    let unitSelect = document.getElementById(`unit-${productId}`);
    let step = parseFloat(qtyInput.step) || 1;
    let min = parseFloat(qtyInput.min) || 0.1;

    if (unitSelect) {
        if (unitSelect.value === 'gram') {
            step = 100;
            min = 50;
        } else if (unitSelect.value === 'kg') {
            step = 0.5;
            min = 0.1;
        }
    }

    let currentQty = parseFloat(qtyInput.value) || min;
    let newQty = currentQty + (amount * step);
    if (newQty >= min) {
        qtyInput.value = Number(newQty.toFixed(2));
    }
}

/* =========================================================
   RENDER PRODUCTS (CLICK PHOTO / NAME TO OPEN MODAL)
========================================================= */

function renderProducts() {
    const container = document.getElementById("productList");
    const noProducts = document.getElementById("noProducts");
    const productCountEl = document.getElementById("productCount");
    
    if (!container || !noProducts) return;

    const ids = Object.keys(filteredProducts);
    if (productCountEl) productCountEl.textContent = ids.length + "টি পণ্য";

    if (!ids.length) {
        container.innerHTML = "";
        noProducts.classList.remove("hidden");
        return;
    }

    noProducts.classList.add("hidden");

    container.innerHTML = ids.map(function (id) {
        const product = filteredProducts[id];
        const available = product.available !== false;
        const stockKnown = product.stock !== null && product.stock !== undefined && product.stock !== "";
        const stock = stockKnown ? Number(product.stock) : null;
        const soldOut = !available || (stockKnown && stock <= 0);
        
        const image = product.productImage || product.image || "";
        const safeName = escapeHtml(product.name || "");
        const price = Number(product.price || 0);
        const rawUnit = String(product.unit || "কেজি").trim();

        const isKg = (rawUnit === "কেজি" || rawUnit.toLowerCase() === "kg");
        const isGram = (rawUnit === "গ্রাম" || rawUnit.toLowerCase() === "gram");

        let unitSelectorHtml = "";
        if (isKg) {
            unitSelectorHtml = `
                <input type="number" id="qty-${id}" class="qty-input" value="1" min="0.1" step="0.5" style="width: 45px; text-align: center; padding: 3px 2px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px;">
                <select id="unit-${id}" class="unit-select" onchange="onUnitChange('${id}')" style="padding: 3px 2px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 11px;">
                    <option value="kg">কেজি</option>
                    <option value="gram">গ্রাম</option>
                </select>
            `;
        } else if (isGram) {
            unitSelectorHtml = `
                <input type="number" id="qty-${id}" class="qty-input" value="100" min="50" step="50" style="width: 50px; text-align: center; padding: 3px 2px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px;">
                <span style="font-size: 12px; font-weight: bold; color: #475569;">গ্রাম</span>
            `;
        } else {
            unitSelectorHtml = `
                <input type="number" id="qty-${id}" class="qty-input" value="1" min="1" step="1" style="width: 45px; text-align: center; padding: 3px 2px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px;">
                <span style="font-size: 12px; font-weight: bold; color: #475569; padding: 0 2px;">${escapeHtml(rawUnit)}</span>
            `;
        }

        return `
            <article class="product-card" style="padding: 8px; border: 1px solid #eee; border-radius: 8px; background: #fff;">
                <div class="image-slider" onclick="openProductModal('${id}')" style="cursor: pointer;">
                    ${image ? 
                        `<img src="${escapeHtml(image)}" alt="${safeName}" style="width:100%; border-radius:6px; height:120px; object-fit:cover;">` : 
                        `<div class="product-image-placeholder" style="height:120px; display:flex; align-items:center; justify-content:center; background:#f0f0f0; border-radius:6px;"><i class="fa-solid fa-image"></i></div>`
                    }
                </div>
                
                <h3 onclick="openProductModal('${id}')" style="margin: 6px 0 2px 0; font-size: 14px; font-weight: bold; line-height: 1.2; cursor: pointer; color: #1e293b;">${safeName}</h3>
                <p style="margin: 0 0 6px 0; color: #555; font-size: 12px;">দাম: ৳${formatNumber(price)} / ${escapeHtml(rawUnit)}</p>

                <div class="qty-selector" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; gap: 3px;">
                    <button type="button" class="qty-btn" onclick="changeQty('${id}', -1)" ${soldOut ? "disabled" : ""} style="padding: 5px 8px; cursor: pointer; border: 1px solid #cbd5e1; border-radius: 4px; background: #f8fafc; color: #334155; font-size: 11px; display: flex; align-items: center; justify-content: center;">
                        <i class="fa-solid fa-minus"></i>
                    </button>
                    
                    ${unitSelectorHtml}
                    
                    <button type="button" class="qty-btn" onclick="changeQty('${id}', 1)" ${soldOut ? "disabled" : ""} style="padding: 5px 8px; cursor: pointer; border: 1px solid #cbd5e1; border-radius: 4px; background: #f8fafc; color: #334155; font-size: 11px; display: flex; align-items: center; justify-content: center;">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                </div>

                <button
                    type="button"
                    class="add-to-cart-btn"
                    onclick="addToCart('${id}')"
                    ${soldOut ? "disabled" : ""}
                    style="width: 100%; padding: 7px; border: none; background: ${soldOut ? '#ccc' : '#ff5722'}; color: #fff; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 12px;">
                    <i class="fa-solid fa-cart-plus"></i>
                    ${soldOut ? "স্টক নেই" : "কার্টে যোগ করুন"}
                </button>
            </article>
        `;
    }).join("");
}

/* =========================================================
   CART
========================================================= */

function saveCart() {
    localStorage.setItem("kachabazar_cart", JSON.stringify(cart));
}

function addToCart(id) {
    const product = allProducts[id];
    
    if (!product) {
        showToast("পণ্য পাওয়া যায়নি।", "error");
        return;
    }

    if (product.available === false) {
        showToast("এই পণ্যটি বর্তমানে বন্ধ।", "error");
        return;
    }

    const qtyInput = document.getElementById(`qty-${id}`);
    const unitSelect = document.getElementById(`unit-${id}`);
    
    let qtyToAdd = qtyInput ? parseFloat(qtyInput.value) : 1;
    let selectedUnit = unitSelect ? unitSelect.value : (product.unit || "কেজি");

    if (selectedUnit === "gram") {
        qtyToAdd = qtyToAdd / 1000;
    }

    const stockKnown = product.stock !== null && product.stock !== undefined && product.stock !== "";
    const stock = stockKnown ? Number(product.stock) : null;
    const currentQty = Number(cart[id] || 0);

    if (stockKnown && (currentQty + qtyToAdd) > stock) {
        showToast("স্টকের বেশি নেওয়া যাবে না।", "error");
        return;
    }

    cart[id] = currentQty + qtyToAdd;

    if (qtyInput) {
        if (unitSelect && unitSelect.value === 'gram') {
            qtyInput.value = "250";
        } else if (unitSelect) {
            qtyInput.value = "1";
        } else if (String(product.unit).trim() === "গ্রাম") {
            qtyInput.value = "100";
        } else {
            qtyInput.value = "1";
        }
    }

    saveCart();
    updateCart();
    showToast("কার্টে যোগ হয়েছে।", "success");
}

function changeQuantity(id, amount) {
    const product = allProducts[id];
    if (!product) return;
    
    let quantity = Number(cart[id] || 0) + amount;
    const stockKnown = product.stock !== null && product.stock !== undefined && product.stock !== "";
    const stock = stockKnown ? Number(product.stock) : null;

    if (stockKnown && quantity > stock) {
        quantity = stock;
        showToast("স্টকের বেশি নেওয়া যাবে না।", "error");
    }

    if (quantity <= 0) {
        delete cart[id];
    } else {
        cart[id] = quantity;
    }

    saveCart();
    updateCart();
}

function removeFromCart(id) {
    delete cart[id];
    saveCart();
    updateCart();
}

function getCartItems() {
    return Object.entries(cart)
        .map(function ([id, quantity]) {
            const product = allProducts[id];
            if (!product) return null;
            const qty = Number(quantity || 0);
            if (qty <= 0) return null;
            return { id: id, product: product, quantity: qty };
        })
        .filter(Boolean);
}

function getCartSubtotal() {
    return getCartItems().reduce(function (sum, item) {
        return sum + Number(item.product.price || 0) * item.quantity;
    }, 0);
}

function calculateDeliveryCharge(subtotal) {
    if (subtotal === 0) return 0;
    const minFree = Number(shopSettings.freeDeliveryMin || 300);
    const baseFee = Number(shopSettings.deliveryCharge || 20);
    return subtotal >= minFree ? 0 : baseFee;
}

function updateCart() {
    const items = getCartItems();
    
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const distinctCount = items.length;

    safeSetText("cartCount", distinctCount);
    safeSetText("cartItemCount", itemCount + "টি পণ্য");

    const cartItems = document.getElementById("cartItems");
    if (!cartItems) return;

    if (!items.length) {
        cartItems.innerHTML = `
            <div class="empty-cart" style="text-align: center; padding: 20px; color: #777;">
                <i class="fa-solid fa-cart-shopping" style="font-size: 30px; margin-bottom: 10px;"></i>
                <p>কার্ট খালি</p>
            </div>
        `;
    } else {
        cartItems.innerHTML = items.map(function (item) {
            const product = item.product;
            const image = product.productImage || product.image || "";
            const total = Number(product.price || 0) * item.quantity;

            return `
                <div class="cart-item" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding: 10px 0;">
                    ${image ? `<img src="${escapeHtml(image)}" alt="Product" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">` : `<div style="width: 50px; height: 50px; display:flex; align-items:center; justify-content:center; background:#f0f0f0; border-radius:5px;"><i class="fa-solid fa-image"></i></div>`}
                    
                    <div style="flex-grow: 1; margin-left: 10px;">
                        <h4 style="margin: 0; font-size: 14px;">${escapeHtml(product.name || "")}</h4>
                        <p style="margin: 5px 0 0 0; font-size: 13px; color: #555;">৳${formatNumber(product.price || 0)} x ${item.quantity} ${escapeHtml(product.unit || "কেজি")}</p>
                        
                        <div class="quantity-control" style="margin-top: 5px; display: flex; align-items: center; gap: 10px;">
                            <button type="button" onclick="changeQuantity('${item.id}', -1)" style="padding: 2px 8px; border: 1px solid #ccc; background: #fff; cursor: pointer;">−</button>
                            <span>${item.quantity}</span>
                            <button type="button" onclick="changeQuantity('${item.id}', 1)" style="padding: 2px 8px; border: 1px solid #ccc; background: #fff; cursor: pointer;">+</button>
                            <button type="button" class="remove-cart-item" onclick="removeFromCart('${item.id}')" style="padding: 2px 8px; border: none; background: #ffebee; color: #f44336; cursor: pointer; border-radius: 4px;"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>

                    <div style="text-align: right; min-width: 60px;">
                        <p style="margin: 0; font-weight: bold; color: #ff5722;">৳${formatNumber(total)}</p>
                    </div>
                </div>
            `;
        }).join("");
    }

    const subtotal = getCartSubtotal();
    const deliveryCharge = calculateDeliveryCharge(subtotal);
    const grandTotal = subtotal + deliveryCharge;

    const freeDeliveryThreshold = Number(shopSettings.freeDeliveryMin || 300);
    let progressText = document.getElementById("progress-text");
    let progressBar = document.getElementById("progress-bar");

    if (progressText && progressBar) {
        if (subtotal === 0) {
            progressText.innerHTML = `৳${formatNumber(freeDeliveryThreshold)} টাকার বাজার করলে <b>ফ্রি ডেলিভারি!</b>`;
            progressBar.style.width = "0%";
        } else if (subtotal >= freeDeliveryThreshold) {
            progressText.innerHTML = "🎉 অভিনন্দন! আপনি <b>ফ্রি ডেলিভারি</b> পেয়েছেন!";
            progressBar.style.width = "100%";
            progressBar.style.backgroundColor = "#4CAF50";
        } else {
            let needed = freeDeliveryThreshold - subtotal;
            let percent = (subtotal / freeDeliveryThreshold) * 100;
            progressText.innerHTML = `আর মাত্র <b>৳${formatNumber(needed)}</b> টাকার বাজার করলে ফ্রি ডেলিভারি!`;
            progressBar.style.width = `${percent}%`;
            progressBar.style.backgroundColor = "#ff9800";
        }
    }

    safeSetText("cartSubtotal", "৳" + formatNumber(subtotal));
    safeSetText("cartDelivery", deliveryCharge === 0 && subtotal > 0 ? "ফ্রি (Free)" : "৳" + formatNumber(deliveryCharge));
    safeSetText("cartTotal", "৳" + formatNumber(grandTotal));

    safeSetText("checkoutSubtotal", "৳" + formatNumber(subtotal));
    safeSetText("checkoutDelivery", deliveryCharge === 0 && subtotal > 0 ? "ফ্রি" : "৳" + formatNumber(deliveryCharge));
    safeSetText("checkoutTotal", "৳" + formatNumber(grandTotal));
}

/* =========================================================
   CART & CHECKOUT OPEN/CLOSE
========================================================= */

function openCart() {
    const cartSidebar = document.getElementById("cartSidebar");
    const cartOverlay = document.getElementById("cartOverlay");
    if (cartSidebar) cartSidebar.classList.add("show");
    if (cartOverlay) cartOverlay.classList.add("show");
    document.body.style.overflow = "hidden";
}

function closeCart() {
    const cartSidebar = document.getElementById("cartSidebar");
    const cartOverlay = document.getElementById("cartOverlay");
    const checkoutModal = document.getElementById("checkoutModal");

    if (cartSidebar) cartSidebar.classList.remove("show");
    if (cartOverlay) cartOverlay.classList.remove("show");

    if (checkoutModal && !checkoutModal.classList.contains("show")) {
        document.body.style.overflow = "";
    }
}

function openCheckout() {
    closeCart();
    const checkoutModal = document.getElementById("checkoutModal");
    if (checkoutModal) {
        checkoutModal.classList.add("show");
        document.body.style.overflow = "hidden";
    }
}

function closeCheckout() {
    const checkoutModal = document.getElementById("checkoutModal");
    if (checkoutModal) {
        checkoutModal.classList.remove("show");
        document.body.style.overflow = "";
    }
}

/* =========================================================
   CHECKOUT WITH WHATSAPP VALIDATION
========================================================= */

function openCheckoutWithValidation(action) {
    const items = getCartItems();
    if (!items.length) {
        showToast("আগে কার্টে অন্তত একটি পণ্য যোগ করুন।", "error");
        return;
    }

    const name = document.getElementById("customerName")?.value.trim() || "";
    const phone = document.getElementById("customerPhone")?.value.trim() || "";
    const address = document.getElementById("customerAddress")?.value.trim() || "";
    const note = document.getElementById("special-note")?.value.trim() || "";
    
    if (!name || !phone || !address) {
        showToast("দয়া করে আপনার নাম, মোবাইল নম্বর এবং ঠিকানা পূরণ করুন।", "error");
        openCheckout(); 
        return;
    }

    const subtotal = getCartSubtotal();
    const delivery = calculateDeliveryCharge(subtotal);
    const total = subtotal + delivery;

    let message = (shopSettings.shopName || "১০ নং সাতবাড়ীয়া কাঁচাবাজার") + "\n\nঅর্ডার বিবরণ:\n\n";
    items.forEach(function (item, index) {
        message += (index + 1) + ". " + item.product.name + " × " + item.quantity + " " + (item.product.unit || "কেজি") + "\n";
    });
    
    message += "\nপণ্যের মূল্য: ৳" + formatNumber(subtotal) + "\n";
    message += "ডেলিভারি চার্জ: ৳" + formatNumber(delivery) + "\n";
    message += "সর্বমোট: ৳" + formatNumber(total) + "\n\n";
    
    message += "কাস্টমারের তথ্য:\n";
    message += "নাম: " + name + "\n";
    message += "মোবাইল: " + phone + "\n";
    message += "ঠিকানা: " + address + "\n";
    if (note) message += "নোট: " + note + "\n";

    if (action === "whatsapp") {
        let targetWhatsApp = shopSettings.shopWhatsApp || shopSettings.shopPhone || "8801960174982";
        const whatsapp = cleanWhatsApp(targetWhatsApp);
        const url = "https://wa.me/" + whatsapp + "?text=" + encodeURIComponent(message);
        window.open(url, "_blank");
    } else if (action === "sms") {
        const phoneNo = cleanPhone(shopSettings.shopPhone || "8801960174982");
        const url = "sms:" + phoneNo + "?body=" + encodeURIComponent(message);
        window.location.href = url;
    } else if (action === "call") {
        const phoneNo = cleanPhone(shopSettings.shopPhone || "8801960174982");
        window.location.href = "tel:" + phoneNo;
    }
}

/* =========================================================
   PLACE ORDER (FIREBASE)
========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    const checkoutForm = document.getElementById("checkoutForm");
    if (checkoutForm) {
        checkoutForm.onsubmit = async function (event) {
            event.preventDefault();

            const items = getCartItems();
            if (!items.length) {
                showToast("কার্ট খালি। অনুগ্রহ করে পণ্য যোগ করুন।", "error");
                return;
            }

            const name = document.getElementById("customerName")?.value.trim() || "";
            const phone = document.getElementById("customerPhone")?.value.trim() || "";
            const address = document.getElementById("customerAddress")?.value.trim() || "";
            const note = document.getElementById("special-note")?.value.trim() || "";
            const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || "Cash on Delivery";

            if (!name) {
                showToast("অনুগ্রহ করে আপনার নাম লিখুন।", "error");
                return;
            }
            if (!phone || !/^01[3-9]\d{8}$/.test(phone)) {
                showToast("সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন।", "error");
                return;
            }
            if (!address) {
                showToast("অনুগ্রহ করে ডেলিভারি ঠিকানা লিখুন।", "error");
                return;
            }

            const orderItems = items.map(function (item) {
                return {
                    productId: item.id,
                    name: item.product.name || "",
                    price: Number(item.product.price || 0),
                    unit: item.product.unit || "কেজি",
                    quantity: item.quantity
                };
            });

            const subtotal = getCartSubtotal();
            const delivery = calculateDeliveryCharge(subtotal);
            const total = subtotal + delivery;
            
            const now = new Date();
            const orderId = "SB-" + now.getFullYear() + String(now.getMonth() + 1).padStart(2, "0") + String(now.getDate()).padStart(2, "0") + "-" + Math.floor(1000 + Math.random() * 9000);

            const orderData = {
                orderId: orderId,
                customerName: name,
                customerPhone: phone,
                customerAddress: address,
                customerNote: note,
                paymentMethod: paymentMethod,
                items: orderItems,
                subtotal: subtotal,
                deliveryCharge: delivery,
                total: total,
                status: "pending",
                createdAt: firebase.database.ServerValue.TIMESTAMP
            };

            const button = document.getElementById("placeOrderButton");
            if (button) {
                button.disabled = true;
                button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> অর্ডার পাঠানো হচ্ছে...';
            }

            try {
                await db.ref("orders/" + orderId).set(orderData);
                
                let message = (shopSettings.shopName || "১০ নং সাতবাড়ীয়া কাঁচাবাজার") + "\n\nঅর্ডার বিবরণ:\n\n";
                orderData.items.forEach(function (item, index) {
                    message += (index + 1) + ". " + item.name + " × " + item.quantity + " " + item.unit + "\n";
                });
                message += "\nপণ্যের মূল্য: ৳" + formatNumber(subtotal) + "\n";
                message += "ডেলিভারি চার্জ: ৳" + formatNumber(delivery) + "\n";
                message += "সর্বমোট: ৳" + formatNumber(total) + "\n\n";
                message += "অর্ডার আইডি: " + orderId + "\n";
                message += "নাম: " + name + "\n";
                message += "মোবাইল: " + phone + "\n";
                message += "ঠিকানা: " + address + "\n";
                if (note) message += "নোট: " + note + "\n";
                message += "পেমেন্ট: " + paymentMethod;

                cart = {};
                saveCart();
                updateCart();
                checkoutForm.reset();

                closeCheckout();
                closeCart();

                safeSetText("successOrderId", orderId);
                const waBtn = document.getElementById("successWhatsAppBtn");
                
                let targetWhatsApp = shopSettings.shopWhatsApp || shopSettings.shopPhone || "8801960174982";
                const whatsapp = cleanWhatsApp(targetWhatsApp);

                if (whatsapp && waBtn) {
                    waBtn.href = "https://wa.me/" + whatsapp + "?text=" + encodeURIComponent(message);
                    waBtn.style.display = "inline-flex";
                } else if (waBtn) {
                    waBtn.style.display = "none";
                }

                const successModal = document.getElementById("successModal");
                if (successModal) successModal.classList.add("show");
                document.body.style.overflow = "hidden";

            } catch (error) {
                console.error(error);
                showToast("অর্ডার পাঠানো যায়নি। আবার চেষ্টা করুন।", "error");
            } finally {
                if (button) {
                    button.disabled = false;
                    button.innerHTML = '<i class="fa-solid fa-check"></i> অর্ডার নিশ্চিত করুন';
                }
            }
        };
    }
});

/* =========================================================
   ORDER ID & MESSAGE GENERATION
========================================================= */

function generateOrderId() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const random = Math.floor(1000 + Math.random() * 9000);
    return "SB-" + year + month + day + "-" + random;
}

function closeSuccess() {
    const successModal = document.getElementById("successModal");
    if (successModal) successModal.classList.remove("show");
    document.body.style.overflow = "";
}

/* =========================================================
   ORDER TRACKING
========================================================= */

async function trackOrder() {
    const input = document.getElementById("trackingInput");
    const result = document.getElementById("trackingResult");
    if (!input || !result) return;

    const orderId = input.value.trim().toUpperCase();

    if (!orderId) {
        result.innerHTML = `<div class="tracking-error">Order ID দিন।</div>`;
        return;
    }

    result.innerHTML = `
        <div class="tracking-success">
            <i class="fa-solid fa-spinner fa-spin"></i>
            অর্ডার খোঁজা হচ্ছে...
        </div>
    `;

    try {
        const snapshot = await db.ref("orders/" + orderId).once("value");
        if (!snapshot.exists()) {
            result.innerHTML = `
                <div class="tracking-error">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    এই Order ID পাওয়া যায়নি।
                </div>
            `;
            return;
        }

        const order = snapshot.val();
        const status = order.status || "pending";

        result.innerHTML = `
            <div class="tracking-success">
                <strong>Order ID: ${escapeHtml(orderId)}</strong><br>
                <span>কাস্টমার: ${escapeHtml(order.customerName || "")}</span><br>
                <span class="tracking-status">${getStatusText(status)}</span>
            </div>
        `;
    } catch (error) {
        console.error(error);
        result.innerHTML = `
            <div class="tracking-error">
                অর্ডার দেখা যাচ্ছে না। পরে আবার চেষ্টা করুন।
            </div>
        `;
    }
}

function getStatusText(status) {
    const statuses = {
        pending: "অর্ডার গ্রহণ করা হয়েছে",
        confirmed: "অর্ডার নিশ্চিত করা হয়েছে",
        processing: "অর্ডার প্রস্তুত হচ্ছে",
        delivered: "অর্ডার ডেলিভারি হয়েছে",
        cancelled: "অর্ডার বাতিল করা হয়েছে"
    };
    return statuses[status] || "অর্ডার গ্রহণ করা হয়েছে";
}

/* =========================================================
   MODAL EVENTS
========================================================= */

function setupModalEvents() {
    const checkoutModal = document.getElementById("checkoutModal");
    if (checkoutModal) {
        checkoutModal.addEventListener("click", function (event) {
            if (event.target === this) {
                closeCheckout();
            }
        });
    }

    const successModal = document.getElementById("successModal");
    if (successModal) {
        successModal.addEventListener("click", function (event) {
            if (event.target === this) {
                closeSuccess();
            }
        });
    }

    const productModal = document.getElementById("productModal");
    if (productModal) {
        productModal.addEventListener("click", function (event) {
            if (event.target === this) {
                closeProductModal();
            }
        });
    }

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeCheckout();
            closeSuccess();
            closeCart();
            closeProductModal();
        }
    });
}

function scrollToProducts() {
    const section = document.getElementById("productsSection");
    if (section) {
        section.scrollIntoView({ behavior: "smooth" });
    }
}

/* =========================================================
   PRODUCT DETAILS MODAL FUNCTIONS
========================================================= */

function openProductModal(id) {
    const product = allProducts[id];
    if (!product) return;

    const modal = document.getElementById("productModal");
    const content = document.getElementById("productModalContent");
    if (!modal || !content) return;

    const safeName = escapeHtml(product.name || "");
    const price = Number(product.price || 0);
    const rawUnit = String(product.unit || "কেজি").trim();
    const image = product.productImage || product.image || "";
    const category = escapeHtml(product.category || "সাধারণ");
    const description = escapeHtml(product.description || "এই পণ্যটির জন্য কোনো অতিরিক্ত বিবরণ দেওয়া হয়নি।");
    const available = product.available !== false;

    content.innerHTML = `
        <div style="text-align: center; margin-bottom: 12px;">
            ${image ? 
                `<img src="${escapeHtml(image)}" alt="${safeName}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px;">` : 
                `<div style="height:140px; background:#f0f0f0; border-radius:8px; display:flex; align-items:center; justify-content:center;"><i class="fa-solid fa-image fa-2x" style="color:#aaa;"></i></div>`
            }
        </div>
        
        <span style="display:inline-block; background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:bold;">${category}</span>
        
        <h3 style="margin: 8px 0 4px 0; font-size: 18px; color: #0f172a;">${safeName}</h3>
        <p style="font-size: 15px; font-weight: bold; color: #15803d; margin: 0 0 12px 0;">মূল্য: ৳${formatNumber(price)} / ${rawUnit}</p>
        
        <div style="background: #f8fafc; padding: 10px; border-radius: 6px; font-size: 13px; color: #475569; margin-bottom: 15px; border: 1px solid #e2e8f0;">
            <strong style="color: #334155; display: block; margin-bottom: 3px;">পণ্যের বিবরণ:</strong>
            <p style="margin: 0; line-height: 1.4;">${description}</p>
        </div>

        <button type="button" onclick="addToCart('${id}'); closeProductModal();" ${!available ? "disabled" : ""} style="width:100%; padding:10px; background:${available ? '#ff5722' : '#ccc'}; color:#fff; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-size:14px;">
            <i class="fa-solid fa-cart-plus"></i> ${available ? 'কার্টে যোগ করুন' : 'স্টক নেই'}
        </button>
    `;

    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
}

function closeProductModal() {
    const modal = document.getElementById("productModal");
    if (modal) {
        modal.style.display = "none";
        document.body.style.overflow = "";
    }
}

/* =========================================================
   HELPERS & TOAST
========================================================= */

function formatNumber(number) {
    return Number(number || 0).toLocaleString("bn-BD");
}

function cleanPhone(phone) {
    let value = String(phone || "").replace(/\D/g, "");
    if (value.startsWith("880")) {
        value = "0" + value.substring(3);
    }
    return value;
}

function cleanWhatsApp(phone) {
    let value = String(phone || "").replace(/\D/g, "");
    if (value.startsWith("0")) {
        value = "88" + value;
    }
    return value;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

let toastTimer = null;
function showToast(message, type = "") {
    const toast = document.getElementById("siteToast");
    if (!toast) return;
    toast.textContent = message;
    toast.className = "site-toast";
    if (type) {
        toast.classList.add(type);
    }
    clearTimeout(toastTimer);
    setTimeout(function () {
        toast.classList.add("show");
    }, 10);
    toastTimer = setTimeout(function () {
        toast.classList.remove("show");
    }, 3000);
}
