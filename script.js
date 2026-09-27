// ডিফল্ট পণ্যসমূহ (কমপক্ষে ৪টি)
const defaultProducts = [
    { id: 1, name: "আলু (দেশি)", price: 45, img: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300" },
    { id: 2, name: "পেঁয়াজ (দেশি)", price: 80, img: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8ce?w=300" },
    { id: 3, name: "টমেটো", price: 60, img: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300" },
    { id: 4, name: "কাঁচামরিচ", price: 120, img: "https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?w=300" }
];

let products = JSON.parse(localStorage.getItem('sb_products')) || defaultProducts;
let savedPass = localStorage.getItem('sb_admin_pass') || '1234';
let cart = [];

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';
    products.forEach(p => {
        grid.innerHTML += `
            <div class="product-card">
                <img src="${p.img}" class="product-img" alt="${p.name}">
                <div class="product-title">${p.name}</div>
                <div class="product-price">৳ ${p.price} / কেজি</div>
                <div class="qty-controls">
                    <input type="number" id="qty-${p.id}" value="1" min="0.1" step="0.1">
                    <select id="unit-${p.id}">
                        <option value="kg">কেজি</option>
                        <option value="gm">গ্রাম</option>
                    </select>
                </div>
                <button class="add-btn" onclick="addToCart(${p.id})">কার্টে যোগ করুন</button>
            </div>
        `;
    });
}

function addToCart(pId) {
    const product = products.find(p => p.id === pId);
    let qtyVal = parseFloat(document.getElementById(`qty-${pId}`).value);
    const unit = document.getElementById(`unit-${pId}`).value;

    if (!qtyVal || qtyVal <= 0) return alert('সঠিক পরিমাণ দিন');

    let qtyInKg = unit === 'gm' ? qtyVal / 1000 : qtyVal;
    let itemPrice = product.price * qtyInKg;

    const existingIndex = cart.findIndex(c => c.id === pId && c.unit === unit);
    if (existingIndex > -1) {
        cart[existingIndex].qty += qtyVal;
        cart[existingIndex].totalPrice += itemPrice;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            pricePerKg: product.price,
            qty: qtyVal,
            unit: unit,
            qtyInKg: qtyInKg,
            totalPrice: itemPrice
        });
    }
    updateCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}

function updateCart() {
    const cartContainer = document.getElementById('cartItems');
    if (cart.length === 0) {
        cartContainer.innerHTML = '<p style="color: #777; font-size: 0.9rem;">কার্ট খালি রয়েছে।</p>';
        document.getElementById('subTotal').innerText = '৳ 0';
        document.getElementById('deliveryCharge').innerText = '৳ 0';
        document.getElementById('grandTotal').innerText = '৳ 0';
        return;
    }

    cartContainer.innerHTML = '';
    let subtotal = 0;

    cart.forEach((item, index) => {
        subtotal += item.totalPrice;
        cartContainer.innerHTML += `
            <div class="cart-item">
                <div>
                    <strong>${item.name}</strong> - ${item.qty} ${item.unit}
                </div>
                <div>
                    ৳ ${item.totalPrice.toFixed(0)}
                    <span class="remove-item" onclick="removeFromCart(${index})">&times;</span>
                </div>
            </div>
        `;
    });

    let delivery = subtotal >= 300 ? 0 : 20;
    let grandTotal = subtotal + delivery;

    document.getElementById('subTotal').innerText = `৳ ${subtotal.toFixed(0)}`;
    document.getElementById('deliveryCharge').innerText = delivery === 0 ? 'ফ্রি' : `৳ ${delivery}`;
    document.getElementById('grandTotal').innerText = `৳ ${grandTotal.toFixed(0)}`;
}

function sendWhatsAppOrder() {
    if (cart.length === 0) return alert('আপনার কার্ট খালি!');
    const name = document.getElementById('custName').value;
    const phone = document.getElementById('custPhone').value;
    const village = document.getElementById('custVillage').value;

    if (!name || !phone || !village) return alert('অনুগ্রহ করে নাম, মোবাইল নম্বর এবং গ্রামের নাম লিখুন।');

    let subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    let delivery = subtotal >= 300 ? 0 : 20;
    let grandTotal = subtotal + delivery;

    let orderText = `*নতুন অনলাইন বাজার অর্ডার*\n\n`;
    orderText += `*গ্রাহকের তথ্য:*\nনাম: ${name}\nমোবাইল: ${phone}\nইউনিয়ন: সাতবাড়ীয়া ইউনিয়ন\nগ্রাম/এলাকা: ${village}\n\n`;
    orderText += `*অর্ডারকৃত পণ্যসমূহ:*\n`;

    cart.forEach((item, i) => {
        orderText += `${i + 1}. ${item.name} - ${item.qty} ${item.unit} (৳${item.totalPrice.toFixed(0)})\n`;
    });

    orderText += `\n*পণ্যের মোট দাম:* ৳${subtotal.toFixed(0)}`;
    orderText += `\n*ডেলিভারি চার্জ:* ${delivery === 0 ? 'ফ্রি' : '৳' + delivery}`;
    orderText += `\n*সর্বমোট বিল:* ৳${grandTotal.toFixed(0)}`;

    const targetWhatsApp = "8801960174982";
    const url = `https://wa.me/${targetWhatsApp}?text=${encodeURIComponent(orderText)}`;
    window.open(url, '_blank');
}

// অ্যাডমিন প্যানেল ফাংশন
function openAdminModal() {
    document.getElementById('adminModal').style.display = 'flex';
}
function closeAdminModal() {
    document.getElementById('adminModal').style.display = 'none';
}
function checkAdminPassword() {
    const pass = document.getElementById('adminPassword').value;
    if (pass === savedPass) {
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
    } else {
        alert('ভুল পাসওয়ার্ড!');
    }
}
function addNewProduct() {
    const name = document.getElementById('newProdName').value;
    const price = parseFloat(document.getElementById('newProdPrice').value);
    const img = document.getElementById('newProdImg').value || 'https://via.placeholder.com/150';

    if (!name || !price) return alert('নাম এবং মূল্য দিন');

    const newP = { id: Date.now(), name, price, img };
    products.push(newP);
    localStorage.setItem('sb_products', JSON.stringify(products));
    renderProducts();
    alert('পণ্য সফলভাবে যোগ করা হয়েছে!');
    document.getElementById('newProdName').value = '';
    document.getElementById('newProdPrice').value = '';
    document.getElementById('newProdImg').value = '';
}
function changePassword() {
    const curr = document.getElementById('currPass').value;
    const newP = document.getElementById('newPass').value;

    if (curr !== savedPass) return alert('বর্তমান পাসওয়ার্ড ভুল!');
    if (!newP) return alert('নতুন পাসওয়ার্ড টাইপ করুন');

    savedPass = newP;
    localStorage.setItem('sb_admin_pass', newP);
    alert('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!');
    document.getElementById('currPass').value = '';
    document.getElementById('newPass').value = '';
}

// অ্যাপ চালু করা
renderProducts();
