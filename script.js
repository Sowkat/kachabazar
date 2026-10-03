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

// প্রোডাক্ট কার্ডের পরিমাণের ট্র্যাকিং (+ / -)
let cardQuantities = {};

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

    document.getElementById("currentYear").textContent =
        new Date().getFullYear();

    setupSearch();

    setupModalEvents();

    loadSettings();

    loadProducts();

    updateCart();

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

    const name =
        shopSettings.shopName ||
        "১০ নং সাতবাড়ীয়া কাঁচাবাজার";

    const phone =
        shopSettings.shopPhone || "";

    const whatsapp =
        shopSettings.shopWhatsApp || "";

    const facebook =
        shopSettings.shopFacebook || "";

    document.getElementById("headerShopName").textContent = name;

    document.getElementById("heroDescription").textContent =
        shopSettings.heroDescription ||
        "তাজা কাঁচামাল সহজেই অর্ডার করুন।";

    document.getElementById("shopAddress").textContent =
        shopSettings.shopAddress ||
        "১০ নং সাতবাড়ীয়া ইউনিয়ন";

    document.getElementById("shopPhone").textContent =
        phone || "যোগাযোগ করুন";

    // ডেলিভারি টেক্সট আপডেট (ফ্রি ডেলিভারির নোটিশসহ)
    const baseDelivery = Number(shopSettings.deliveryCharge || 20);
    const minFree = Number(shopSettings.freeDeliveryMin || 300);

    document.getElementById("deliveryInfo").textContent =
        `ডেলিভারি ৳${formatNumber(baseDelivery)} (৳${formatNumber(minFree)}+ এ ফ্রি)`;

    const badgeEl = document.getElementById("shopDeliveryBadge");
    if(badgeEl) {
        badgeEl.textContent = `৳${formatNumber(minFree)} টাকার অর্ডারে ফ্রি ডেলিভারি`;
    }

    document.getElementById("footerShopName").textContent = name;

    document.getElementById("footerDescription").textContent =
        shopSettings.footerDescription ||
        "তাজা কাঁচামাল সহজেই আপনার ঘরে।";

    document.getElementById("footerAddress").textContent =
        shopSettings.shopAddress ||
        "১০ নং সাতবাড়ীয়া ইউনিয়ন";

    document.getElementById("footerPhone").textContent =
        phone || "-";

    document.getElementById("copyrightName").textContent = name;

    /* NOTICE TICKER SYSTEM (Left -> Right) */
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


    /* PHONE */

    const floatingCall =
        document.getElementById("floatingCall");

    if (phone) {
        floatingCall.href =
            "tel:" + cleanPhone(phone);
        floatingCall.style.display = "flex";
    } else {
        floatingCall.style.display = "none";
    }


    /* WHATSAPP */

    const floatingWhatsApp =
        document.getElementById("floatingWhatsApp");

    if (whatsapp) {

        const wa =
            cleanWhatsApp(whatsapp);

        floatingWhatsApp.href =
            "https://wa.me/" + wa;

        floatingWhatsApp.style.display = "flex";

    } else {

        floatingWhatsApp.style.display = "none";

    }


    /* FACEBOOK */

    const floatingFacebook =
        document.getElementById("floatingFacebook");

    if (facebook) {

        floatingFacebook.href = facebook;

        floatingFacebook.style.display = "flex";

    } else {

        floatingFacebook.style.display = "none";

    }


    /* FOOTER LINKS */

    const footerFacebook =
        document.getElementById("footerFacebook");

    const footerWhatsApp =
        document.getElementById("footerWhatsApp");

    if (facebook) {
        footerFacebook.href = facebook;
        footerFacebook.style.display = "inline-block";
    } else {
        footerFacebook.style.display = "none";
    }

    if (whatsapp) {

        footerWhatsApp.href =
            "https://wa.me/" + cleanWhatsApp(whatsapp);

        footerWhatsApp.style.display = "inline-block";

    } else {

        footerWhatsApp.style.display = "none";

    }

}


/* =========================================================
   PRODUCTS
========================================================= */

function loadProducts() {

    db.ref("products").on("value", function (snapshot) {

        allProducts = snapshot.val() || {};

        document
            .getElementById("productsLoading")
            .classList.add("hidden");

        renderCategories();

        applyProductFilter();

    }, function (error) {

        console.error(error);

        document
            .getElementById("productsLoading")
            .innerHTML = `
                <i class="fa-solid fa-circle-exclamation"></i>
                <span>পণ্য লোড করা যায়নি।</span>
            `;

    });

}


/* =========================================================
   CATEGORIES
========================================================= */

function renderCategories() {

    const categoryContainer =
        document.getElementById("categoryList");

    const categories = new Set();

    Object.values(allProducts).forEach(function (product) {

        if (
            product &&
            product.category
        ) {
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

    Array.from(categories)
        .sort()
        .forEach(function (category) {

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

    const searchInput =
        document.getElementById("searchInput");

    searchInput.addEventListener("input", function () {

        applyProductFilter();

    });

}


function clearSearch() {

    document.getElementById("searchInput").value = "";

    applyProductFilter();

}


function applyProductFilter() {

    const search =
        document
            .getElementById("searchInput")
            .value
            .trim()
            .toLowerCase();

    filteredProducts = {};

    Object.entries(allProducts).forEach(function ([id, product]) {

        if (!product) return;

        const name =
            String(product.name || "").toLowerCase();

        const category =
            String(product.category || "").toLowerCase();

        const description =
            String(product.description || "").toLowerCase();

        const matchesSearch =
            !search ||
            name.includes(search) ||
            category.includes(search) ||
            description.includes(search);

        const matchesCategory =
            selectedCategory === "all" ||
            product.category === selectedCategory;

        if (
            matchesSearch &&
            matchesCategory
        ) {
            filteredProducts[id] = product;
        }

    });

    renderProducts();

}


/* =========================================================
   RENDER PRODUCTS (সহ প্রোডাক্ট কার্ডে পরিমানের লজিক)
========================================================= */

function changeCardQty(pId, amount) {
    if (!cardQuantities[pId]) cardQuantities[pId] = 1;

    let current = cardQuantities[pId] + amount;
    if (current < 1) current = 1;

    const product = allProducts[pId];
    if (product) {
        const stockKnown = product.stock !== null && product.stock !== undefined && product.stock !== "";
        if (stockKnown && current > Number(product.stock)) {
            current = Number(product.stock);
            showToast("স্টকের বেশি নেওয়া যাবে না।", "error");
        }
    }

    cardQuantities[pId] = current;
    const qtyEl = document.getElementById(`card-qty-${pId}`);
    if (qtyEl) qtyEl.innerText = formatNumber(current);
}

function renderProducts() {

    const container =
        document.getElementById("productList");

    const noProducts =
        document.getElementById("noProducts");

    const ids =
        Object.keys(filteredProducts);

    document.getElementById("productCount").textContent =
        ids.length + "টি পণ্য";


    if (!ids.length) {

        container.innerHTML = "";

        noProducts.classList.remove("hidden");

        return;

    }

    noProducts.classList.add("hidden");

    container.innerHTML = ids.map(function (id) {

        const product =
            filteredProducts[id];

        const available =
            product.available !== false;

        const stockKnown =
            product.stock !== null &&
            product.stock !== undefined &&
            product.stock !== "";

        const stock =
            stockKnown
                ? Number(product.stock)
                : null;

        const soldOut =
            !available ||
            (stockKnown && stock <= 0);

        const image =
            product.productImage ||
            product.image ||
            "";

        const safeName =
            escapeHtml(product.name || "");

        const price =
            Number(product.price || 0);

        const unit =
            escapeHtml(product.unit || "কেজি");

        const category =
            escapeHtml(product.category || "অন্যান্য");

        const description =
            escapeHtml(product.description || "");

        const currentQty = cardQuantities[id] || 1;

        return `

            <article class="product-card">

                <div class="product-image-wrap">

                    ${
                        image
                        ?
                        `
                        <img
                            src="${escapeHtml(image)}"
                            class="product-image"
                            alt="${safeName}"
                            loading="lazy"
                            onerror="this.parentElement.innerHTML='<div class=&quot;product-image-placeholder&quot;><i class=&quot;fa-solid fa-image&quot;></i></div>'">
                        `
                        :
                        `
                        <div class="product-image-placeholder">
                            <i class="fa-solid fa-image"></i>
                        </div>
                        `
                    }

                    <span class="product-availability ${soldOut ? "off" : ""}">
                        ${soldOut ? "স্টক নেই" : "Available"}
                    </span>

                </div>


                <div class="product-card-content">

                    <div class="product-category">
                        ${category}
                    </div>

                    <div class="product-name">
                        ${safeName}
                    </div>

                    <div class="product-description">
                        ${description || "&nbsp;"}
                    </div>

                    <div class="product-bottom">

                        <div class="product-price">
                            ৳${formatNumber(price)}
                            <span class="product-unit">
                                / ${unit}
                            </span>
                        </div>

                    </div>

                    <!-- কার্ডে পরিমাণ পরিবর্তন (- 1 +) -->
                    <div class="card-qty-control">
                        <button type="button" class="card-qty-btn" onclick="changeCardQty('${id}', -1)" ${soldOut ? "disabled" : ""}>−</button>
                        <span class="card-qty-val" id="card-qty-${id}">${formatNumber(currentQty)}</span>
                        <button type="button" class="card-qty-btn" onclick="changeCardQty('${id}', 1)" ${soldOut ? "disabled" : ""}>+</button>
                    </div>

                    <button
                        type="button"
                        class="add-to-cart-btn"
                        onclick="addToCart('${id}')"
                        ${soldOut ? "disabled" : ""}>

                        <i class="fa-solid fa-cart-plus"></i>
                        ${soldOut ? "স্টক নেই" : "কার্টে দিন"}

                    </button>


                    ${
                        stockKnown
                        ?
                        `
                        <div class="stock-info ${
                            stock <= 0
                                ? "out-of-stock"
                                : ""
                        }">

                            ${
                                stock > 0
                                ? "স্টক: " + formatNumber(stock) + " " + unit
                                : "বর্তমানে স্টক নেই"
                            }

                        </div>
                        `
                        :
                        ""
                    }

                </div>

            </article>

        `;

    }).join("");

}


/* =========================================================
   CART
========================================================= */

function saveCart() {

    localStorage.setItem(
        "kachabazar_cart",
        JSON.stringify(cart)
    );

}


function addToCart(id) {

    const product =
        allProducts[id];

    if (!product) {
        showToast("পণ্য পাওয়া যায়নি।", "error");
        return;
    }

    if (product.available === false) {
        showToast("এই পণ্যটি বর্তমানে বন্ধ।", "error");
        return;
    }

    const stockKnown =
        product.stock !== null &&
        product.stock !== undefined &&
        product.stock !== "";

    const stock =
        stockKnown
            ? Number(product.stock)
            : null;

    const qtyToAdd = cardQuantities[id] || 1;
    const currentQty = Number(cart[id] || 0);

    if (
        stockKnown &&
        (currentQty + qtyToAdd) > stock
    ) {
        showToast("স্টকের বেশি নেওয়া যাবে না।", "error");
        return;
    }

    cart[id] = currentQty + qtyToAdd;

    // যোগ করার পর কার্ডের পরিমাণ আবার ১-এ নিয়ে যাওয়া
    cardQuantities[id] = 1;
    const qtyEl = document.getElementById(`card-qty-${id}`);
    if(qtyEl) qtyEl.innerText = "১";

    saveCart();

    updateCart();

    showToast(
        "কার্টে যোগ হয়েছে।",
        "success"
    );

}


function changeQuantity(id, amount) {

    const product =
        allProducts[id];

    if (!product) return;

    let quantity =
        Number(cart[id] || 0) + amount;

    const stockKnown =
        product.stock !== null &&
        product.stock !== undefined &&
        product.stock !== "";

    const stock =
        stockKnown
            ? Number(product.stock)
            : null;

    if (
        stockKnown &&
        quantity > stock
    ) {
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

            const product =
                allProducts[id];

            if (!product) return null;

            const qty =
                Number(quantity || 0);

            if (qty <= 0) return null;

            return {
                id: id,
                product: product,
                quantity: qty
            };

        })
        .filter(Boolean);

}


function getCartSubtotal() {

    return getCartItems()
        .reduce(function (sum, item) {

            return sum +
                Number(item.product.price || 0) *
                item.quantity;

        }, 0);

}

// ডেলিভারি চার্জের অটোমেটিক হিসাব (৳৩০০+ হলে ফ্রি, নয়তো ৳২০)
function calculateDeliveryCharge(subtotal) {
    if (subtotal === 0) return 0;
    const minFree = Number(shopSettings.freeDeliveryMin || 300);
    const baseFee = Number(shopSettings.deliveryCharge || 20);
    return subtotal >= minFree ? 0 : baseFee;
}

// কার্টের সাবটোটাল হিসাব
function getCartSubtotal() {
    return getCartItems().reduce(function (sum, item) {
        return sum + Number(item.product.price || 0) * item.quantity;
    }, 0);
}

// কার্ট আপডেট করার মেইন ফাংশন (যেখানে প্রগ্রেস বার যোগ করা হয়েছে)
function updateCart() {
    const items = getCartItems();
    
    // আইটেম সংখ্যা হিসাব
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const distinctCount = items.length;

    // কার্ট আইকন আপডেট
    document.getElementById("cartCount").textContent = distinctCount;
    document.getElementById("cartItemCount").textContent = itemCount + "টি পণ্য";

    const cartItems = document.getElementById("cartItems");

    // ১. কার্টে পণ্য দেখানো বা খালি কার্ট দেখানো
    if (!items.length) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fa-solid fa-cart-shopping"></i>
                <p>কার্ট খালি</p>
            </div>
        `;
    } else {
        cartItems.innerHTML = items.map(function (item) {
            const product = item.product;
            const image = product.productImage || product.image || "";
            const total = Number(product.price || 0) * item.quantity;

            // কার্ট আইটেমের ডিজাইন
            return `
                <div class="cart-item" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding: 10px 0;">
                    <img src="${image}" alt="Product Image" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">
                    <div style="flex-grow: 1; margin-left: 10px;">
                        <h4 style="margin: 0; font-size: 14px;">${product.name || "পণ্য"}</h4>
                        <p style="margin: 5px 0 0 0; font-size: 13px; color: #555;">৳${product.price} x ${item.quantity}</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="margin: 0; font-weight: bold; color: #ff5722;">৳${total}</p>
                    </div>
                </div>
            `;
        }).join("");
    }

    // ২. বিলের হিসাব করা
    const subtotal = getCartSubtotal();
    const deliveryCharge = calculateDeliveryCharge(subtotal);
    const grandTotal = subtotal + deliveryCharge;

    // ৩. ফ্রি ডেলিভারি প্রগ্রেস বার আপডেট লজিক
    const freeDeliveryThreshold = Number(shopSettings.freeDeliveryMin || 300);
    let progressText = document.getElementById("progress-text");
    let progressBar = document.getElementById("progress-bar");

    if (progressText && progressBar) {
        if (subtotal === 0) {
            progressText.innerHTML = `৳${freeDeliveryThreshold} টাকার বাজার করলে <b>ফ্রি ডেলিভারি!</b>`;
            progressBar.style.width = "0%";
        } else if (subtotal >= freeDeliveryThreshold) {
            progressText.innerHTML = "🎉 অভিনন্দন! আপনি <b>ফ্রি ডেলিভারি</b> পেয়েছেন!";
            progressBar.style.width = "100%";
            progressBar.style.backgroundColor = "#4CAF50"; // সবুজ রঙ
        } else {
            let needed = freeDeliveryThreshold - subtotal;
            let percent = (subtotal / freeDeliveryThreshold) * 100;
            progressText.innerHTML = `আর মাত্র <b>৳${needed}</b> টাকার বাজার করলে ফ্রি ডেলিভারি!`;
            progressBar.style.width = `${percent}%`;
            progressBar.style.backgroundColor = "#ff9800"; // কমলা রঙ
        }
    }

    // ৪. HTML-এ বিলের পরিমাণ আপডেট করা
    let cartTotalEl = document.getElementById("cart-total");
    let deliveryChargeEl = document.getElementById("delivery-charge");
    let grandTotalEl = document.getElementById("grand-total");

    if(cartTotalEl) cartTotalEl.innerText = `৳${subtotal}`;
    if(deliveryChargeEl) deliveryChargeEl.innerText = deliveryCharge === 0 ? "ফ্রি" : `৳${deliveryCharge}`;
    if(grandTotalEl) grandTotalEl.innerText = `৳${grandTotal}`;
}


                        ${
                            image
                            ?
                            `
                            <img
                                src="${escapeHtml(image)}"
                                class="cart-item-image"
                                alt="${escapeHtml(product.name || "")}">
                            `
                            :
                            `
                            <div class="cart-item-image"
                                 style="display:flex;align-items:center;justify-content:center">
                                <i class="fa-solid fa-image"></i>
                            </div>
                            `
                        }


                        <div class="cart-item-info">

                            <div class="cart-item-name">
                                ${escapeHtml(product.name || "")}
                            </div>

                            <div class="cart-item-price">
                                ৳${formatNumber(product.price || 0)}
                                / ${escapeHtml(product.unit || "কেজি")}
                            </div>


                            <div class="quantity-control">

                                <button
                                    type="button"
                                    onclick="changeQuantity('${item.id}', -1)">
                                    −
                                </button>

                                <span>
                                    ${item.quantity}
                                </span>

                                <button
                                    type="button"
                                    onclick="changeQuantity('${item.id}', 1)">
                                    +
                                </button>

                                <button
                                    type="button"
                                    class="remove-cart-item"
                                    onclick="removeFromCart('${item.id}')">

                                    <i class="fa-solid fa-trash"></i>

                                </button>

                            </div>

                        </div>


                        <div class="cart-item-total">
                            ৳${formatNumber(total)}
                        </div>

                    </div>

                `;

            }).join("");

    }


    const subtotal = getCartSubtotal();
    const delivery = calculateDeliveryCharge(subtotal);
    const total = subtotal + delivery;


    document.getElementById("cartSubtotal").textContent =
        "৳" + formatNumber(subtotal);

    document.getElementById("cartDelivery").textContent =
        delivery === 0 && subtotal > 0 ? "ফ্রি (Free)" : "৳" + formatNumber(delivery);

    document.getElementById("cartTotal").textContent =
        "৳" + formatNumber(total);

}


/* =========================================================
   CART OPEN/CLOSE
========================================================= */

function openCart() {

    document
        .getElementById("cartSidebar")
        .classList.add("show");

    document
        .getElementById("cartOverlay")
        .classList.add("show");

    document.body.style.overflow = "hidden";

}


function closeCart() {

    document
        .getElementById("cartSidebar")
        .classList.remove("show");

    document
        .getElementById("cartOverlay")
        .classList.remove("show");

    if (
        !document
            .getElementById("checkoutModal")
            .classList.contains("show")
    ) {
        document.body.style.overflow = "";
    }

}


/* =========================================================
   CHECKOUT
========================================================= */

function openCheckout(action = null) {

    const items =
        getCartItems();

    if (!items.length) {

        showToast(
            "আগে কার্টে অন্তত একটি পণ্য যোগ করুন।",
            "error"
        );

        return;

    }

    directOrderAction = action;

    const subtotal = getCartSubtotal();
    const delivery = calculateDeliveryCharge(subtotal);
    const total = subtotal + delivery;


    document.getElementById("checkoutSubtotal").textContent =
        "৳" + formatNumber(subtotal);

    document.getElementById("checkoutDelivery").textContent =
        delivery === 0 ? "ফ্রি (Free)" : "৳" + formatNumber(delivery);

    document.getElementById("checkoutTotal").textContent =
        "৳" + formatNumber(total);


    document
        .getElementById("checkoutModal")
        .classList.add("show");

    document.body.style.overflow = "hidden";

}


function closeCheckout() {

    document
        .getElementById("checkoutModal")
        .classList.remove("show");

    directOrderAction = null;

    if (
        !document
            .getElementById("cartSidebar")
            .classList.contains("show")
    ) {
        document.body.style.overflow = "";
    }

}


/* =========================================================
   PLACE ORDER
========================================================= */

document
    .getElementById("checkoutForm")
    .addEventListener("submit", async function (event) {

        event.preventDefault();

        const items =
            getCartItems();

        if (!items.length) {

            showToast(
                "কার্ট খালি।",
                "error"
            );

            return;

        }


        const name =
            document
                .getElementById("customerName")
                .value
                .trim();

        const phone =
            document
                .getElementById("customerPhone")
                .value
                .trim();

        const address =
            document
                .getElementById("customerAddress")
                .value
                .trim();

        const note =
            document
                .getElementById("customerNote")
                .value
                .trim();

        const paymentMethod =
            document
                .querySelector(
                    'input[name="paymentMethod"]:checked'
                )
                ?.value ||
            "Cash on Delivery";


        if (!name) {

            showToast(
                "আপনার নাম দিন।",
                "error"
            );

            return;

        }


        if (!/^01[3-9]\d{8}$/.test(phone)) {

            showToast(
                "সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন।",
                "error"
            );

            return;

        }


        if (!address) {

            showToast(
                "ডেলিভারি ঠিকানা দিন।",
                "error"
            );

            return;

        }


        const orderItems =
            items.map(function (item) {

                return {

                    productId: item.id,

                    name:
                        item.product.name || "",

                    price:
                        Number(item.product.price || 0),

                    unit:
                        item.product.unit || "কেজি",

                    quantity:
                        item.quantity

                };

            });


        const subtotal = getCartSubtotal();
        const delivery = calculateDeliveryCharge(subtotal);
        const total = subtotal + delivery;

        const orderId = generateOrderId();


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

            createdAt:
                firebase.database.ServerValue.TIMESTAMP

        };


        const button =
            document.getElementById("placeOrderButton");

        button.disabled = true;

        button.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> অর্ডার পাঠানো হচ্ছে...';


        try {

            await db
                .ref("orders/" + orderId)
                .set(orderData);


            const message =
                buildOrderMessage(
                    orderId,
                    orderData
                );


            /*
             * Cart clear
             */

            cart = {};

            saveCart();

            updateCart();


            /*
             * Form clear
             */

            document
                .getElementById("checkoutForm")
                .reset();


            /*
             * Close checkout
             */

            closeCheckout();

            closeCart();


            /*
             * Show success modal & WhatsApp link
             */

            document
                .getElementById("successOrderId")
                .textContent = orderId;

            const waBtn = document.getElementById("successWhatsAppBtn");
            const whatsapp = cleanWhatsApp(shopSettings.shopWhatsApp);

            if (whatsapp && waBtn) {
                const waUrl = "https://wa.me/" + whatsapp + "?text=" + encodeURIComponent(message);
                waBtn.href = waUrl;
                waBtn.style.display = "inline-flex";
            } else if (waBtn) {
                waBtn.style.display = "none";
            }

            document
                .getElementById("successModal")
                .classList.add("show");

            document.body.style.overflow = "hidden";


            /*
             * Direct action
             */

            if (directOrderAction) {

                setTimeout(function () {

                    openDirectOrderAction(
                        directOrderAction,
                        message
                    );

                }, 500);

            }

            directOrderAction = null;


        } catch (error) {

            console.error(error);

            showToast(
                "অর্ডার পাঠানো যায়নি। আবার চেষ্টা করুন।",
                "error"
            );

        } finally {

            button.disabled = false;

            button.innerHTML =
                '<i class="fa-solid fa-check"></i> অর্ডার নিশ্চিত করুন';

        }

    });


/* =========================================================
   ORDER ID
========================================================= */

function generateOrderId() {

    const now =
        new Date();

    const year =
        now.getFullYear();

    const month =
        String(now.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(now.getDate())
            .padStart(2, "0");

    const random =
        Math.floor(
            1000 +
            Math.random() * 9000
        );

    return (
        "SB-" +
        year +
        month +
        day +
        "-" +
        random
    );

}


/* =========================================================
   ORDER MESSAGE
========================================================= */

function buildOrderMessage(orderId, order) {

    let message =
        (shopSettings.shopName ||
            "১০ নং সাতবাড়ীয়া কাঁচাবাজার") +
        "\n\n";

    message += "অর্ডার বিবরণ:\n\n";


    order.items.forEach(function (item, index) {

        message +=
            (index + 1) +
            ". " +
            item.name +
            " × " +
            item.quantity +
            " " +
            item.unit +
            "\n";

    });


    message += "\n";

    message +=
        "পণ্যের মূল্য: ৳" +
        formatNumber(order.subtotal) +
        "\n";

    message +=
        "ডেলিভারি চার্জ: ৳" +
        formatNumber(order.deliveryCharge) +
        "\n";

    message +=
        "সর্বমোট: ৳" +
        formatNumber(order.total) +
        "\n\n";

    message +=
        "অর্ডার আইডি: " +
        orderId +
        "\n";

    message +=
        "নাম: " +
        order.customerName +
        "\n";

    message +=
        "মোবাইল: " +
        order.customerPhone +
        "\n";

    message +=
        "ঠিকানা: " +
        order.customerAddress +
        "\n";

    if (order.customerNote) {

        message +=
            "অতিরিক্ত তথ্য: " +
            order.customerNote +
            "\n";

    }

    message +=
        "পেমেন্ট: " +
        order.paymentMethod;

    return message;

}


/* =========================================================
   DIRECT ORDER ACTION (WhatsApp API ছাড়া ফ্রি মেসেজিং)
========================================================= */

function openDirectOrderAction(action, message) {

    if (action === "whatsapp") {

        const whatsapp =
            cleanWhatsApp(
                shopSettings.shopWhatsApp
            );

        if (!whatsapp) {

            showToast(
                "WhatsApp নম্বর সেট করা হয়নি।",
                "error"
            );

            return;

        }

        const url =
            "https://wa.me/" +
            whatsapp +
            "?text=" +
            encodeURIComponent(message);

        window.open(
            url,
            "_blank"
        );

        return;
    }


    if (action === "sms") {

        const phone =
            cleanPhone(
                shopSettings.shopPhone
            );

        if (!phone) {

            showToast(
                "দোকানের ফোন নম্বর সেট করা হয়নি।",
                "error"
            );

            return;

        }

        const url =
            "sms:" +
            phone +
            "?body=" +
            encodeURIComponent(message);

        window.location.href = url;

        return;
    }


    if (action === "call") {

        const phone =
            cleanPhone(
                shopSettings.shopPhone
            );

        if (!phone) {

            showToast(
                "দোকানের ফোন নম্বর সেট করা হয়নি।",
                "error"
            );

            return;

        }

        window.location.href =
            "tel:" + phone;

    }

}


/* =========================================================
   SUCCESS MODAL
========================================================= */

function closeSuccess() {

    document
        .getElementById("successModal")
        .classList.remove("show");

    document.body.style.overflow = "";

}


/* =========================================================
   ORDER TRACKING
========================================================= */

async function trackOrder() {

    const input =
        document
            .getElementById("trackingInput");

    const result =
        document
            .getElementById("trackingResult");

    const orderId =
        input.value
            .trim()
            .toUpperCase();


    if (!orderId) {

        result.innerHTML = `
            <div class="tracking-error">
                Order ID দিন।
            </div>
        `;

        return;

    }


    result.innerHTML = `
        <div class="tracking-success">
            <i class="fa-solid fa-spinner fa-spin"></i>
            অর্ডার খোঁজা হচ্ছে...
        </div>
    `;


    try {

        const snapshot =
            await db
                .ref("orders/" + orderId)
                .once("value");

        if (!snapshot.exists()) {

            result.innerHTML = `
                <div class="tracking-error">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    এই Order ID পাওয়া যায়নি।
                </div>
            `;

            return;

        }


        const order =
            snapshot.val();

        const status =
            order.status || "pending";


        result.innerHTML = `

            <div class="tracking-success">

                <strong>
                    Order ID: ${escapeHtml(orderId)}
                </strong>

                <br>

                <span>
                    কাস্টমার:
                    ${escapeHtml(order.customerName || "")}
                </span>

                <br>

                <span class="tracking-status">
                    ${getStatusText(status)}
                </span>

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


/* =========================================================
   STATUS TEXT
========================================================= */

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

    document
        .getElementById("checkoutModal")
        .addEventListener(
            "click",
            function (event) {

                if (event.target === this) {
                    closeCheckout();
                }

            }
        );


    document
        .getElementById("successModal")
        .addEventListener(
            "click",
            function (event) {

                if (event.target === this) {
                    closeSuccess();
                }

            }
        );


    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Escape") {

                closeCheckout();

                closeSuccess();

                closeCart();

            }

        }
    );

}


/* =========================================================
   SCROLL
========================================================= */

function scrollToProducts() {

    document
        .getElementById("productsSection")
        .scrollIntoView({
            behavior: "smooth"
        });

}


/* =========================================================
   HELPERS
========================================================= */

function formatNumber(number) {

    return Number(number || 0)
        .toLocaleString("bn-BD");

}


function cleanPhone(phone) {

    let value =
        String(phone || "")
            .replace(/\D/g, "");

    if (value.startsWith("880")) {
        value = "0" + value.substring(3);
    }

    return value;

}


function cleanWhatsApp(phone) {

    let value =
        String(phone || "")
            .replace(/\D/g, "");

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


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;

function showToast(message, type = "") {

    const toast =
        document.getElementById("siteToast");

    toast.textContent =
        message;

    toast.className =
        "site-toast";

    if (type) {
        toast.classList.add(type);
    }

    clearTimeout(toastTimer);

    setTimeout(function () {

        toast.classList.add("show");

    }, 10);


    toastTimer =
        setTimeout(function () {

            toast.classList.remove("show");

        }, 3000);

}


/* =========================================================
   ENTER KEY FOR TRACKING
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        document
            .getElementById("trackingInput")
            .addEventListener(
                "keydown",
                function (event) {

                    if (event.key === "Enter") {
                        trackOrder();
                    }

                }
            );

    }
);
