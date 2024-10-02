// script.js

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    loadProductsData();
    loadCart();
    loadOrderHistory();
    setupAdminPanel();
});

// Глобальные переменные
let productsData = {};
let cart = [];
let orderHistory = [];

// Загрузка данных продуктов из localStorage или JSON-файла
function loadProductsData() {
    if (localStorage.getItem('productsData')) {
        productsData = JSON.parse(localStorage.getItem('productsData'));
        loadCategories();
    } else {
        fetch('products.json')
            .then(response => response.json())
            .then(data => {
                productsData = data;
                localStorage.setItem('productsData', JSON.stringify(productsData));
                loadCategories();
            })
            .catch(error => console.error('Ошибка загрузки продуктов:', error));
    }
}

// Загрузка категорий в каталог
function loadCategories() {
    const catalog = document.getElementById('catalog');
    catalog.innerHTML = '';

    for (const category in productsData) {
        const categoryDiv = document.createElement('div');
        categoryDiv.classList.add('category');
        categoryDiv.onclick = () => showCategory(category);

        const img = document.createElement('img');
        img.src = productsData[category].categoryImage;
        img.alt = category;

        const span = document.createElement('span');
        span.textContent = capitalizeFirstLetter(category);

        categoryDiv.appendChild(img);
        categoryDiv.appendChild(span);
        catalog.appendChild(categoryDiv);
    }
}

// Показать продукты выбранной категории
function showCategory(category) {
    document.getElementById('catalog').style.display = 'none';
    document.getElementById('categoryView').style.display = 'block';
    document.getElementById('backButton').style.display = 'block';
    loadProducts(category);
}

// Загрузка продуктов в представление категории
function loadProducts(category) {
    const productsContainer = document.getElementById('products');
    productsContainer.innerHTML = '';

    productsData[category].products.forEach((product, index) => {
        const productDiv = document.createElement('div');
        productDiv.classList.add('product-item');
        productDiv.onclick = () => showProductModal(category, index);

        const img = document.createElement('img');
        img.src = product.image;
        img.alt = product.name;

        const name = document.createElement('span');
        name.textContent = product.name;

        productDiv.appendChild(img);
        productDiv.appendChild(name);
        productsContainer.appendChild(productDiv);
    });
}

// Вернуться к категориям
function goBack() {
    document.getElementById('categoryView').style.display = 'none';
    document.getElementById('catalog').style.display = 'grid';
    document.getElementById('backButton').style.display = 'none';
}

// Показать модальное окно продукта
function showProductModal(category, productIndex) {
    const product = productsData[category].products[productIndex];
    const modal = document.getElementById('productModal');

    document.getElementById('productName').textContent = product.name;
    document.getElementById('productDescription').textContent = product.description;
    document.getElementById('productPrice').textContent = product.price;

    // Заполнение размеров
    const sizeSelect = document.getElementById('sizeSelect');
    sizeSelect.innerHTML = '<option value="" disabled selected>Выберите размер</option>';
    product.sizes.forEach(size => {
        const option = document.createElement('option');
        option.value = size;
        option.textContent = size;
        sizeSelect.appendChild(option);
    });

    // Заполнение цветов
    const colorPalette = document.getElementById('colorPalette');
    colorPalette.innerHTML = '';
    product.colors.forEach(color => {
        const colorDiv = document.createElement('div');
        colorDiv.classList.add('color-swatch');
        colorDiv.style.backgroundColor = color;
        colorDiv.dataset.color = color;
        colorDiv.onclick = () => selectColor(colorDiv);
        colorPalette.appendChild(colorDiv);
    });

    // Очистка предыдущих выборов
    document.getElementById('quantity').value = 1;
    document.getElementById('notes').value = '';
    document.querySelectorAll('.color-swatch').forEach(div => div.classList.remove('selected'));

    // Сохранение текущей информации о продукте
    modal.currentProduct = {
        category: category,
        productIndex: productIndex
    };

    modal.style.display = 'block';
}

// Закрыть модальное окно
function closeModal() {
    document.getElementById('productModal').style.display = 'none';
}

// Выбор цвета
function selectColor(selectedDiv) {
    document.querySelectorAll('.color-swatch').forEach(div => div.classList.remove('selected'));
    selectedDiv.classList.add('selected');
}

// Добавить в корзину
function addToCart() {
    const modal = document.getElementById('productModal');
    const size = document.getElementById('sizeSelect').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    const selectedColorDiv = document.querySelector('.color-swatch.selected');
    const color = selectedColorDiv ? selectedColorDiv.dataset.color : null;
    const notes = document.getElementById('notes').value.trim();

    // Валидация формы
    if (!size) {
        alert('Пожалуйста, выберите размер.');
        return;
    }
    if (isNaN(quantity) || quantity < 1) {
        alert('Пожалуйста, введите корректное количество.');
        return;
    }

    const category = modal.currentProduct.category;
    const product = productsData[category].products[modal.currentProduct.productIndex];

    const cartItem = {
        name: product.name,
        category: capitalizeFirstLetter(category),
        size: size,
        quantity: quantity,
        color: color || 'Не выбран',
        notes: notes || 'Без заметок',
        price: product.price
    };

    cart.push(cartItem);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
    closeModal();
    alert('Товар добавлен в корзину.');
}

// Обновить отображение корзины
function updateCart() {
    const cartItems = document.getElementById('cartItems');
    const totalPrice = document.getElementById('totalPrice');
    cartItems.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${item.name} (${item.size}, Цвет: ${item.color}) x${item.quantity}</span>
            <span>${item.price * item.quantity}₽</span>
        `;
        cartItems.appendChild(li);
        total += item.price * item.quantity;
    });

    totalPrice.textContent = total;
}

// Загрузка корзины из localStorage
function loadCart() {
    if (localStorage.getItem('cart')) {
        cart = JSON.parse(localStorage.getItem('cart'));
        updateCart();
    }
}

// Оформить заказ
function checkout() {
    if (cart.length === 0) {
        alert("Корзина пуста!");
        return;
    }

    if (!confirm("Вы уверены, что хотите оформить заказ?")) {
        return;
    }

    // Добавить заказ в историю
    const order = {
        items: [...cart],
        date: new Date().toLocaleString()
    };
    orderHistory.push(order);
    localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
    loadOrderHistory();

    // Очистить корзину
    cart = [];
    localStorage.removeItem('cart');
    updateCart();

    alert("Заказ успешно оформлен!");
}

// Загрузка истории заказов
function loadOrderHistory() {
    if (localStorage.getItem('orderHistory')) {
        orderHistory = JSON.parse(localStorage.getItem('orderHistory'));
    }
    const orderList = document.getElementById('orderList');
    orderList.innerHTML = '';

    orderHistory.forEach((order, index) => {
        const li = document.createElement('li');
        const total = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        li.innerHTML = `
            <p><strong>Дата заказа:</strong> ${order.date}</p>
            <ul>
                ${order.items.map((item) => `<li>${item.name} (${item.size}, Цвет: ${item.color}) x${item.quantity} - ${item.price * item.quantity}₽${item.notes !== 'Без заметок' ? ` (${item.notes})` : ''}</li>`).join('')}
            </ul>
            <p><strong>Итого:</strong> ${total}₽</p>
            <div class="order-actions">
                <button onclick="editOrder(${index})">Редактировать</button>
                <button onclick="deleteOrder(${index})">Удалить</button>
            </div>
        `;
        orderList.appendChild(li);
    });
}

// Редактировать заказ
function editOrder(orderIndex) {
    const order = orderHistory[orderIndex];
    let newNotes = prompt("Введите новые заметки для заказа:", order.items.map(item => item.notes).join('; '));
    if (newNotes !== null) {
        order.items.forEach(item => {
            item.notes = newNotes;
        });
        localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
        loadOrderHistory();
        alert('Заказ обновлен.');
    }
}

// Удалить заказ
function deleteOrder(orderIndex) {
    if (confirm("Вы уверены, что хотите удалить этот заказ?")) {
        orderHistory.splice(orderIndex, 1);
        localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
        loadOrderHistory();
        alert('Заказ удален.');
    }
}

// Функции административной панели
function setupAdminPanel() {
    const adminToggle = document.getElementById('adminToggle');
    adminToggle.addEventListener('click', toggleAdminPanel);
}

// Переключение административной панели
function toggleAdminPanel() {
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel.style.display === 'block') {
        adminPanel.style.display = 'none';
        alert('Админ панель закрыта');
    } else {
        adminPanel.style.display = 'block';
        loadAdminCategories();
    }
}

// Загрузка категорий в админ панель
function loadAdminCategories() {
    const categoryList = document.getElementById('categoryList');
    categoryList.innerHTML = '';

    for (const category in productsData) {
        const li = document.createElement('li');
        li.textContent = capitalizeFirstLetter(category);

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Редактировать';
        editBtn.onclick = () => editCategory(category);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Удалить';
        deleteBtn.onclick = () => deleteCategory(category);

        li.appendChild(editBtn);
        li.appendChild(deleteBtn);
        categoryList.appendChild(li);
    }

    populateCategorySelect();
}

// Заполнение селектора категорий в админ панели
function populateCategorySelect() {
    const categorySelect = document.getElementById('categorySelect');
    categorySelect.innerHTML = '<option value="" disabled selected>Выберите категорию</option>';
    for (const category in productsData) {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = capitalizeFirstLetter(category);
        categorySelect.appendChild(option);
    }
}

// Добавить категорию
document.getElementById('addCategoryForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const categoryName = document.getElementById('newCategoryName').value.trim().toLowerCase();
    const categoryImage = document.getElementById('newCategoryImage').value.trim();

    if (categoryName && categoryImage) {
        if (!productsData[categoryName]) {
            productsData[categoryName] = {
                categoryImage: categoryImage,
                products: []
            };
            localStorage.setItem('productsData', JSON.stringify(productsData));
            loadCategories();
            loadAdminCategories();
            alert('Категория добавлена.');
            this.reset();
        } else {
            alert('Категория с таким названием уже существует.');
        }
    } else {
        alert('Пожалуйста, заполните все поля.');
    }
});

// Добавить продукт
document.getElementById('addProductForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const category = document.getElementById('categorySelect').value;
    const productName = document.getElementById('productName').value.trim();
    const productDescription = document.getElementById('productDescription').value.trim();
    const productPrice = parseFloat(document.getElementById('productPrice').value.trim());
    const productImage = document.getElementById('productImage').value.trim();
    const productSizes = document.getElementById('productSizes').value.trim().split(',').map(s => s.trim()).filter(s => s);
    const productColors = document.getElementById('productColors').value.trim().split(',').map(c => c.trim()).filter(c => c);
    const productNotes = document.getElementById('productNotes').value.trim();

    if (category && productName && productDescription && !isNaN(productPrice) && productImage && productSizes.length > 0 && productColors.length > 0) {
        const newProduct = {
            name: productName,
            description: productDescription,
            price: productPrice,
            image: productImage,
            sizes: productSizes,
            colors: productColors,
            notes: productNotes || 'Без заметок.'
        };

        productsData[category].products.push(newProduct);
        localStorage.setItem('productsData', JSON.stringify(productsData));
        loadProducts(category);
        alert('Продукт добавлен.');
        this.reset();
    } else {
        alert('Пожалуйста, заполните все поля корректно.');
    }
});

// Редактировать категорию
function editCategory(category) {
    const newCategoryName = prompt("Введите новое название категории:", capitalizeFirstLetter(category));
    if (newCategoryName && newCategoryName.toLowerCase() !== category) {
        if (productsData[newCategoryName.toLowerCase()]) {
            alert('Категория с таким названием уже существует.');
            return;
        }
        productsData[newCategoryName.toLowerCase()] = productsData[category];
        delete productsData[category];
        localStorage.setItem('productsData', JSON.stringify(productsData));
        loadCategories();
        loadAdminCategories();
        alert('Категория переименована.');
    }
}

// Удалить категорию
function deleteCategory(category) {
    if (confirm(`Вы уверены, что хотите удалить категорию "${capitalizeFirstLetter(category)}"?`)) {
        delete productsData[category];
        localStorage.setItem('productsData', JSON.stringify(productsData));
        loadCategories();
        loadAdminCategories();
        alert('Категория удалена.');
    }
}

// Функция для капитализации первой буквы
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Закрыть модальное окно при клике вне его
window.onclick = function(event) {
    const modal = document.getElementById('productModal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}
