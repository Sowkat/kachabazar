const defaultProducts = [
    { id: 1, name: "আলু (দেশি)", price: 45, category: "vegetable", img: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300" },
    { id: 2, name: "পেঁয়াজ (দেশি)", price: 80, category: "vegetable", img: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8ce?w=300" },
    { id: 3, name: "টমেটো", price: 60, category: "vegetable", img: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300" },
    { id: 4, name: "কাঁচামরিচ", price: 120, category: "vegetable", img: "https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?w=300" }
];

let products = JSON.parse(localStorage.getItem('sb_products')) || defaultProducts;
let savedPass = localStorage.getItem('sb_admin_pass') || '1234';
let cart = [];
let currentCategory = 'all';

function filterCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    const catNames = {
        'all': 'সকল পণ্যসমূহ',
        'vegetable': 'শাক-সবজি',
        'fruit': 'ফলমূল',
        'grocery': 'মশলা ও নিত্যপণ্য'
    };
    document.getElementById('catTitle').innerText = catNames[cat] || 'পণ্যসমূহ';
    renderProducts();
}

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';

    const filtered = currentCategory === 'all' 
        ? products 
        : products.filter(p => p.category === currentCategory);

    if (filtered.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; color: #777;">এই ক্যাটাগরিতে কোনো পণ্য নেই।</p>';
        return;
    }

    filtered.forEach(p => {
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
            qty: qtyVal,
            unit: unit,
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

function processOrder(type) {
    if (cart.length === 0) return alert('আপনার কার্ট খালি!');
    const name = document.getElementById('custName').value;
    const phone = document.getElementById('custPhone').value;
    const village = document.getElementById('custVillage').value;

    if (!name || !phone || !village) return alert('অনুগ্রহ করে নাম, মোবাইল নম্বর এবং গ্রামের নাম লিখুন।');

    let subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    let delivery = subtotal >= 300 ? 0 : 20;
    let grandTotal = subtotal + delivery;

    // মেমো নোটিফিকেশন প্রদর্শন
    let receiptHTML = `<strong>গ্রাহক:</strong> ${name}<br>`;
    receiptHTML += `<strong>ফোন:</strong> ${phone}<br>`;
    receiptHTML += `<strong>ঠিকানা:</strong> ${village}, সাতবাড়ীয়া ইউনিয়ন<br><hr style="margin: 6px 0;">`;
    receiptHTML += `<strong>পণ্যসমূহ:</strong><br>`;

    let orderText = `নতুন কাঁচাবাজার অর্ডার\n`;
    orderText += `নাম: ${name}\nমোবাইল: ${phone}\nইউনিয়ন: সাতবাড়ীয়া\nগ্রাম: ${village}\n\n`;
    orderText += `পণ্যসমূহ:\n`;

    cart.forEach((item, i) => {
        receiptHTML += `${i + 1}. ${item.name} - ${item.qty}${item.unit} (${item.totalPrice.toFixed(0)}টাকা)<br>`;
        orderText += `${i + 1}. ${item.name} - ${item.qty}${item.unit} (${item.totalPrice.toFixed(0)}টাকা)\n`;
    });

    receiptHTML += `<hr style="margin: 6px 0;">`;
    receiptHTML += `পণ্যের দাম: ৳${subtotal.toFixed(0)}<br>`;
    receiptHTML += `ডেলিভারি চার্জ: ${delivery === 0 ? 'ফ্রি' : '৳' + delivery}<br>`;
    receiptHTML += `<strong>সর্বমোট বিল: ৳${grandTotal.toFixed(0)}</strong>`;

    orderText += `\nমোট: ${subtotal.toFixed(0)}টাকা`;
    orderText += `\nডেলিভারি: ${delivery === 0 ? 'ফ্রি' : delivery + 'টাকা'}`;
    orderText += `\nসর্বমোট: ${grandTotal.toFixed(0)}টাকা`;

    document.getElementById('receiptDetails').innerHTML = receiptHTML;
    document.getElementById('receiptModal').style.display = 'flex';

    const targetNum = "8801960174982";

    if (type === 'wa') {
        window.open(`https://wa.me/${targetNum}?text=${encodeURIComponent(orderText)}`, '_blank');
    } else if (type === 'sms') {
        window.open(`sms:${targetNum}?body=${encodeURIComponent(orderText)}`, '_blank');
    } else if (type === 'call') {
        window.open(`tel:01960174982`, '_self');
    }
}

function closeReceiptModal() {
    document.getElementById('receiptModal').style.display = 'none';
    cart = [];
    updateCart();
}

// Admin Portal
function openAdminModal() { document.getElementById('adminModal').style.display = 'flex'; }
function closeAdminModal() { document.getElementById('adminModal').style.display = 'none'; }

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
    const category = document.getElementById('newProdCat').value;
    const fileInput = document.getElementById('newProdImgFile');

    if (!name || !price) return alert('নাম এবং মূল্য দিন');

    let imgData = 'https://via.placeholder.com/150';

    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            imgData = e.target.result;
            saveProductObj(name, price, category, imgData);
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        saveProductObj(name, price, category, imgData);
    }
}

function saveProductObj(name, price, category, img) {
    const newP = { id: Date.now(), name, price, category, img };
    products.push(newP);
    localStorage.setItem('sb_products', JSON.stringify(products));
    renderProducts();
    alert('পণ্য সফলভাবে যোগ করা হয়েছে!');
    document.getElementById('newProdName').value = '';
    document.getElementById('newProdPrice').value = '';
    document.getElementById('newProdImgFile').value = '';
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

renderProducts();
