let products = [];
let savedPass = '1234';
let savedNotice = 'স্বাগতম! আমাদের কাঁচাবাজারে টাটকা সবজি ও ফলমূল পাওয়া যায়। আজই অর্ডার করুন এবং ঘরে বসেই ডেলিভারি পান!';
let cart = [];
let currentCategory = 'all';
const merchantPhone = "01960174982";

// ১. ফায়ারবেস থেকে রিয়েলটাইমে নোটিশ লোড করা
database.ref('notice').on('value', (snapshot) => {
    const val = snapshot.val();
    if (val) {
        savedNotice = val;
        document.getElementById('scrollNotice').innerText = savedNotice;
    } else {
        document.getElementById('scrollNotice').innerText = savedNotice;
    }
});

// ২. ফায়ারবেস থেকে রিয়েলটাইমে পাসওয়ার্ড লোড করা
database.ref('admin_pass').on('value', (snapshot) => {
    const val = snapshot.val();
    if (val) savedPass = val;
});

// ৩. ফায়ারবেস থেকে রিয়েলটাইমে পণ্য লোড করা
database.ref('products').on('value', (snapshot) => {
    const data = snapshot.val();
    products = [];
    if (data) {
        Object.keys(data).forEach(key => {
            products.push({ id: key, ...data[key] });
        });
    }
    renderProducts();
    if (document.getElementById('adminPanel').style.display === 'block') {
        renderAdminProductList();
    }
});

function scrollToCart() {
    document.getElementById('cartSection').scrollIntoView({ behavior: 'smooth' });
}

function filterCategory(cat, event) {
    currentCategory = cat;
    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
    if(event) event.target.classList.add('active');

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
        grid.innerHTML = '<p style="grid-column: 1/-1; color: #777; font-size: 0.85rem; text-align: center; padding: 20px;">এই ক্যাটাগরিতে কোনো পণ্য নেই।</p>';
        return;
    }

    filtered.forEach(p => {
        grid.innerHTML += `
            <div class="product-card">
                <img src="${p.img || 'https://via.placeholder.com/150'}" class="product-img" alt="${p.name}">
                <div class="product-title">${p.name}</div>
                <div class="product-price">৳ ${p.price} / কেজি</div>
                <div class="qty-controls">
                    <input type="number" id="qty-${p.id}" value="1" min="0.1" step="0.1">
                    <select id="unit-${p.id}">
                        <option value="kg">কেজি</option>
                        <option value="gm">গ্রাম</option>
                    </select>
                </div>
                <button class="add-btn" onclick="addToCart('${p.id}')">যোগ করুন</button>
            </div>
        `;
    });
}

function addToCart(pId) {
    const product = products.find(p => p.id == pId);
    if (!product) return;

    let qtyVal = parseFloat(document.getElementById(`qty-${pId}`).value);
    const unit = document.getElementById(`unit-${pId}`).value;

    if (!qtyVal || qtyVal <= 0) return alert('সঠিক পরিমাণ দিন');

    let qtyInKg = unit === 'gm' ? qtyVal / 1000 : qtyVal;
    let itemPrice = product.price * qtyInKg;

    const existingIndex = cart.findIndex(c => c.id == pId && c.unit === unit);
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
    const badge = document.getElementById('cartCountBadge');
    const countText = document.getElementById('itemTotalCount');

    let totalItems = cart.length;
    badge.innerText = totalItems;
    countText.innerText = `(${totalItems} টি আইটেম)`;

    if (cart.length === 0) {
        cartContainer.innerHTML = '<p style="color: #777; font-size: 0.85rem; text-align: center; padding: 10px 0;">কার্ট খালি রয়েছে। পণ্য যোগ করুন!</p>';
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

function togglePaymentInfo() {
    const selectedPay = document.querySelector('input[name="payMethod"]:checked').value;
    const infoBox = document.getElementById('mfsInfoBox');
    const instruction = document.getElementById('mfsInstruction');

    if (selectedPay === 'cod') {
        infoBox.style.display = 'none';
    } else {
        infoBox.style.display = 'block';
        let methodText = selectedPay === 'bkash' ? 'বিকাশ' : selectedPay === 'nagad' ? 'নগদ' : 'রকেট';
        instruction.innerHTML = `আপনার ${methodText} অ্যাপ থেকে <strong>${merchantPhone}</strong> (Personal) নম্বরে সর্বমোট বিলের টাকা Send Money করুন।`;
    }
}

function processOrder(type) {
    if (cart.length === 0) return alert('আপনার কার্ট খালি!');
    const name = document.getElementById('custName').value;
    const phone = document.getElementById('custPhone').value;
    const village = document.getElementById('custVillage').value;
    const selectedPay = document.querySelector('input[name="payMethod"]:checked').value;

    if (!name || !phone || !village) return alert('অনুগ্রহ করে নাম, মোবাইল নম্বর এবং গ্রামের নাম লিখুন।');

    let senderNum = "", trxId = "";
    if (selectedPay !== 'cod') {
        senderNum = document.getElementById('paySenderNum').value;
        trxId = document.getElementById('payTrxId').value;
        if (!senderNum || !trxId) {
            return alert('অনুগ্রহ করে আপনার প্রেরক নম্বর এবং ট্রানজেকশন আইডি (TrxID) ইনপুট দিন।');
        }
    }

    let subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    let delivery = subtotal >= 300 ? 0 : 20;
    let grandTotal = subtotal + delivery;

    let payMethodName = selectedPay === 'cod' ? 'ক্যাশ অন ডেলিভারি (Cash on Delivery)' : 
                       selectedPay === 'bkash' ? 'বিকাশ (bKash)' : 
                       selectedPay === 'nagad' ? 'নগদ (Nagad)' : 'রকেট (Rocket)';

    let receiptHTML = `<strong>গ্রাহক:</strong> ${name}<br>`;
    receiptHTML += `<strong>ফোন:</strong> ${phone}<br>`;
    receiptHTML += `<strong>ঠিকানা:</strong> ${village}, সাতবাড়ীয়া ইউনিয়ন<br>`;
    receiptHTML += `<strong>পেমেন্ট পদ্ধতি:</strong> ${payMethodName}<br>`;
    if (selectedPay !== 'cod') {
        receiptHTML += `<strong>প্রেরক নম্বর:</strong> ${senderNum}<br>`;
        receiptHTML += `<strong>TrxID:</strong> ${trxId}<br>`;
    }
    receiptHTML += `<hr style="margin: 4px 0;"><strong>পণ্যসমূহ:</strong><br>`;

    let orderText = `*নতুন কাঁচাবাজার অর্ডার*\n\n`;
    orderText += `*নাম:* ${name}\n`;
    orderText += `*মোবাইল:* ${phone}\n`;
    orderText += `*ঠিকানা:* ${village}, সাতবাড়ীয়া\n`;
    orderText += `*পেমেন্ট পদ্ধতি:* ${payMethodName}\n`;
    if (selectedPay !== 'cod') {
        orderText += `*প্রেরক নম্বর:* ${senderNum}\n`;
        orderText += `*TrxID:* ${trxId}\n`;
    }
    orderText += `\n*পণ্যসমূহ:*\n`;

    cart.forEach((item, i) => {
        receiptHTML += `${i + 1}. ${item.name} - ${item.qty}${item.unit} (${item.totalPrice.toFixed(0)}টাকা)<br>`;
        orderText += `${i + 1}. ${item.name} - ${item.qty}${item.unit} (${item.totalPrice.toFixed(0)}টাকা)\n`;
    });

    receiptHTML += `<hr style="margin: 4px 0;">`;
    receiptHTML += `পণ্যের দাম: ৳${subtotal.toFixed(0)}<br>`;
    receiptHTML += `ডেলিভারি চার্জ: ${delivery === 0 ? 'ফ্রি' : '৳' + delivery}<br>`;
    receiptHTML += `<strong>সর্বমোট বিল: ৳${grandTotal.toFixed(0)}</strong>`;

    orderText += `\n*পণ্যের দাম:* ${subtotal.toFixed(0)} টাকা`;
    orderText += `\n*ডেলিভারি চার্জ:* ${delivery === 0 ? 'ফ্রি' : delivery + ' টাকা'}`;
    orderText += `\n*সর্বমোট বিল:* ${grandTotal.toFixed(0)} টাকা`;

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

function openAdminModal() { document.getElementById('adminModal').style.display = 'flex'; }
function closeAdminModal() { document.getElementById('adminModal').style.display = 'none'; }

function checkAdminPassword() {
    const pass = document.getElementById('adminPassword').value;
    if (pass === savedPass) {
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        document.getElementById('newNoticeText').value = savedNotice;
        renderAdminProductList();
    } else {
        alert('ভুল পাসওয়ার্ড!');
    }
}

function updateNotice() {
    const text = document.getElementById('newNoticeText').value;
    if (!text) return alert('বিজ্ঞপ্তি খালি রাখা যাবে না');
    database.ref('notice').set(text).then(() => {
        alert('বিজ্ঞপ্তি সফলভাবে রিয়েলটাইম ডাটাবেসে পরিবর্তন করা হয়েছে!');
    });
}

function renderAdminProductList() {
    const container = document.getElementById('adminProductList');
    container.innerHTML = '';

    products.forEach(p => {
        container.innerHTML += `
            <div class="admin-prod-item">
                <span><strong>${p.name}</strong> (৳${p.price})</span>
                <div>
                    <button class="admin-action-btn" style="background:#0275d8;" onclick="editProduct('${p.id}')">সম্পাদনা</button>
                    <button class="admin-action-btn" style="background:#d9534f;" onclick="deleteProduct('${p.id}')">মুছে ফেলুন</button>
                </div>
            </div>
        `;
    });
}

function saveProduct() {
    const editId = document.getElementById('editProductId').value;
    const name = document.getElementById('newProdName').value;
    const price = parseFloat(document.getElementById('newProdPrice').value);
    const category = document.getElementById('newProdCat').value;
    const fileInput = document.getElementById('newProdImgFile');

    if (!name || !price) return alert('পণ্যের নাম এবং মূল্য দিন');

    let existingImg = 'https://via.placeholder.com/150';
    if (editId) {
        let p = products.find(item => item.id == editId);
        if (p && p.img) existingImg = p.img;
    }

    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            finishSaveProduct(editId, name, price, category, e.target.result);
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        finishSaveProduct(editId, name, price, category, existingImg);
    }
}

function finishSaveProduct(editId, name, price, category, img) {
    const prodData = { name, price, category, img };

    if (editId) {
        database.ref('products/' + editId).update(prodData).then(() => {
            alert('পণ্য সফলভাবে আপডেট করা হয়েছে!');
            resetProductForm();
        });
    } else {
        database.ref('products').push(prodData).then(() => {
            alert('পণ্য সফলভাবে অনলাইন ডাটাবেসে যোগ করা হয়েছে!');
            resetProductForm();
        });
    }
}

function editProduct(pId) {
    const prod = products.find(p => p.id == pId);
    if (!prod) return;

    document.getElementById('editProductId').value = prod.id;
    document.getElementById('newProdName').value = prod.name;
    document.getElementById('newProdPrice').value = prod.price;
    document.getElementById('newProdCat').value = prod.category;

    document.getElementById('formModeTitle').innerText = 'পণ্য এডিট করুন';
    document.getElementById('saveProductBtn').innerText = 'আপডেট করুন';
    document.getElementById('cancelEditBtn').style.display = 'block';
}

function deleteProduct(pId) {
    if (confirm('আপনি কি সত্যিই এই পণ্যটি অনলাইন থেকে মুছে ফেলতে চান?')) {
        database.ref('products/' + pId).remove().then(() => {
            alert('পণ্যটি মুছে ফেলা হয়েছে!');
        });
    }
}

function resetProductForm() {
    document.getElementById('editProductId').value = '';
    document.getElementById('newProdName').value = '';
    document.getElementById('newProdPrice').value = '';
    document.getElementById('newProdImgFile').value = '';
    document.getElementById('formModeTitle').innerText = 'নতুন পণ্য যোগ করুন';
    document.getElementById('saveProductBtn').innerText = 'পণ্য যোগ করুন';
    document.getElementById('cancelEditBtn').style.display = 'none';
}

function changePassword() {
    const curr = document.getElementById('currPass').value;
    const newP = document.getElementById('newPass').value;

    if (curr !== savedPass) return alert('বর্তমান পাসওয়ার্ড ভুল!');
    if (!newP) return alert('নতুন পাসওয়ার্ড টাইপ করুন');

    database.ref('admin_pass').set(newP).then(() => {
        alert('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!');
        document.getElementById('currPass').value = '';
        document.getElementById('newPass').value = '';
    });
}
