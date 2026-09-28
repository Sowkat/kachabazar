/* =========================================================
   ১০ নং সাতবাড়ীয়া কাঁচাবাজার
   Customer Website - Main Script
========================================================= */

let products = [];
let cart = [];
let selectedCategory = "all";
let directOrderAction = "firebase";

try {
    const savedCart = localStorage.getItem("kachabazar_cart");
    if (savedCart) {
        cart = JSON.parse(savedCart);
        if (!Array.isArray(cart)) cart = [];
    }
} catch (error) {
    cart = [];
}

/* =========================================================
   Firebase
========================================================= */

const database = firebase.database();

/* =========================================================
   Cart Storage
========================================================= */

function saveCart() {
    localStorage.setItem("kachabazar_cart", JSON.stringify(cart));
}

/* =========================================================
   Firebase Products
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
   Product Image
========================================================= */

function getProductImage(product) {

    return (
        product.image ||
        product.productImage ||
        "https://via.placeholder.com/600x400?text=Product"
    );

}

/* =========================================================
   Categories
========================================================= */

function renderCategories() {

    const categoryList = document.getElementById("categoryList");

    if (!categoryList) return;

    const categories = [];

    products.forEach(function(product) {

        if (
            product.category &&
            !categories.includes(product.category)
        ) {
            categories.push(product.category);
        }

    });

    let html = `
        <button
            type="button"
            class="category-btn ${selectedCategory === "all" ? "active" : ""}"
            onclick="selectCategory('all')"
        >
            সব পণ্য
        </button>
    `;

    categories.forEach(function(category) {

        html += `
            <button
                type="button"
                class="category-btn ${selectedCategory === category ? "active" : ""}"
                onclick="selectCategory('${escapeAttribute(category)}')"
            >
                ${escapeHtml(category)}
            </button>
        `;

    });

    categoryList.innerHTML = html;
}

/* =========================================================
   Category Select
========================================================= */

function selectCategory(category) {

    selectedCategory = category;

    renderCategories();

    filterProducts();

}

/* =========================================================
   Search
========================================================= */

function filterProducts() {

    const searchInput = document.getElementById("searchInput");

    const searchText = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    let filtered = products.filter(function(product) {

        const categoryMatch =
            selectedCategory === "all" ||
            product.category === selectedCategory;

        const searchMatch =
            !searchText ||
            String(product.name || "")
                .toLowerCase()
                .includes(searchText) ||
            String(product.category || "")
                .toLowerCase()
                .includes(searchText);

        return categoryMatch && searchMatch;

    });

    renderProducts(filtered);

}

/* =========================================================
   Search Input
========================================================= */

document.addEventListener("DOMContentLoaded", function() {

    const searchInput = document.getElementById("searchInput");

    if (searchInput) {

        searchInput.addEventListener("input", function() {
            filterProducts();
        });

    }

});

/* =========================================================
   Render Products
========================================================= */

function renderProducts(list) {

    const productList = document.getElementById("productList");
    const loading = document.getElementById("productsLoading");
    const noProducts = document.getElementById("noProducts");
    const productCount = document.getElementById("productCount");

    if (!productList) return;

    if (loading) {
        loading.style.display = "none";
    }

    if (productCount) {
        productCount.textContent =