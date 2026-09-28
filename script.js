/* =========================================================
   ১০ নং সাতবাড়ীয়া কাঁচাবাজার
   CUSTOMER WEBSITE - script.js
========================================================= */


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let products = [];

let cart = [];

let selectedCategory = "all";

let directOrderAction = "firebase";


/* =========================================================
   LOAD CART FROM LOCAL STORAGE
========================================================= */

try {

    const savedCart =
        localStorage.getItem("kachabazar_cart");

    if (savedCart) {

        cart = JSON.parse(savedCart);

        if (!Array.isArray(cart)) {

            cart = [];

        }

    }

} catch (error) {

    console.error(
        "Cart loading error:",
        error
    );

    cart = [];

}


/* =========================================================
   SAVE CART
========================================================= */

function saveCart() {

    try {

        localStorage.setItem(
            "kachabazar_cart",
            JSON.stringify(cart)
        );

    } catch (error) {

        console.error(
            "Cart save error:",
            error
        );

    }

}


/* =========================================================
   FIREBASE DATABASE
========================================================= */

const database =
    firebase.database();


/* =========================================================
   PRODUCT IMAGE
========================================================= */

function getProductImage(product) {

    return (

        product.image ||

        product.productImage ||

        "https://via.placeholder.com/600x400?text=Product"

    );

}


/* =========================================================
   FORMAT PRICE
========================================================= */

function formatPrice(price) {

    const number =
        Number(price) || 0;

    return "৳" +
        number.toLocaleString("bn-BD");

}


/* =========================================================
   FORMAT NUMBER
========================================================= */

function formatNumber(number) {

    return Number(number || 0)
        .toLocaleString("bn-BD");

}


/* =========================================================
   LOAD PRODUCTS
========================================================= */

database.ref("products").on(

    "value",

    function(snapshot) {

        const data =
            snapshot.val();

        products = [];


        if (data) {

            Object.keys(data).forEach(
                function(id) {

                    const product =
                        data[id];

                    if (!product) return;


                    if (
                        product.available === false
                    ) {

                        return;

                    }


                    products.push({

                        id: id,

                        ...product

                    });

                }
            );

        }


        renderCategories();

        renderProducts(products);

        updateCart();

    },

    function(error) {

        console.error(
            "Products loading error:",
            error
        );

        const loading =
            document.getElementById(
                "productsLoading"
            );

        if (loading) {

            loading.style.display =
                "none";

        }

    }

);


/* =========================================================
   GET CATEGORIES
========================================================= */

function getCategories() {

    const categories = [];

    products.forEach(
        function(product) {

            const category =
                String(
                    product.category || ""
                ).trim();

            if (
                category &&
                !categories.includes(category)
            ) {

                categories.push(category);

            }

        }
    );


    return categories;

}


/* =========================================================
   RENDER CATEGORIES
========================================================= */

function renderCategories() {

    const categoryList =
        document.getElementById(
            "categoryList"
        );

    if (!categoryList) return;


    const categories =
        getCategories();


    let html = "";


    html += `
        <button
            type="button"
            class="category-btn ${
                selectedCategory === "all"
                    ? "active"
                    : ""
            }"
            onclick="selectCategory('all')">

            সব

        </button>
    `;


    categories.forEach(
        function(category) {

            html += `
                <button
                    type="button"
                    class="category-btn ${
                        selectedCategory === category
                            ? "active"
                            : ""
                    }"
                    onclick="selectCategory(${JSON.stringify(category)})">

                    ${escapeHtml(category)}

                </button>
            `;

        }
    );


    categoryList.innerHTML =
        html;

}


/* =========================================================
   SELECT CATEGORY
========================================================= */

function selectCategory(category) {

    selectedCategory =
        category;

    renderCategories();

    filterProducts();

}


/* =========================================================
   SEARCH
========================================================= */

const searchInput =
    document.getElementById(
        "searchInput"
    );


if (searchInput) {

    searchInput.addEventListener(
        "input",
        function() {

            filterProducts();

        }
    );

}


/* =========================================================
   FILTER PRODUCTS
========================================================= */

function filterProducts() {

    const search =
        (
            document.getElementById(
                "searchInput"
            )?.value || ""
        )
        .trim()
        .toLowerCase();


    let filtered =
        products.filter(
            function(product) {

                const categoryMatch =
                    selectedCategory === "all" ||
                    product.category === selectedCategory;


                const name =
                    String(
                        product.name || ""
                    ).toLowerCase();


                const description =
                    String(
                        product.description || ""
                    ).toLowerCase();


                const searchMatch =
                    !search ||
                    name.includes(search) ||
                    description.includes(search);


                return (
                    categoryMatch &&
                    searchMatch
                );

            }
        );


    renderProducts(filtered);

}


/* =========================================================
   RENDER PRODUCTS
========================================================= */

function renderProducts(productList) {

    const productListElement =
        document.getElementById(
            "productList"
        );


    const noProducts =
        document.getElementById(
            "noProducts"
        );


    const productCount =
        document.getElementById(
            "productCount"
        );


    const loading =
        document.getElementById(
            "productsLoading"
        );


    if (loading) {

        loading.style.display =
            "none";

    }


    if (!productListElement) return;


    if (productCount) {

        productCount.textContent =
            formatNumber(
                productList.length
            ) +
            "টি পণ্য";

    }


    if (!productList.length) {

        productListElement.innerHTML =
            "";

        if (noProducts) {

            noProducts.style.display =
                "block";

        }

        return;

    }


    if (noProducts) {

        noProducts.style.display =
            "none";

    }


    let html = "";


    productList.forEach(
        function(product) {

            const image =
                getProductImage(product);


            const price =
                Number(
                    product.price
                ) || 0;


            const stock =
                Number(
                    product.stock
                );


            const hasStock =
                Number.isNaN(stock) ||
                stock > 0;


            const unit =
                product.unit ||
                "কেজি";


            const cartItem =
                cart.find(
                    item =>
                        item.id === product.id
                );


            const quantity =
                cartItem
                    ? Number(cartItem.quantity)
                    : 0;


            html += `

                <article
                    class="product-card">

                    <div
                        class="product-image-wrap">

                        <img
                            src="${escapeAttribute(image)}"
                            alt="${escapeAttribute(product.name || "পণ্য")}"
                            class="product-image"
                            loading="lazy"
                            onerror="this.src='https://via.placeholder.com/600x400?text=Product';"
                        >

                        ${
                            !hasStock
                                ? `
                                    <span class="out-of-stock">
                                        স্টক শেষ
                                    </span>
                                  `
                                : ""
                        }

                    </div>


                    <div
                        class="product-card-content">

                        <div
                            class="product-category">

                            ${escapeHtml(
                                product.category || "অন্যান্য"
                            )}

                        </div>


                        <h3>
                            ${escapeHtml(
                                product.name || "নাম নেই"
                            )}
                        </h3>


                        ${
                            product.description
                                ? `
                                    <p class="product-description">
                                        ${escapeHtml(
                                            product.description
                                        )}
                                    </p>
                                  `
                                : ""
                        }


                        <div
                            class="product-bottom">

                            <div>

                                <strong
                                    class="product-price">

                                    ${formatPrice(price)}

                                </strong>

                                <span
                                    class="product-unit">

                                    / ${escapeHtml(unit)}

                                </span>

                            </div>


                            ${
                                hasStock
                                    ? `
                                        <button
                                            type="button"
                                            class="add-to-cart-btn"
                                            onclick="addToCart('${escapeAttribute(product.id)}')">

                                            <i class="fa-solid fa-cart-plus"></i>

                                            ${
                                                quantity > 0
                                                    ? `${formatNumber(quantity)}টি`
                                                    : "কার্টে যোগ"
                                            }

                                        </button>
                                      `
                                    : `
                                        <button
                                            type="button"
                                            class="add-to-cart-btn"
                                            disabled>

                                            স্টক নেই

                                        </button>
                                      `
                            }

                        </div>

                    </div>

                </article>

            `;

        }
    );


    productListElement.innerHTML =
        html;

}


/* =========================================================
   ADD TO CART
========================================================= */

function addToCart(productId) {

    const product =
        products.find(
            item =>
                String(item.id) === String(productId)
        );


    if (!product) {

        showToast(
            "পণ্য পাওয়া যায়নি",
            "error"
        );

        return;

    }


    const stock =
        Number(product.stock);


    const existing =
        cart.find(
            item =>
                String(item.id) === String(productId)
        );


    if (
        !Number.isNaN(stock) &&
        stock <= 0
    ) {

        showToast(
            "এই পণ্যটি স্টকে নেই",
            "error"
        );

        return;

    }


    if (existing) {

        const nextQuantity =
            Number(existing.quantity) + 1;


        if (
            !Number.isNaN(stock) &&
            nextQuantity > stock
        ) {

            showToast(
                "স্টকের চেয়ে বেশি নেওয়া যাবে না",
                "error"
            );

            return;

        }


        existing.quantity =
            nextQuantity;

    } else {

        cart.push({

            id: product.id,

            name: product.name,

            price: Number(product.price) || 0,

            unit: product.unit || "কেজি",

            image: getProductImage(product),

            quantity: 1

        });

    }


    saveCart();

    updateCart();

    renderProducts(
        getFilteredProducts()
    );


    showToast(
        "পণ্য কার্টে যোগ হয়েছে",
        "success"
    );

}


/* =========================================================
   GET FILTERED PRODUCTS
========================================================= */

function getFilteredProducts() {

    const search =
        (
            document.getElementById(
                "searchInput"
            )?.value || ""
        )
        .trim()
        .toLowerCase();


    return products.filter(
        function(product) {

            const categoryMatch =
                selectedCategory === "all" ||
                product.category === selectedCategory;


            const name =
                String(
                    product.name || ""
                ).toLowerCase();


            const description =
                String(
                    product.description || ""
                ).toLowerCase();


            const searchMatch =
                !search ||
                name.includes(search) ||
                description.includes(search);


            return (
                categoryMatch &&
                searchMatch
            );

        }
    );

}


/* =========================================================
   UPDATE CART
========================================================= */

function updateCart() {

    saveCart();


    const cartCount =
        document.getElementById(
            "cartCount"
        );


    const cartHeaderCount =
        document.getElementById(
            "cartHeaderCount"
        );


    const totalProducts =
        cart.length;


    if (cartCount) {

        cartCount.textContent =
            formatNumber(totalProducts);

    }


    if (cartHeaderCount) {

        cartHeaderCount.textContent =
            formatNumber(totalProducts) +
            "টি পণ্য";

    }


    renderCartItems();

    updateCartSummary();

}


/* =========================================================
   RENDER CART ITEMS
========================================================= */

function renderCartItems() {

    const container =
        document.getElementById(
            "cartItems"
        );


    if (!container) return;


    if (!cart.length) {

        container.innerHTML = `

            <div class="empty-cart">

                <i class="fa-solid fa-cart-shopping"></i>

                <h3>
                    কার্ট খালি
                </h3>

                <p>
                    আপনার পছন্দের পণ্য কার্টে যোগ করুন।
                </p>

            </div>

        `;

        return;

    }


    let html = "";


    cart.forEach(
        function(item, index) {

            const subtotal =
                Number(item.price || 0) *
                Number(item.quantity || 0);


            html += `

                <div
                    class="cart-item">

                    <img
                        src="${escapeAttribute(
                            item.image ||
                            "https://via.placeholder.com/150x150?text=Product"
                        )}"
                        alt="${escapeAttribute(item.name || "পণ্য")}"
                        onerror="this.src='https://via.placeholder.com/150x150?text=Product';"
                    >


                    <div
                        class="cart-item-info">

                        <h4>
                            ${escapeHtml(
                                item.name || "পণ্য"
                            )}
                        </h4>


                        <div
                            class="cart-item-price">

                            ${formatPrice(item.price)}
                            / ${escapeHtml(item.unit || "কেজি")}

                        </div>


                        <div
                            class="quantity-control">

                            <button
                                type="button"
                                onclick="changeQuantity(${index}, -1)">

                                <i class="fa-solid fa-minus"></i>

                            </button>


                            <span>
                                ${formatNumber(item.quantity)}
                            </span>


                            <button
                                type="button"
                                onclick="changeQuantity(${index}, 1)">

                                <i class="fa-solid fa-plus"></i>

                            </button>

                        </div>

                    </div>


                    <div
                        class="cart-item-total">

                        ${formatPrice(subtotal)}


                        <button
                            type="button"
                            class="remove-cart-item"
                            onclick="removeFromCart(${index})"
                            aria-label="Remove">

                            <i class="fa-solid fa-trash"></i>

                        </button>

                    </div>

                </div>

            `;

        }
    );


    container.innerHTML =
        html;

}


/* =========================================================
   CHANGE QUANTITY
========================================================= */

function changeQuantity(index, change) {

    if (!cart[index]) return;


    const item =
        cart[index];


    const product =
        products.find(
            product =>
                String(product.id) ===
                String(item.id)
        );


    let newQuantity =
        Number(item.quantity) +
        Number(change);


    if (newQuantity <= 0) {

        removeFromCart(index);

        return;

    }


    if (product) {

        const stock =
            Number(product.stock);


        if (
            !Number.isNaN(stock) &&
            newQuantity > stock
        ) {

            showToast(
                "স্টকের চেয়ে বেশি নেওয়া যাবে না",
                "error"
            );

            return;

        }

    }


    item.quantity =
        newQuantity;


    saveCart();

    updateCart();

    renderProducts(
        getFilteredProducts()
    );

}


/* =========================================================
   REMOVE FROM CART
========================================================= */

function removeFromCart(index) {

    if (!cart[index]) return;


    const name =
        cart[index].name ||
        "পণ্য";


    cart.splice(
        index,
        1
    );


    saveCart();

    updateCart();

    renderProducts(
        getFilteredProducts()
    );


    showToast(
        name + " কার্ট থেকে বাদ দেওয়া হয়েছে",
        "success"
    );

}


/* =========================================================
   CART SUMMARY
========================================================= */

function calculateSubtotal() {

    return cart.reduce(
        function(total, item) {

            return total +
                (
                    Number(item.price || 0) *
                    Number(item.quantity || 0)
                );

        },
        0
    );

}


/* =========================================================
   DELIVERY CHARGE
========================================================= */

function getDeliveryCharge() {

    const settings =
        window.shopSettings || {};


    return Number(
        settings.deliveryCharge || 0
    );

}


/* =========================================================
   CART SUMMARY UI
========================================================= */

function updateCartSummary() {

    const subtotal =
        calculateSubtotal();


    const delivery =
        cart.length
            ? getDeliveryCharge()
            : 0;


    const total =
        subtotal +
        delivery;


    const cartSubtotal =
        document.getElementById(
            "cartSubtotal"
        );


    const cartDelivery =
        document.getElementById(
            "cartDelivery"
        );


    const cartTotal =
        document.getElementById(
            "cartTotal"
        );


    if (cartSubtotal) {

        cartSubtotal.textContent =
            formatPrice(subtotal);

    }


    if (cartDelivery) {

        cartDelivery.textContent =
            formatPrice(delivery);

    }


    if (cartTotal) {

        cartTotal.textContent =
            formatPrice(total);

    }


    const checkoutSubtotal =
        document.getElementById(
            "checkoutSubtotal"
        );


    const checkoutDelivery =
        document.getElementById(
            "checkoutDelivery"
        );


    const checkoutTotal =
        document.getElementById(
            "checkoutTotal"
        );


    if (checkoutSubtotal) {

        checkoutSubtotal.textContent =
            formatPrice(subtotal);

    }


    if (checkoutDelivery) {

        checkoutDelivery.textContent =
            formatPrice(delivery);

    }


    if (checkoutTotal) {

        checkoutTotal.textContent =
            formatPrice(total);

    }

}


/* =========================================================
   OPEN CART
========================================================= */

function openCart() {

    const sidebar =
        document.getElementById(
            "cartSidebar"
        );


    const overlay =
        document.getElementById(
            "cartOverlay"
        );


    if (sidebar) {

        sidebar.classList.add("active");

    }


    if (overlay) {

        overlay.classList.add("active");

    }


    document.body.classList.add(
        "cart-open"
    );


    updateCart();

}


/* =========================================================
   CLOSE CART
========================================================= */

function closeCart() {

    const sidebar =
        document.getElementById(
            "cartSidebar"
        );


    const overlay =
        document.getElementById(
            "cartOverlay"
        );


    if (sidebar) {

        sidebar.classList.remove("active");

    }


    if (overlay) {

        overlay.classList.remove("active");

    }


    document.body.classList.remove(
        "cart-open"
    );

}


/* =========================================================
   OPEN CHECKOUT
========================================================= */

function openCheckout(action = "firebase") {

    if (!cart.length) {

        showToast(
            "আগে কার্টে পণ্য যোগ করুন",
            "error"
        );

        return;

    }


    directOrderAction =
        action || "firebase";


    updateCartSummary();


    const modal =
        document.getElementById(
            "checkoutModal"
        );


    if (modal) {

        modal.style.display =
            "flex";

        document.body.classList.add(
            "modal-open"
        );

    }


    closeCart();

}


/* =========================================================
   CLOSE CHECKOUT
========================================================= */

function closeCheckout() {

    const modal =
        document.getElementById(
            "checkoutModal"
        );


    if (modal) {

        modal.style.display =
            "none";

    }


    document.body.classList.remove(
        "modal-open"
    );

}


/* =========================================================
   CREATE ORDER ID
========================================================= */

function createOrderId() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            now.getDate()
        ).padStart(2, "0");


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
   PHONE VALIDATION
========================================================= */

function isValidBangladeshPhone(phone) {

    return /^01[3-9]\d{8}$/.test(
        phone
    );

}


/* =========================================================
   NORMALIZE PHONE
========================================================= */

function normalizePhone(phone) {

    let number =
        String(phone || "")
        .replace(/\D/g, "");


    if (number.startsWith("01")) {

        number =
            "88" + number;

    }


    return number;

}


/* =========================================================
   PLACE ORDER
========================================================= */

async function placeOrder(event) {

    if (event) {

        event.preventDefault();

    }


    if (!cart.length) {

        showToast(
            "কার্ট খালি",
            "error"
        );

        return;

    }


    const name =
        document.getElementById(
            "customerName"
        )?.value.trim() || "";


    const phone =
        document.getElementById(
            "customerPhone"
        )?.value.trim() || "";


    const address =
        document.getElementById(
            "customerAddress"
        )?.value.trim() || "";


    const note =
        document.getElementById(
            "customerNote"
        )?.value.trim() || "";


    if (!name) {

        showToast(
            "আপনার নাম দিন",
            "error"
        );

        return;

    }


    if (!isValidBangladeshPhone(phone)) {

        showToast(
            "সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন",
            "error"
        );

        return;

    }


    if (!address) {

        showToast(
            "ডেলিভারি ঠিকানা দিন",
            "error"
        );

        return;

    }


    const subtotal =
        calculateSubtotal();


    const deliveryCharge =
        getDeliveryCharge();


    const total =
        subtotal +
        deliveryCharge;


    const orderId =
        createOrderId();


    const paymentMethod =
        document.querySelector(
            'input[name="paymentMethod"]:checked'
        )?.value ||
        "Cash on Delivery";


    const orderItems =
        cart.map(
            function(item) {

                return {

                    id: item.id,

                    name: item.name,

                    price: Number(item.price) || 0,

                    unit: item.unit || "কেজি",

                    quantity:
                        Number(item.quantity) || 1,

                    total:
                        (
                            Number(item.price) || 0
                        ) *
                        (
                            Number(item.quantity) || 1
                        )

                };

            }
        );


    const orderData = {

        orderId: orderId,

        customerName: name,

        customerPhone: phone,

        customerAddress: address,

        customerNote: note,

        paymentMethod: paymentMethod,

        items: orderItems,

        productCount: cart.length,

        subtotal: subtotal,

        deliveryCharge: deliveryCharge,

        total: total,

        status: "pending",

        createdAt:
            firebase.database.ServerValue.TIMESTAMP

    };


    const button =
        document.getElementById(
            "placeOrderButton"
        );


    if (button) {

        button.disabled =
            true;

        button.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            অর্ডার পাঠানো হচ্ছে...

        `;

    }


    try {

        /*
         * CUSTOMER CAN CREATE A NEW ORDER
         * BUT DOES NOT CHANGE PRODUCT STOCK.
         *
         * STOCK WILL BE MANAGED FROM ADMIN PANEL.
         */

        await database
            .ref("orders/" + orderId)
            .set(orderData);


        const selectedAction =
            directOrderAction;


        const message =
            createOrderMessage(
                orderData
            );


        closeCheckout();


        showSuccess(
            orderId
        );


        /*
         * CLEAR CART
         */

        cart = [];

        saveCart();

        updateCart();

        renderProducts(
            getFilteredProducts()
        );


        /*
         * DIRECT ORDER
         */

        if (
            selectedAction ===
            "whatsapp"
        ) {

            setTimeout(
                function() {

                    openWhatsAppOrder(
                        message
                    );

                },
                700
            );

        }


        else if (
            selectedAction ===
            "sms"
        ) {

            setTimeout(
                function() {

                    openSMSOrder(
                        message
                    );

                },
                700
            );

        }


        else if (
            selectedAction ===
            "call"
        ) {

            setTimeout(
                function() {

                    callOrder();

                },
                700
            );

        }


        /*
         * RESET ACTION
         */

        directOrderAction =
            "firebase";


    } catch (error) {

        console.error(
            "Order save error:",
            error
        );


        showToast(
            "অর্ডার পাঠানো যায়নি। আবার চেষ্টা করুন।",
            "error"
        );

    }


    if (button) {

        button.disabled =
            false;

        button.innerHTML = `

            <i class="fa-solid fa-check"></i>

            অর্ডার কনফার্ম করুন

        `;

    }

}


/* =========================================================
   CREATE ORDER MESSAGE
========================================================= */

function createOrderMessage(order) {

    let message =
        "১০ নং সাতবাড়ীয়া কাঁচাবাজার\n\n";


    message +=
        "অর্ডার:\n\n";


    order.items.forEach(
        function(item, index) {

            message +=

                (
                    index + 1
                ) +
                ". " +
                item.name +
                " × " +
                item.quantity +
                " " +
                item.unit +
                "\n";

        }
    );


    message +=
        "\n";


    message +=
        "মোট পণ্য: " +
        order.productCount +
        "টি\n";


    message +=
        "পণ্যের মূল্য: " +
        formatPrice(order.subtotal) +
        "\n";


    message +=
        "ডেলিভারি চার্জ: " +
        formatPrice(order.deliveryCharge) +
        "\n";


    message +=
        "সর্বমোট: " +
        formatPrice(order.total) +
        "\n\n";


    message +=
        "অর্ডার আইডি: " +
        order.orderId +
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
   WHATSAPP ORDER
========================================================= */

function openWhatsAppOrder(message) {

    const settings =
        window.shopSettings || {};


    const phone =
        settings.whatsapp ||
        settings.phone ||
        "";


    const number =
        normalizePhone(phone);


    if (!number) {

        showToast(
            "WhatsApp নম্বর সেট করা হয়নি",
            "error"
        );

        return;

    }


    const url =
        "https://wa.me/" +
        number +
        "?text=" +
        encodeURIComponent(message);


    window.open(
        url,
        "_blank"
    );

}


/* =========================================================
   SMS ORDER
========================================================= */

function openSMSOrder(message) {

    const settings =
        window.shopSettings || {};


    const phone =
        settings.phone ||
        "";


    if (!phone) {

        showToast(
            "মোবাইল নম্বর সেট করা হয়নি",
            "error"
        );

        return;

    }


    const url =
        "sms:" +
        phone +
        "?body=" +
        encodeURIComponent(message);


    window.location.href =
        url;

}


/* =========================================================
   CALL ORDER
========================================================= */

function callOrder() {

    const settings =
        window.shopSettings || {};


    const phone =
        settings.phone ||
        settings.whatsapp ||
        "";


    if (!phone) {

        showToast(
            "ফোন নম্বর সেট করা হয়নি",
            "error"
        );

        return;

    }


    window.location.href =
        "tel:" + phone;

}


/* =========================================================
   SUCCESS MODAL
========================================================= */

function showSuccess(orderId) {

    const modal =
        document.getElementById(
            "successModal"
        );


    const orderIdElement =
        document.getElementById(
            "successOrderId"
        );


    if (orderIdElement) {

        orderIdElement.textContent =
            orderId;

    }


    if (modal) {

        modal.style.display =
            "flex";

        document.body.classList.add(
            "modal-open"
        );

    }

}


/* =========================================================
   CLOSE SUCCESS
========================================================= */

function closeSuccess() {

    const modal =
        document.getElementById(
            "successModal"
        );


    if (modal) {

        modal.style.display =
            "none";

    }


    document.body.classList.remove(
        "modal-open"
    );

}


/* =========================================================
   TRACK ORDER
========================================================= */

async function trackOrder() {

    const input =
        document.getElementById(
            "trackingInput"
        );


    const result =
        document.getElementById(
            "trackingResult"
        );


    if (!input || !result) return;


    const orderId =
        input.value.trim();


    if (!orderId) {

        showToast(
            "অর্ডার আইডি দিন",
            "error"
        );

        return;

    }


    result.style.display =
        "block";


    result.innerHTML = `

        <div class="tracking-loading">

            <i class="fa-solid fa-spinner fa-spin"></i>

            অর্ডার খোঁজা হচ্ছে...

        </div>

    `;


    try {

        const snapshot =
            await database
                .ref(
                    "orders/" +
                    orderId
                )
                .once("value");


        if (!snapshot.exists()) {

            result.innerHTML = `

                <div class="tracking-error">

                    <i class="fa-solid fa-circle-exclamation"></i>

                    <strong>
                        অর্ডার পাওয়া যায়নি
                    </strong>

                    <p>
                        অর্ডার আইডি সঠিক আছে কিনা দেখুন।
                    </p>

                </div>

            `;

            return;

        }


        const order =
            snapshot.val();


        const status =
            getOrderStatusText(
                order.status
            );


        result.innerHTML = `

            <div class="tracking-success">

                <div class="tracking-order-header">

                    <strong>
                        ${escapeHtml(
                            order.orderId || orderId
                        )}
                    </strong>

                    <span>
                        ${status.label}
                    </span>

                </div>


                <div class="tracking-details">

                    <p>
                        <strong>
                            নাম:
                        </strong>

                        ${escapeHtml(
                            order.customerName || "-"
                        )}

                    </p>


                    <p>
                        <strong>
                            মোট:
                        </strong>

                        ${formatPrice(
                            order.total
                        )}

                    </p>


                    <p>
                        <strong>
                            অবস্থা:
                        </strong>

                        ${status.label}

                    </p>

                </div>

            </div>

        `;

    } catch (error) {

        console.error(
            "Tracking error:",
            error
        );


        result.innerHTML = `

            <div class="tracking-error">

                <i class="fa-solid fa-triangle-exclamation"></i>

                অর্ডার খুঁজে পাওয়া যায়নি।

            </div>

        `;

    }

}


/* =========================================================
   ORDER STATUS
========================================================= */

function getOrderStatusText(status) {

    const statuses = {

        pending: {

            label: "অপেক্ষমাণ",

            className: "pending"

        },

        confirmed: {

            label: "নিশ্চিত হয়েছে",

            className: "confirmed"

        },

        processing: {

            label: "প্রস্তুত করা হচ্ছে",

            className: "processing"

        },

        delivered: {

            label: "ডেলিভারি সম্পন্ন",

            className: "delivered"

        },

        cancelled: {

            label: "বাতিল",

            className: "cancelled"

        }

    };


    return (
        statuses[status] ||
        {

            label: "অপেক্ষমাণ",

            className: "pending"

        }
    );

}


/* =========================================================
   TOAST
========================================================= */

function showToast(message, type = "success") {

    let toast =
        document.getElementById(
            "siteToast"
        );


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );

        toast.id =
            "siteToast";

        toast.className =
            "site-toast";


        document.body.appendChild(
            toast
        );

    }


    toast.className =
        "site-toast " +
        type;


    toast.innerHTML = `

        <i class="${
            type === "error"
                ? "fa-solid fa-circle-exclamation"
                : "fa-solid fa-circle-check"
        }"></i>

        <span>
            ${escapeHtml(message)}
        </span>

    `;


    requestAnimationFrame(
        function() {

            toast.classList.add(
                "show"
            );

        }
    );


    clearTimeout(
        toast._timer
    );


    toast._timer =
        setTimeout(
            function() {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


/* =========================================================
   ESCAPE ATTRIBUTE
========================================================= */

function escapeAttribute(value) {

    return escapeHtml(
        value
    );

}


/* =========================================================
   CLOSE MODALS WHEN CLICKING OUTSIDE
========================================================= */

document.addEventListener(
    "click",
    function(event) {

        const checkoutModal =
            document.getElementById(
                "checkoutModal"
            );


        const successModal =
            document.getElementById(
                "successModal"
            );


        if (
            checkoutModal &&
            event.target === checkoutModal
        ) {

            closeCheckout();

        }


        if (
            successModal &&
            event.target === successModal
        ) {

            closeSuccess();

        }

    }
);


/* =========================================================
   ESC KEY
========================================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape"
        ) {

            closeCart();

            closeCheckout();

            closeSuccess();

        }

    }
);


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        updateCart();

        renderCategories();

        renderProducts(
            getFilteredProducts()
        );

    }
);