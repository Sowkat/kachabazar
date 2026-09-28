/* =========================================================
   ১০ নং সাতবাড়ীয়া কাঁচাবাজার
   CUSTOMER WEBSITE - MAIN JAVASCRIPT
========================================================= */

let products = [];
let cart = [];
let selectedCategory = "all";
let directOrderAction = "firebase";


/* =========================================================
   LOAD SAVED CART
========================================================= */

try {
    const savedCart = localStorage.getItem("kachabazar_cart");

    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
} catch (error) {
    cart = [];
}


/* =========================================================
   SAVE CART
========================================================= */

function saveCart() {
    localStorage.setItem(
        "kachabazar_cart",
        JSON.stringify(cart)
    );
}


/* =========================================================
   FIREBASE
========================================================= */

const database = firebase.database();


/* =========================================================
   LOAD PRODUCTS
========================================================= */

database.ref("products").on("value", function(snapshot) {

    const data = snapshot.val();

    products = [];

    if (data) {

        Object.keys(data).forEach(function(id) {

            const product = data[id];

            if (product && product.available !== false) {

                products.push({
                    id: id,
                    ...product
                });

            }

        });

    }

    renderCategories();
    renderProducts(products);
    updateCart();

}, function(error) {

    console.error("Products loading error:", error);

});


/* =========================================================
   RENDER CATEGORIES
========================================================= */

function renderCategories() {

    const categoryList =
        document.getElementById("categoryList");

    if (!categoryList) return;

    const categories = [];

    products.forEach(function(product) {

        const category =
            product.category || "অন্যান্য";

        if (!categories.includes(category)) {
            categories.push(category);
        }

    });

    categoryList.innerHTML = "";

    const allButton =
        document.createElement("button");

    allButton.className =
        selectedCategory === "all"
            ? "category-button active"
            : "category-button";

    allButton.textContent = "সব পণ্য";

    allButton.onclick = function() {
        filterCategory("all", allButton);
    };

    categoryList.appendChild(allButton);

    categories.forEach(function(category) {

        const button =
            document.createElement("button");

        button.className =
            selectedCategory === category
                ? "category-button active"
                : "category-button";

        button.textContent = category;

        button.onclick = function() {
            filterCategory(category, button);
        };

        categoryList.appendChild(button);

    });

}


/* =========================================================
   FILTER CATEGORY
========================================================= */

function filterCategory(category, button) {

    selectedCategory = category;

    document
        .querySelectorAll(".category-button")
        .forEach(function(item) {
            item.classList.remove("active");
        });

    if (button) {
        button.classList.add("active");
    }

    searchProducts();

}


/* =========================================================
   SEARCH
========================================================= */

function searchProducts() {

    const input =
        document.getElementById("searchInput");

    const searchText =
        input
            ? input.value.trim().toLowerCase()
            : "";

    const filtered =
        products.filter(function(product) {

            const name =
                String(product.name || "").toLowerCase();

            const category =
                String(product.category || "").toLowerCase();

            const description =
                String(product.description || "").toLowerCase();

            const matchesSearch =
                !searchText ||
                name.includes(searchText) ||
                category.includes(searchText) ||
                description.includes(searchText);

            const matchesCategory =
                selectedCategory === "all" ||
                product.category === selectedCategory;

            return matchesSearch && matchesCategory;

        });

    renderProducts(filtered);

}


/* =========================================================
   PRODUCT IMAGE
   Supports both image and productImage
========================================================= */

function getProductImage(product) {

    return (
        product.image ||
        product.productImage ||
        "https://via.placeholder.com/600x400?text=Product"
    );

}


/* =========================================================
   RENDER PRODUCTS
========================================================= */

function renderProducts(list) {

    const container =
        document.getElementById("productList");

    const loading =
        document.getElementById("productsLoading");

    const empty =
        document.getElementById("noProducts");

    const count =
        document.getElementById("productCount");

    if (!container) return;

    if (loading) {
        loading.style.display = "none";
    }

    container.innerHTML = "";

    if (count) {
        count.textContent =
            list.length + " টি পণ্য";
    }

    if (!list.length) {

        if (empty) {
            empty.style.display = "block";
        }

        return;
    }

    if (empty) {
        empty.style.display = "none";
    }

    list.forEach(function(product) {

        const card =
            document.createElement("div");

        card.className = "product-card";

        const image =
            getProductImage(product);

        const price =
            Number(product.price || 0);

        const stock =
            Number(product.stock || 0);

        const unit =
            product.unit || "পিস";

        const category =
            product.category || "অন্যান্য";

        const description =
            product.description || "";

        const outOfStock =
            stock <= 0;

        card.innerHTML = `

            <img
                class="product-image"
                src="${escapeHtml(image)}"
                alt="${escapeHtml(product.name || "পণ্য")}"
                loading="lazy"
                onerror="this.src='https://via.placeholder.com/600x400?text=No+Image'"
            >

            <div class="product-body">

                <div class="product-category">
                    ${escapeHtml(category)}
                </div>

                <h3 class="product-name">
                    ${escapeHtml(product.name || "পণ্য")}
                </h3>

                <p class="product-description">
                    ${escapeHtml(description)}
                </p>

                <div class="product-bottom">

                    <div>
                        <div class="product-price">
                            ৳${formatNumber(price)}
                        </div>

                        <div class="product-unit">
                            প্রতি ${escapeHtml(unit)}
                        </div>
                    </div>

                </div>

                ${
                    stock > 0 && stock <= 5
                    ? `
                        <div class="stock-warning">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            মাত্র ${stock} ${escapeHtml(unit)} বাকি
                        </div>
                    `
                    : ""
                }

                <button
                    class="add-cart-button"
                    onclick="addToCart('${product.id}')"
                    ${outOfStock ? "disabled" : ""}
                >
                    ${
                        outOfStock
                        ? "স্টক শেষ"
                        : '<i class="fa-solid fa-cart-plus"></i> কার্টে যোগ করুন'
                    }
                </button>

            </div>
        `;

        container.appendChild(card);

    });

}


/* =========================================================
   ADD TO CART
========================================================= */

function addToCart(productId) {

    const product =
        products.find(function(item) {
            return item.id === productId;
        });

    if (!product) {
        alert("পণ্যটি পাওয়া যায়নি।");
        return;
    }

    const stock =
        Number(product.stock || 0);

    if (stock <= 0) {
        alert("দুঃখিত, এই পণ্যটি এখন স্টকে নেই।");
        return;
    }

    const existing =
        cart.find(function(item) {
            return item.id === productId;
        });

    if (existing) {

        if (existing.quantity >= stock) {
            alert("স্টকে যতটি আছে তার বেশি নেওয়া যাবে না।");
            return;
        }

        existing.quantity++;

    } else {

        cart.push({
            id: productId,
            quantity: 1
        });

    }

    saveCart();
    updateCart();

    showToast("পণ্যটি কার্টে যোগ হয়েছে ✓");

}


/* =========================================================
   REMOVE
========================================================= */

function removeFromCart(productId) {

    cart =
        cart.filter(function(item) {
            return item.id !== productId;
        });

    saveCart();
    updateCart();

}


/* =========================================================
   CHANGE QUANTITY
========================================================= */

function changeQuantity(productId, amount) {

    const item =
        cart.find(function(item) {
            return item.id === productId;
        });

    const product =
        products.find(function(item) {
            return item.id === productId;
        });

    if (!item || !product) return;

    const stock =
        Number(product.stock || 0);

    item.quantity += amount;

    if (item.quantity <= 0) {

        removeFromCart(productId);
        return;

    }

    if (item.quantity > stock) {

        item.quantity = stock;

        alert("স্টকের বেশি নেওয়া যাবে না।");

    }

    saveCart();
    updateCart();

}


/* =========================================================
   UPDATE CART
========================================================= */

function updateCart() {

    const cartItems =
        document.getElementById("cartItems");

    const cartCount =
        document.getElementById("cartCount");

    const subtotalElement =
        document.getElementById("cartSubtotal");

    const deliveryElement =
        document.getElementById("cartDelivery");

    const totalElement =
        document.getElementById("cartTotal");

    if (!cartItems) return;

    let subtotal = 0;
    let totalQuantity = 0;

    if (!cart.length) {

        cartItems.innerHTML = `
            <div class="cart-empty">
                <i class="fa-solid fa-cart-shopping"></i>
                <p>কার্টে এখনো কোনো পণ্য নেই।</p>
            </div>
        `;

    } else {

        cartItems.innerHTML = "";

        cart.forEach(function(item) {

            const product =
                products.find(function(product) {
                    return product.id === item.id;
                });

            if (!product) return;

            const price =
                Number(product.price || 0);

            const quantity =
                Number(item.quantity || 1);

            subtotal += price * quantity;
            totalQuantity += quantity;

            const div =
                document.createElement("div");

            div.className = "cart-item";

            div.innerHTML = `

                <img
                    class="cart-item-image"
                    src="${escapeHtml(getProductImage(product))}"
                    alt="${escapeHtml(product.name || "পণ্য")}"
                >

                <div class="cart-item-info">

                    <h4>
                        ${escapeHtml(product.name || "পণ্য")}
                    </h4>

                    <div class="cart-item-price">
                        ৳${formatNumber(price)}
                    </div>

                    <div class="quantity-control">

                        <button
                            onclick="changeQuantity('${item.id}', -1)"
                        >−</button>

                        <strong>${quantity}</strong>

                        <button
                            onclick="changeQuantity('${item.id}', 1)"
                        >+</button>

                    </div>

                </div>

                <button
                    class="remove-cart"
                    onclick="removeFromCart('${item.id}')"
                >
                    <i class="fa-solid fa-trash"></i>
                </button>

            `;

            cartItems.appendChild(div);

        });

    }

    const delivery =
        calculateDelivery(subtotal);

    const total =
        subtotal + delivery;

    if (cartCount) {
        cartCount.textContent = totalQuantity;
    }

    if (subtotalElement) {
        subtotalElement.textContent =
            formatNumber(subtotal);
    }

    if (deliveryElement) {
        deliveryElement.textContent =
            formatNumber(delivery);
    }

    if (totalElement) {
        totalElement.textContent =
            formatNumber(total);
    }

    updateCheckoutSummary();

}


/* =========================================================
   DELIVERY
========================================================= */

function calculateDelivery(subtotal) {

    const settings =
        window.shopSettings || {};

    return Number(
        settings.deliveryCharge || 0
    );

}


/* =========================================================
   OPEN CART
========================================================= */

function openCart() {

    const sidebar =
        document.getElementById("cartSidebar");

    const overlay =
        document.getElementById("cartOverlay");

    if (sidebar) {
        sidebar.classList.add("show");
    }

    if (overlay) {
        overlay.classList.add("show");
    }

}


/* =========================================================
   CLOSE CART
========================================================= */

function closeCart() {

    const sidebar =
        document.getElementById("cartSidebar");

    const overlay =
        document.getElementById("cartOverlay");

    if (sidebar) {
        sidebar.classList.remove("show");
    }

    if (overlay) {
        overlay.classList.remove("show");
    }

}


/* =========================================================
   OPEN CHECKOUT
========================================================= */

function openCheckout(action = "firebase") {

    if (!cart.length) {

        alert("প্রথমে কার্টে অন্তত একটি পণ্য যোগ করুন।");
        return;

    }

    const minimum =
        Number(
            (window.shopSettings || {}).minimumOrder || 0
        );

    const subtotal =
        getCartSubtotal();

    if (
        minimum > 0 &&
        subtotal < minimum
    ) {

        alert(
            "Minimum Order Amount হলো ৳" +
            formatNumber(minimum)
        );

        return;
    }

    directOrderAction = action;

    updateCheckoutSummary();
    updateDirectOrderLinks();

    const modal =
        document.getElementById("checkoutModal");

    if (modal) {
        modal.classList.add("show");
    }

}


/* =========================================================
   CLOSE CHECKOUT
========================================================= */

function closeCheckout() {

    const modal =
        document.getElementById("checkoutModal");

    if (modal) {
        modal.classList.remove("show");
    }

}


/* =========================================================
   CHECKOUT SUMMARY
========================================================= */

function updateCheckoutSummary() {

    const subtotal =
        getCartSubtotal();

    const delivery =
        calculateDelivery(subtotal);

    const total =
        subtotal + delivery;

    const subtotalElement =
        document.getElementById("checkoutSubtotal");

    const deliveryElement =
        document.getElementById("checkoutDelivery");

    const totalElement =
        document.getElementById("checkoutTotal");

    if (subtotalElement) {
        subtotalElement.textContent =
            formatNumber(subtotal);
    }

    if (deliveryElement) {
        deliveryElement.textContent =
            formatNumber(delivery);
    }

    if (totalElement) {
        totalElement.textContent =
            formatNumber(total);
    }

}


/* =========================================================
   SUBTOTAL
========================================================= */

function getCartSubtotal() {

    let subtotal = 0;

    cart.forEach(function(item) {

        const product =
            products.find(function(product) {
                return product.id === item.id;
            });

        if (!product) return;

        subtotal +=
            Number(product.price || 0) *
            Number(item.quantity || 0);

    });

    return subtotal;

}


/* =========================================================
   CHECKOUT FORM
========================================================= */

const checkoutForm =
    document.getElementById("checkoutForm");

if (checkoutForm) {

    checkoutForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();

            placeOrder();

        }
    );

}


/* =========================================================
   PLACE ORDER
========================================================= */

async function placeOrder() {

    if (!cart.length) {
        alert("কার্ট খালি।");
        return;
    }

    const name =
        document.getElementById("customerName").value.trim();

    const phone =
        document.getElementById("customerPhone").value.trim();

    const address =
        document.getElementById("customerAddress").value.trim();

    const note =
        document.getElementById("customerNote").value.trim();

    if (!name || !phone || !address) {

        alert(
            "নাম, মোবাইল নম্বর ও ঠিকানা দিন।"
        );

        return;

    }

    if (!validateBangladeshPhone(phone)) {

        alert(
            "সঠিক বাংলাদেশি মোবাইল নম্বর দিন।"
        );

        return;

    }

    const subtotal =
        getCartSubtotal();

    const delivery =
        calculateDelivery(subtotal);

    const total =
        subtotal + delivery;

    const orderItems = [];

    cart.forEach(function(item) {

        const product =
            products.find(function(product) {
                return product.id === item.id;
            });

        if (product) {

            orderItems.push({

                productId:
                    product.id,

                name:
                    product.name || "",

                price:
                    Number(product.price || 0),

                unit:
                    product.unit || "পিস",

                quantity:
                    Number(item.quantity || 0),

                image:
                    getProductImage(product)

            });

        }

    });

    if (!orderItems.length) {

        alert("কার্টের পণ্য পাওয়া যাচ্ছে না।");
        return;

    }

    const orderId =
        createOrderId();

    const order = {

        orderId: orderId,

        customer: {

            name: name,

            phone: phone,

            address: address,

            note: note

        },

        items: orderItems,

        subtotal: subtotal,

        deliveryCharge: delivery,

        total: total,

        paymentMethod: "Cash on Delivery",

        status: "নতুন",

        createdAt: Date.now(),

        createdAtText:
            new Date().toLocaleString("bn-BD")

    };

    const button =
        document.getElementById("placeOrderButton");

    if (button) {

        button.disabled = true;

        button.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> অর্ডার তৈরি হচ্ছে...';

    }

    try {

        /*
        ======================================================
        FIREBASE ORDER
        ======================================================
        */

        await database
            .ref("orders/" + orderId)
            .set(order);


        /*
        ======================================================
        DIRECT ACTION
        ======================================================
        */

        if (
            directOrderAction === "whatsapp"
        ) {

            openWhatsAppOrder();

        }

        else if (
            directOrderAction === "sms"
        ) {

            openSMSOrder();

        }

        else if (
            directOrderAction === "call"
        ) {

            callOrder();

        }


        /*
        ======================================================
        CLEAR CART
        ======================================================
        */

        cart = [];

        saveCart();

        updateCart();

        closeCheckout();


        /*
        ======================================================
        SUCCESS
        ======================================================
        */

        const successId =
            document.getElementById("successOrderId");

        if (successId) {
            successId.textContent = orderId;
        }

        const successModal =
            document.getElementById("successModal");

        if (
            successModal &&
            directOrderAction === "firebase"
        ) {

            successModal.classList.add("show");

        }


        localStorage.setItem(
            "last_order_id",
            orderId
        );

        checkoutForm.reset();


    } catch (error) {

        console.error(
            "Order error:",
            error
        );

        alert(
            "অর্ডার পাঠানো যায়নি।\n\n" +
            "সমস্যা: " +
            error.message
        );

    }


    if (button) {

        button.disabled = false;

        button.innerHTML =
            '<i class="fa-solid fa-check"></i> অর্ডার নিশ্চিত করুন';

    }

}


/* =========================================================
   CREATE ORDER ID
========================================================= */

function createOrderId() {

    const now = new Date();

    const date =
        now.getFullYear()
        .toString()
        .slice(-2) +

        String(
            now.getMonth() + 1
        ).padStart(2, "0") +

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
        date +
        "-" +
        random
    );

}


/* =========================================================
   BUILD ORDER MESSAGE
========================================================= */

function createOrderMessage() {

    let message =
        "১০ নং সাতবাড়ীয়া কাঁচাবাজার\n\n";

    message += "অর্ডার:\n\n";

    let number = 1;

    cart.forEach(function(item) {

        const product =
            products.find(function(product) {
                return product.id === item.id;
            });

        if (!product) return;

        message +=
            number +
            ". " +
            product.name +
            " × " +
            item.quantity +
            " " +
            (product.unit || "পিস") +
            "\n";

        number++;

    });

    const subtotal =
        getCartSubtotal();

    const delivery =
        calculateDelivery(subtotal);

    const total =
        subtotal + delivery;


    message += "\n";

    message +=
        "মোট পণ্য: " +
        cart.length +
        "টি\n";

    message +=
        "পণ্যের মূল্য: ৳" +
        formatNumber(subtotal) +
        "\n";

    message +=
        "ডেলিভারি চার্জ: ৳" +
        formatNumber(delivery) +
        "\n";

    message +=
        "সর্বমোট: ৳" +
        formatNumber(total) +
        "\n\n";


    const name =
        document.getElementById("customerName");

    const phone =
        document.getElementById("customerPhone");

    const address =
        document.getElementById("customerAddress");

    const note =
        document.getElementById("customerNote");


    message +=
        "নাম: " +
        (name ? name.value.trim() : "") +
        "\n";

    message +=
        "মোবাইল: " +
        (phone ? phone.value.trim() : "") +
        "\n";

    message +=
        "ঠিকানা: " +
        (address ? address.value.trim() : "") +
        "\n";


    if (
        note &&
        note.value.trim()
    ) {

        message +=
            "নোট: " +
            note.value.trim() +
            "\n";

    }


    return message;

}


/* =========================================================
   WHATSAPP
========================================================= */

function openWhatsAppOrder() {

    const settings =
        window.shopSettings || {};

    const whatsapp =
        normalizePhone(
            settings.whatsapp || settings.phone || ""
        );

    if (!whatsapp) {

        alert(
            "WhatsApp নম্বর সেট করা হয়নি।"
        );

        return;

    }

    const message =
        createOrderMessage();

    const url =
        "https://wa.me/" +
        whatsapp +
        "?text=" +
        encodeURIComponent(message);

    window.open(
        url,
        "_blank"
    );

}


/* =========================================================
   SMS
========================================================= */

function openSMSOrder() {

    const settings =
        window.shopSettings || {};

    const phone =
        normalizePhone(
            settings.phone || ""
        );

    if (!phone) {

        alert(
            "দোকানের মোবাইল নম্বর সেট করা হয়নি।"
        );

        return;

    }

    const message =
        createOrderMessage();

    window.location.href =
        "sms:" +
        phone +
        "?body=" +
        encodeURIComponent(message);

}


/* =========================================================
   CALL
========================================================= */

function callOrder() {

    const settings =
        window.shopSettings || {};

    const phone =
        normalizePhone(
            settings.phone || ""
        );

    if (!phone) {

        alert(
            "দোকানের মোবাইল নম্বর সেট করা হয়নি।"
        );

        return;

    }

    window.location.href =
        "tel:" +
        phone;

}


/* =========================================================
   DIRECT ORDER LINKS
========================================================= */

function updateDirectOrderLinks() {

    const settings =
        window.shopSettings || {};

    const whatsapp =
        normalizePhone(
            settings.whatsapp ||
            settings.phone ||
            ""
        );

    const phone =
        normalizePhone(
            settings.phone || ""
        );

    const orderText =
        createOrderMessage();


    const whatsappButton =
        document.getElementById(
            "whatsappOrderButton"
        );

    if (
        whatsappButton &&
        whatsapp
    ) {

        whatsappButton.href =
            "https://wa.me/" +
            whatsapp +
            "?text=" +
            encodeURIComponent(orderText);

    }


    const callButton =
        document.getElementById(
            "callOrderButton"
        );

    if (
        callButton &&
        phone
    ) {

        callButton.href =
            "tel:" +
            phone;

    }


    const smsButton =
        document.getElementById(
            "smsOrderButton"
        );

    if (
        smsButton &&
        phone
    ) {

        smsButton.href =
            "sms:" +
            phone +
            "?body=" +
            encodeURIComponent(orderText);

    }

}


/* =========================================================
   TRACK ORDER
========================================================= */

function trackOrder() {

    const input =
        document.getElementById("trackingInput");

    const result =
        document.getElementById("trackingResult");

    if (!input || !result) return;

    const orderId =
        input.value.trim();

    if (!orderId) {

        result.innerHTML = `
            <div class="tracking-result">
                <p>
                    <i class="fa-solid fa-circle-exclamation"></i>
                    Order ID লিখুন।
                </p>
            </div>
        `;

        return;

    }

    result.innerHTML = `
        <div class="loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            অর্ডার খোঁজা হচ্ছে...
        </div>
    `;

    database
        .ref("orders/" + orderId)
        .once("value")
        .then(function(snapshot) {

            const order =
                snapshot.val();

            if (!order) {

                result.innerHTML = `
                    <div class="tracking-result">
                        <p>
                            <i class="fa-solid fa-circle-xmark"></i>
                            এই Order ID পাওয়া যায়নি।
                        </p>
                    </div>
                `;

                return;

            }

            result.innerHTML = `

                <div class="order-track-card">

                    <h3>
                        Order ID:
                        ${escapeHtml(order.orderId)}
                    </h3>

                    <p>
                        <strong>নাম:</strong>
                        ${escapeHtml(
                            order.customer?.name || ""
                        )}
                    </p>

                    <p>
                        <strong>মোট:</strong>
                        ৳${formatNumber(order.total || 0)}
                    </p>

                    <p>
                        <strong>স্ট্যাটাস:</strong>
                        ${escapeHtml(
                            order.status || "নতুন"
                        )}
                    </p>

                </div>

            `;

        })
        .catch(function(error) {

            console.error(error);

            result.innerHTML = `
                <p>
                    অর্ডার খুঁজতে সমস্যা হয়েছে।
                </p>
            `;

        });

}


/* =========================================================
   SUCCESS
========================================================= */

function closeSuccess() {

    const modal =
        document.getElementById("successModal");

    if (modal) {
        modal.classList.remove("show");
    }

}


/* =========================================================
   PHONE
========================================================= */

function normalizePhone(phone) {

    let number =
        String(phone || "")
            .replace(/\D/g, "");

    if (number.startsWith("01")) {
        number = "88" + number;
    }

    return number;

}


/* =========================================================
   PHONE VALIDATION
========================================================= */

function validateBangladeshPhone(phone) {

    const number =
        phone.replace(/\D/g, "");

    return /^01[3-9]\d{8}$/.test(number);

}


/* =========================================================
   NUMBER FORMAT
========================================================= */

function formatNumber(number) {

    return Number(
        number || 0
    ).toLocaleString("bn-BD");

}


/* =========================================================
   ESCAPE HTML
========================================================= */

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

function showToast(message) {

    let toast =
        document.getElementById("siteToast");

    if (!toast) {

        toast =
            document.createElement("div");

        toast.id = "siteToast";

        toast.style.position = "fixed";
        toast.style.left = "50%";
        toast.style.bottom = "25px";
        toast.style.transform = "translateX(-50%)";
        toast.style.background = "#168a45";
        toast.style.color = "#fff";
        toast.style.padding = "11px 18px";
        toast.style.borderRadius = "9px";
        toast.style.zIndex = "5000";
        toast.style.boxShadow =
            "0 5px 20px rgba(0,0,0,.2)";

        document.body.appendChild(toast);

    }

    toast.textContent = message;

    toast.style.display = "block";

    clearTimeout(window.toastTimer);

    window.toastTimer =
        setTimeout(function() {

            toast.style.display = "none";

        }, 2200);

}


/* =========================================================
   CLOSE MODALS OUTSIDE
========================================================= */

document.addEventListener(
    "click",
    function(event) {

        const checkout =
            document.getElementById("checkoutModal");

        const success =
            document.getElementById("successModal");

        if (
            checkout &&
            event.target === checkout
        ) {
            closeCheckout();
        }

        if (
            success &&
            event.target === success
        ) {
            closeSuccess();
        }

    }
);


/* =========================================================
   ESC
========================================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Escape") {

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

    }
);