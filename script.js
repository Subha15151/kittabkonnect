// ====== FIREBASE CONFIGURATION ======
const firebaseConfig = {
    apiKey: "AIzaSyA8tqe5Mw9_gcrALO12LhJf3LUb65gxTVU",
    authDomain: "kitabkonnekt.firebaseapp.com",
    databaseURL: "https://kitabkonnekt-default-rtdb.firebaseio.com",
    projectId: "kitabkonnekt",
    storageBucket: "kitabkonnekt.firebasestorage.app",
    messagingSenderId: "566300666783",
    appId: "1:566300666783:web:eb7a32a65f80ed27096baa",
    measurementId: "G-FKB2K3XE53"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
const analytics = firebase.analytics();

// ====== DATA ======
let currentUser = null;
let userListings = [];
let soldBooks = [];
let allBooks = [];

const sampleBooks = [
    {
        id: 1,
        title: "Harry Potter and the Chamber of Secrets",
        author: "J.K. Rowling",
        category: "novels",
        condition: "good",
        price: 250,
        originalPrice: 699,
        location: "Delhi",
        sellerName: "Amit Sharma",
        sellerEmail: "amit@example.com",
        sellerPhone: "9876543210",
        sellerInitials: "AS",
        description: "Good condition, no torn pages, slight cover wear",
        date: "2 hours ago",
        badge: "Bestseller",
        userId: "demo1",
        status: "active"
    },
    {
        id: 2,
        title: "NCERT Physics Class 12",
        author: "NCERT",
        category: "academic",
        condition: "fair",
        price: 150,
        originalPrice: 300,
        location: "Mumbai",
        sellerName: "Priya Patel",
        sellerEmail: "priya@example.com",
        sellerPhone: "9876543211",
        sellerInitials: "PP",
        description: "Some highlights, all pages intact",
        date: "5 hours ago",
        badge: "Textbook",
        userId: "demo2",
        status: "active"
    },
    {
        id: 3,
        title: "Rich Dad Poor Dad",
        author: "Robert Kiyosaki",
        category: "business",
        condition: "like-new",
        price: 300,
        originalPrice: 499,
        location: "Bangalore",
        sellerName: "Rajesh Kumar",
        sellerEmail: "rajesh@example.com",
        sellerPhone: "9876543212",
        sellerInitials: "RK",
        description: "Like new, read only once",
        date: "1 day ago",
        badge: "Business",
        userId: "demo3",
        status: "active"
    }
];

const categories = [
    { id: "novels", name: "Novels & Fiction", icon: "fas fa-book-reader", description: "Fiction, Literature, Novels" },
    { id: "academic", name: "Academic Textbooks", icon: "fas fa-graduation-cap", description: "School, College, University" },
    { id: "competitive", name: "Competitive Exams", icon: "fas fa-file-alt", description: "UPSC, SSC, Banking, CAT" },
    { id: "children", name: "Children Books", icon: "fas fa-child", description: "Kids, Story Books, Comics" },
    { id: "business", name: "Business & Finance", icon: "fas fa-chart-line", description: "Finance, Investing, Management" },
    { id: "self-help", name: "Self-Help", icon: "fas fa-hands-helping", description: "Motivation, Psychology, Growth" }
];

// ====== DOM ELEMENTS ======
const authModal = document.getElementById('authModal');
const mainWebsite = document.getElementById('mainWebsite');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const authTabs = document.querySelectorAll('.auth-tab');
const authLinks = document.querySelectorAll('.auth-link');
const logoutBtn = document.getElementById('logoutBtn');
const userMenu = document.getElementById('userMenu');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const sellNowBtn = document.getElementById('sellNowBtn');
const addNewBookBtn = document.getElementById('addNewBookBtn');
const sellModal = document.getElementById('sellModal');
const closeSellModal = document.getElementById('closeSellModal');
const whatsappModal = document.getElementById('whatsappModal');
const closeWhatsAppModal = document.getElementById('closeWhatsAppModal');
const confirmModal = document.getElementById('confirmModal');
const closeConfirmModal = document.getElementById('closeConfirmModal');
const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
const confirmActionBtn = document.getElementById('confirmActionBtn');
const categoriesGrid = document.getElementById('categoriesGrid');
const booksGrid = document.getElementById('booksGrid');
const myBooksGrid = document.getElementById('myBooksGrid');
const myBooksTabs = document.querySelectorAll('.books-tab');
const totalBooksEl = document.getElementById('totalBooks');
const activeUsersEl = document.getElementById('activeUsers');
const citiesEl = document.getElementById('cities');
const menuToggle = document.getElementById('menuToggle');
const navContainer = document.getElementById('navContainer');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const resetPasswordBtn = document.getElementById('resetPasswordBtn');

// Variables for confirmation modal
let currentConfirmAction = null;
let currentBookId = null;

// ====== FIREBASE AUTH FUNCTIONS ======
function initFirebaseAuth() {
    // Listen for auth state changes
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            currentUser = {
                uid: user.uid,
                email: user.email,
                name: user.displayName || 'User',
                phone: user.phoneNumber || '',
                city: '',
                initials: (user.displayName || 'U').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
            };
            
            // Fetch additional user data from database
            fetchUserData(user.uid).then(() => {
                updateUserProfile();
                loadCategories();
                loadAllBooksFromFirebase();
                loadMyBooks('active');
                updateStats();
                
                authModal.classList.add('hidden');
                mainWebsite.classList.add('show');
                
                // Scroll to top after login
                window.scrollTo({ top: 0, behavior: 'instant' });
            });
            
        } else {
            // User is signed out
            currentUser = null;
            authModal.classList.remove('hidden');
            mainWebsite.classList.remove('show');
            // Show login tab by default
            switchAuthTab('login');
        }
    });
}

async function fetchUserData(uid) {
    try {
        const snapshot = await database.ref('users/' + uid).once('value');
        const userData = snapshot.val();
        
        if (userData) {
            currentUser = { ...currentUser, ...userData };
        } else {
            // Create user data if doesn't exist
            await saveUserToDatabase();
        }
        
        // Fetch user's listings
        const listingsSnapshot = await database.ref('listings/' + uid).once('value');
        const listingsData = listingsSnapshot.val();
        userListings = listingsData ? Object.values(listingsData) : [];
        
        // Fetch sold books
        const soldSnapshot = await database.ref('sold_books/' + uid).once('value');
        const soldData = soldSnapshot.val();
        soldBooks = soldData ? Object.values(soldData) : [];
        
    } catch (error) {
        console.error('Error fetching user data:', error);
        showNotification('Error loading user data', 'error');
    }
}

async function saveUserToDatabase() {
    try {
        await database.ref('users/' + currentUser.uid).set({
            name: currentUser.name,
            email: currentUser.email,
            phone: currentUser.phone || '',
            city: currentUser.city || '',
            initials: currentUser.initials,
            joinedDate: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error saving user data:', error);
    }
}

// ====== AUTH FUNCTIONS ======
async function handleLogin(email, password) {
    try {
        const loginBtn = document.getElementById('loginBtn');
        const originalText = loginBtn.innerHTML;
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;
        
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        
        // Update last login time
        await database.ref('users/' + userCredential.user.uid).update({
            lastLogin: new Date().toISOString()
        });
        
        showNotification('Login successful!', 'success');
        
    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'Login failed. ';
        
        switch(error.code) {
            case 'auth/user-not-found':
                errorMessage += 'No user found with this email.';
                break;
            case 'auth/wrong-password':
                errorMessage += 'Incorrect password.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Invalid email address.';
                break;
            case 'auth/user-disabled':
                errorMessage += 'This account has been disabled.';
                break;
            case 'auth/too-many-requests':
                errorMessage += 'Too many failed attempts. Please try again later.';
                break;
            default:
                errorMessage += error.message;
        }
        
        showNotification(errorMessage, 'error');
    } finally {
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
            loginBtn.innerHTML = originalText;
        }
    }
}

async function handleSignup(name, email, phone, city, password) {
    try {
        const signupBtn = document.getElementById('signupBtn');
        const originalText = signupBtn.innerHTML;
        signupBtn.classList.add('loading');
        signupBtn.disabled = true;
        
        // Create user with email and password
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update user profile
        await user.updateProfile({
            displayName: name
        });
        
        // Set current user
        currentUser = {
            uid: user.uid,
            email: user.email,
            name: name,
            phone: phone,
            city: city,
            initials: name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
        };
        
        // Save user data to database
        await saveUserToDatabase();
        
        showNotification('Account created successfully!', 'success');
        switchAuthTab('login');
        
    } catch (error) {
        console.error('Signup error:', error);
        let errorMessage = 'Signup failed. ';
        
        switch(error.code) {
            case 'auth/email-already-in-use':
                errorMessage += 'Email already in use.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Invalid email address.';
                break;
            case 'auth/operation-not-allowed':
                errorMessage += 'Email/password accounts are not enabled.';
                break;
            case 'auth/weak-password':
                errorMessage += 'Password is too weak.';
                break;
            default:
                errorMessage += error.message;
        }
        
        showNotification(errorMessage, 'error');
    } finally {
        const signupBtn = document.getElementById('signupBtn');
        if (signupBtn) {
            signupBtn.classList.remove('loading');
            signupBtn.disabled = false;
            signupBtn.innerHTML = originalText;
        }
    }
}

async function handleForgotPassword(email) {
    try {
        const resetBtn = document.getElementById('resetPasswordBtn');
        const originalText = resetBtn.innerHTML;
        resetBtn.classList.add('loading');
        resetBtn.disabled = true;
        
        await auth.sendPasswordResetEmail(email);
        showNotification('Password reset email sent! Check your inbox.', 'success');
        
        // Switch back to login form
        setTimeout(() => switchAuthTab('login'), 2000);
        
    } catch (error) {
        console.error('Password reset error:', error);
        let errorMessage = 'Failed to send reset email. ';
        
        switch(error.code) {
            case 'auth/user-not-found':
                errorMessage += 'No user found with this email.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Invalid email address.';
                break;
            default:
                errorMessage += error.message;
        }
        
        showNotification(errorMessage, 'error');
    } finally {
        const resetBtn = document.getElementById('resetPasswordBtn');
        if (resetBtn) {
            resetBtn.classList.remove('loading');
            resetBtn.disabled = false;
            resetBtn.innerHTML = originalText;
        }
    }
}

async function handleLogout() {
    try {
        await auth.signOut();
        showNotification('Logged out successfully', 'info');
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Logout failed', 'error');
    }
}

// ====== INITIALIZATION ======
document.addEventListener('DOMContentLoaded', function() {
    initFirebaseAuth();
    setupEventListeners();
    setupSmoothScroll();
});

function setupEventListeners() {
    // Mobile menu toggle
    menuToggle.addEventListener('click', () => {
        navContainer.classList.toggle('show');
    });

    // Auth tabs
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchAuthTab(tabName);
        });
    });

    // Switch between login/signup
    authLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.dataset.switch;
            if (target) {
                switchAuthTab(target);
            }
        });
    });

    // Password toggle
    document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const targetId = toggle.dataset.target;
            const input = document.getElementById(targetId);
            const icon = toggle.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    // Login form
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        handleLogin(email, password);
    });
    
    // Signup form
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const phone = document.getElementById('signupPhone').value;
        const city = document.getElementById('signupCity').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;
        
        // Validation
        if (!agreeTerms) {
            showNotification('Please agree to the Terms & Conditions', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }
        
        if (password.length < 6) {
            showNotification('Password must be at least 6 characters', 'error');
            return;
        }
        
        handleSignup(name, email, phone, city, password);
    });
    
    // Forgot password link
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthTab('forgot');
        });
    }
    
    // Forgot password form
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('forgotEmail').value;
            handleForgotPassword(email);
        });
    }
    
    // Logout
    logoutBtn.addEventListener('click', handleLogout);

    // User menu
    userMenu.addEventListener('click', () => {
        if (confirm('Do you want to logout?')) {
            handleLogout();
        }
    });

    // Sell book buttons
    sellNowBtn.addEventListener('click', openSellModal);
    addNewBookBtn.addEventListener('click', openSellModal);

    // My Books tabs
    myBooksTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            myBooksTabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Load books for selected tab
            const tabName = tab.dataset.tab;
            loadMyBooks(tabName);
        });
    });

    // Close modals
    closeSellModal.addEventListener('click', () => {
        sellModal.classList.remove('show');
    });

    closeWhatsAppModal.addEventListener('click', () => {
        whatsappModal.classList.remove('show');
    });

    closeConfirmModal.addEventListener('click', () => {
        confirmModal.classList.remove('show');
    });

    cancelConfirmBtn.addEventListener('click', () => {
        confirmModal.classList.remove('show');
    });

    // Confirm action
    confirmActionBtn.addEventListener('click', () => {
        if (currentConfirmAction === 'markSold' && currentBookId) {
            markBookAsSold(currentBookId);
        } else if (currentConfirmAction === 'delete' && currentBookId) {
            deleteBook(currentBookId);
        }
        confirmModal.classList.remove('show');
    });

    // --- NEW MODAL CODE START ---
    // Get Elements
    const privacyBtn = document.getElementById('privacyBtn');
    const termsBtn = document.getElementById('termsBtn');
    const privacyLinkSignup = document.getElementById('privacyLinkSignup');
    const termsLinkSignup = document.getElementById('termsLinkSignup');
    
    const privacyModal = document.getElementById('privacyModal');
    const termsModal = document.getElementById('termsModal');
    
    const closePrivacyModal = document.getElementById('closePrivacyModal');
    const closeTermsModal = document.getElementById('closeTermsModal');

    // Open Privacy Modal (Footer)
    if(privacyBtn) {
        privacyBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            privacyModal.classList.add('show');
        });
    }
    
    // Open Privacy Modal (Signup Form)
    if(privacyLinkSignup) {
        privacyLinkSignup.addEventListener('click', (e) => {
            e.preventDefault(); 
            privacyModal.classList.add('show');
        });
    }

    // Open Terms Modal (Footer)
    if(termsBtn) {
        termsBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            termsModal.classList.add('show');
        });
    }
    
    // Open Terms Modal (Signup Form)
    if(termsLinkSignup) {
        termsLinkSignup.addEventListener('click', (e) => {
            e.preventDefault(); 
            termsModal.classList.add('show');
        });
    }

    // Close Buttons
    if(closePrivacyModal) {
        closePrivacyModal.addEventListener('click', () => {
            privacyModal.classList.remove('show');
        });
    }

    if(closeTermsModal) {
        closeTermsModal.addEventListener('click', () => {
            termsModal.classList.remove('show');
        });
    }

    // --- NEW MODAL CODE END ---

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === sellModal) {
            sellModal.classList.remove('show');
        }
        if (e.target === whatsappModal) {
            whatsappModal.classList.remove('show');
        }
        if (e.target === confirmModal) {
            confirmModal.classList.remove('show');
        }
        if (e.target === privacyModal) {
            privacyModal.classList.remove('show');
        }
        if (e.target === termsModal) {
            termsModal.classList.remove('show');
        }
        if (!navContainer.contains(e.target) && !menuToggle.contains(e.target)) {
            navContainer.classList.remove('show');
        }
    });

    // Search functionality
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.hero-search button');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', () => performSearch(searchInput.value));
    }
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch(searchInput.value);
        });
    }

    // Navigation menu click events
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // Remove active class from all links
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                // Add active class to clicked link
                this.classList.add('active');
                
                // Close mobile menu
                navContainer.classList.remove('show');
                
                // Smooth scroll to section
                targetElement.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Logo click to go to home
    document.querySelector('.brand').addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelector('[href="#home"]').classList.add('active');
        document.getElementById('home').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    });
}

// Setup smooth scroll for navigation
function setupSmoothScroll() {
    // Handle hash changes
    window.addEventListener('hashchange', function() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            const element = document.getElementById(hash);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
}

// ====== AUTH TAB SWITCHING ======
function switchAuthTab(tabName) {
    // Update active tab
    authTabs.forEach(tab => {
        tab.style.display = tabName === 'forgot' ? 'none' : 'flex';
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // Show active form
    loginForm.classList.toggle('active', tabName === 'login');
    signupForm.classList.toggle('active', tabName === 'signup');
    
    if (forgotPasswordForm) {
        forgotPasswordForm.classList.toggle('active', tabName === 'forgot');
    }
    
    // Adjust auth header padding for forgot password form
    const authHeader = document.querySelector('.auth-header');
    if (authHeader) {
        authHeader.style.padding = tabName === 'forgot' ? '2rem' : '2.5rem 2rem';
    }
}

function updateUserProfile() {
    if (currentUser) {
        userAvatar.textContent = currentUser.initials;
        userName.textContent = currentUser.name;
        userEmail.textContent = currentUser.email;
    }
}

// ====== UI FUNCTIONS ======
function loadCategories() {
    categoriesGrid.innerHTML = '';
    
    categories.forEach(category => {
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        categoryCard.innerHTML = `
            <div class="category-icon">
                <i class="${category.icon}"></i>
            </div>
            <h3>${category.name}</h3>
            <p>${category.description}</p>
        `;
        
        categoryCard.addEventListener('click', () => {
            // Update active nav
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.querySelector('[href="#books"]').classList.add('active');
            filterBooksByCategory(category.id);
        });
        
        categoriesGrid.appendChild(categoryCard);
    });
}

async function loadAllBooksFromFirebase() {
    try {
        const snapshot = await database.ref('listings').once('value');
        const listings = snapshot.val();
        
        if (listings) {
            // Convert Firebase object to array
            const firebaseBooks = [];
            Object.values(listings).forEach(userListings => {
                Object.values(userListings).forEach(book => {
                    if (book.status !== 'sold') {
                        firebaseBooks.push(book);
                    }
                });
            });
            
            // Combine with sample books
            allBooks = [...sampleBooks, ...firebaseBooks];
        } else {
            allBooks = [...sampleBooks];
        }
        
        loadBooks();
        
    } catch (error) {
        console.error('Error loading books:', error);
        allBooks = [...sampleBooks];
        loadBooks();
    }
}

function loadBooks(books = allBooks) {
    booksGrid.innerHTML = '';
    
    if (books.length === 0) {
        booksGrid.innerHTML = `
            <div class="text-center" style="grid-column: 1/-1; padding: 3rem;">
                <div class="category-icon mb-4">
                    <i class="fas fa-book"></i>
                </div>
                <h3 class="mb-2">No Books Found</h3>
                <p class="mb-4">Be the first to list a book in this category!</p>
                <button class="btn btn-primary" id="sellFirstBook">
                    <i class="fas fa-plus"></i> Sell Your Book
                </button>
            </div>
        `;
        
        document.getElementById('sellFirstBook')?.addEventListener('click', openSellModal);
        return;
    }
    
    // Show only active books
    const activeBooks = books.filter(book => book.status !== 'sold');
    
    activeBooks.forEach(book => {
        const bookCard = createBookCard(book, 'browse');
        booksGrid.appendChild(bookCard);
    });
}

function loadMyBooks(filter = 'active') {
    myBooksGrid.innerHTML = '';
    
    // Get user's books
    const userBooks = [...userListings];
    
    let filteredBooks = [];
    
    switch(filter) {
        case 'active':
            filteredBooks = userBooks.filter(book => book.status !== 'sold');
            break;
        case 'sold':
            filteredBooks = userBooks.filter(book => book.status === 'sold');
            break;
        case 'all':
            filteredBooks = userBooks;
            break;
    }
    
    if (filteredBooks.length === 0) {
        myBooksGrid.innerHTML = `
            <div class="no-books-message" style="grid-column: 1/-1;">
                <i class="fas fa-book"></i>
                <h3>No Books Found</h3>
                <p>You haven't listed any books yet. Start selling your books now!</p>
                <button class="btn btn-primary" id="sellFirstMyBook">
                    <i class="fas fa-plus"></i> Sell Your First Book
                </button>
            </div>
        `;
        
        document.getElementById('sellFirstMyBook')?.addEventListener('click', openSellModal);
        return;
    }
    
    filteredBooks.forEach(book => {
        const bookCard = createBookCard(book, 'mybooks');
        myBooksGrid.appendChild(bookCard);
    });
}

function createBookCard(book, type = 'browse') {
    const card = document.createElement('div');
    card.className = 'book-card';
    card.dataset.id = book.id;
    
    const discount = book.originalPrice ? 
        Math.round((1 - book.price / book.originalPrice) * 100) : 0;
    
    const conditionColors = {
        'like-new': '#10B981',
        'good': '#3B82F6',
        'fair': '#F59E0B',
        'poor': '#EF4444'
    };
    
    const isSold = book.status === 'sold';
    
    card.innerHTML = `
        <div class="book-image">
            ${book.badge ? `<div class="book-badge ${isSold ? 'sold' : ''}">${isSold ? 'SOLD' : book.badge}</div>` : ''}
            ${isSold ? '<div class="book-badge sold" style="right: 1rem; left: auto;">SOLD</div>' : ''}
            <i class="fas fa-book-open"></i>
        </div>
        <div class="book-content">
            <h3 class="book-title">${book.title}</h3>
            <p class="book-author">${book.author}</p>
            
            <div class="book-meta">
                <div class="book-location">
                    <i class="fas fa-map-marker-alt"></i> ${book.location}
                </div>
                <div class="book-condition" style="background: ${conditionColors[book.condition] || '#6B7280'}20; color: ${conditionColors[book.condition] || '#6B7280'}">
                    ${book.condition.replace('-', ' ').toUpperCase()}
                </div>
            </div>
            
            <div class="book-price">
                <div class="current-price">₹${book.price}</div>
                ${book.originalPrice ? `
                    <div class="original-price">₹${book.originalPrice}</div>
                    <div class="discount">${discount}% OFF</div>
                ` : ''}
            </div>
            
            <div class="book-seller">
                <div class="seller-avatar">${book.sellerInitials}</div>
                <div class="seller-info">
                    <h4>${book.sellerName}</h4>
                    <p>Listed ${book.date}</p>
                </div>
            </div>
            
            <div class="book-actions">
                ${type === 'browse' ? `
                    <button class="btn-contact" data-id="${book.id}">
                        <i class="fab fa-whatsapp"></i> Contact Seller
                    </button>
                ` : `
                    ${!isSold ? `
                        <button class="btn-sold" data-id="${book.id}">
                            <i class="fas fa-check-circle"></i> Mark as Sold
                        </button>
                    ` : ''}
                    <button class="btn-delete" data-id="${book.id}">
                        <i class="fas fa-trash"></i> Delete Listing
                    </button>
                `}
            </div>
        </div>
    `;
    
    if (type === 'browse') {
        // Add event listener to contact button
        const contactBtn = card.querySelector('.btn-contact');
        contactBtn.addEventListener('click', () => {
            if (!currentUser) {
                showNotification('Please login to contact seller', 'error');
                return;
            }
            openWhatsAppChat(book);
        });
    } else {
        // Add event listeners for my books actions
        if (!isSold) {
            const soldBtn = card.querySelector('.btn-sold');
            soldBtn.addEventListener('click', () => {
                showConfirmModal('markSold', book.id, 'Mark this book as sold?', 'This will remove the book from active listings.');
            });
        }
        
        const deleteBtn = card.querySelector('.btn-delete');
        deleteBtn.addEventListener('click', () => {
            showConfirmModal('delete', book.id, 'Delete this listing?', 'This action cannot be undone.');
        });
    }
    
    return card;
}

function filterBooksByCategory(categoryId) {
    const filteredBooks = allBooks.filter(book => book.category === categoryId && book.status !== 'sold');
    loadBooks(filteredBooks);
    
    // Scroll to books section
    document.getElementById('books').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

function performSearch(query) {
    if (!query.trim()) {
        loadBooks(allBooks);
        return;
    }
    
    const filteredBooks = allBooks.filter(book => 
        (book.title.toLowerCase().includes(query.toLowerCase()) ||
        book.author.toLowerCase().includes(query.toLowerCase()) ||
        book.category.toLowerCase().includes(query.toLowerCase()) ||
        book.location.toLowerCase().includes(query.toLowerCase())) &&
        book.status !== 'sold'
    );
    
    loadBooks(filteredBooks);
    
    // Update nav active state
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector('[href="#books"]').classList.add('active');
    
    // Scroll to results
    document.getElementById('books').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

async function updateStats() {
    try {
        // Fetch all listings from database
        const snapshot = await database.ref('listings').once('value');
        const allListings = snapshot.val();
        
        // Count active listings
        let activeBooksCount = 0;
        if (allListings) {
            Object.values(allListings).forEach(userListings => {
                Object.values(userListings).forEach(book => {
                    if (book.status !== 'sold') {
                        activeBooksCount++;
                    }
                });
            });
        }
        
        // Add sample books count
        activeBooksCount += sampleBooks.filter(book => book.status !== 'sold').length;
        
        totalBooksEl.textContent = activeBooksCount + '+';
        
        // Get unique cities from listings
        const cities = new Set();
        if (allListings) {
            Object.values(allListings).forEach(userListings => {
                Object.values(userListings).forEach(book => {
                    if (book.city) cities.add(book.city);
                });
            });
        }
        
        // Add cities from sample books
        sampleBooks.forEach(book => {
            if (book.location) cities.add(book.location);
        });
        
        citiesEl.textContent = cities.size + '+';
        
        // For active users, we can count users in the database
        const usersSnapshot = await database.ref('users').once('value');
        const usersData = usersSnapshot.val();
        const userCount = usersData ? Object.keys(usersData).length : 0;
        activeUsersEl.textContent = userCount + '+';
        
    } catch (error) {
        console.error('Error updating stats:', error);
        // Fallback to local data
        const activeBooksCount = allBooks.filter(book => book.status !== 'sold').length;
        totalBooksEl.textContent = activeBooksCount + '+';
        
        const uniqueCities = [...new Set(allBooks.map(book => book.location))];
        citiesEl.textContent = uniqueCities.length + '+';
        
        activeUsersEl.textContent = '5,000+'; // Default fallback
    }
}

// ====== BOOK MANAGEMENT FUNCTIONS ======
async function saveBookToListings(bookData) {
    try {
        const bookId = bookData.id || Date.now().toString();
        await database.ref('listings/' + currentUser.uid + '/' + bookId).set(bookData);
        
        // Update local listings
        const index = userListings.findIndex(b => b.id === bookId);
        if (index !== -1) {
            userListings[index] = bookData;
        } else {
            userListings.push(bookData);
        }
        
        return true;
    } catch (error) {
        console.error('Error saving book:', error);
        showNotification('Failed to save book listing', 'error');
        return false;
    }
}

async function markBookAsSold(bookId) {
    try {
        // Get book data
        const bookRef = database.ref('listings/' + currentUser.uid + '/' + bookId);
        const snapshot = await bookRef.once('value');
        const bookData = snapshot.val();
        
        if (bookData) {
            // Mark as sold
            bookData.status = 'sold';
            bookData.soldDate = new Date().toISOString();
            
            // Move to sold books
            await database.ref('sold_books/' + currentUser.uid + '/' + bookId).set(bookData);
            
            // Remove from active listings
            await bookRef.remove();
            
            // Update local data
            userListings = userListings.filter(book => book.id !== bookId);
            soldBooks.push(bookData);
            
            // Update allBooks array
            const allBooksIndex = allBooks.findIndex(book => book.id === bookId);
            if (allBooksIndex !== -1) {
                allBooks[allBooksIndex].status = 'sold';
            }
            
            // Update UI
            loadBooks();
            loadMyBooks('active');
            updateStats();
            
            showNotification('Book marked as sold successfully!', 'success');
        }
    } catch (error) {
        console.error('Error marking book as sold:', error);
        showNotification('Failed to update book status', 'error');
    }
}

async function deleteBook(bookId) {
    try {
        // Remove from database
        await database.ref('listings/' + currentUser.uid + '/' + bookId).remove();
        
        // Update local data
        userListings = userListings.filter(book => book.id !== bookId);
        
        // Update allBooks array
        const allBooksIndex = allBooks.findIndex(book => book.id === bookId);
        if (allBooksIndex !== -1) {
            allBooks.splice(allBooksIndex, 1);
        }
        
        // Update UI
        loadBooks();
        loadMyBooks('active');
        updateStats();
        
        showNotification('Book deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting book:', error);
        showNotification('Failed to delete book', 'error');
    }
}

// ====== MODAL FUNCTIONS ======
function showConfirmModal(action, bookId, title, message) {
    currentConfirmAction = action;
    currentBookId = bookId;
    
    document.getElementById('confirmModalTitle').textContent = title;
    document.getElementById('confirmModalMessage').textContent = message;
    
    confirmModal.classList.add('show');
}

function openSellModal() {
    if (!currentUser) {
        showNotification('Please login to sell books', 'error');
        return;
    }
    
    const modalBody = document.querySelector('.modal-body');
    modalBody.innerHTML = `
        <form id="sellBookForm">
            <div class="form-group">
                <label for="sellTitle" class="form-label">Book Title *</label>
                <input type="text" id="sellTitle" class="form-control" placeholder="e.g., Harry Potter and the Chamber of Secrets" required>
            </div>
            
            <div class="form-group">
                <label for="sellAuthor" class="form-label">Author Name *</label>
                <input type="text" id="sellAuthor" class="form-control" placeholder="e.g., J.K. Rowling" required>
            </div>
            
            <div class="form-group">
                <label for="sellCategory" class="form-label">Category *</label>
                <select id="sellCategory" class="form-control" required>
                    <option value="">Select Category</option>
                    <option value="novels">Novels & Fiction</option>
                    <option value="academic">Academic Textbooks</option>
                    <option value="competitive">Competitive Exams</option>
                    <option value="children">Children Books</option>
                    <option value="business">Business & Finance</option>
                    <option value="self-help">Self-Help</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="sellCondition" class="form-label">Book Condition *</label>
                <select id="sellCondition" class="form-control" required>
                    <option value="">Select Condition</option>
                    <option value="like-new">Like New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="sellPrice" class="form-label">Selling Price (₹) *</label>
                <input type="number" id="sellPrice" class="form-control" placeholder="250" required min="10">
            </div>
            
            <div class="form-group">
                <label for="originalPrice" class="form-label">Original Price (₹)</label>
                <input type="number" id="originalPrice" class="form-control" placeholder="699">
            </div>
            
            <div class="form-group">
                <label for="sellLocation" class="form-label">Your Location *</label>
                <input type="text" id="sellLocation" class="form-control" placeholder="${currentUser.city}" required>
            </div>
            
            <div class="form-group">
                <label for="sellDescription" class="form-label">Description</label>
                <textarea id="sellDescription" class="form-control" rows="3" placeholder="Add details about the book condition, any highlights, etc..."></textarea>
            </div>
            
            <div class="form-group">
                <label class="form-label">Tips for Better Selling:</label>
                <div style="background: #F0F9FF; padding: 1rem; border-radius: 0.5rem; font-size: 0.875rem;">
                    <p style="margin-bottom: 0.5rem;"><strong>📸 Take Clear Photos:</strong> Show book cover, spine, and any damage</p>
                    <p style="margin-bottom: 0.5rem;"><strong>📝 Be Honest:</strong> Mention all highlights, torn pages, or damage</p>
                    <p><strong>💬 Use WhatsApp:</strong> Share photos with buyers to show actual condition</p>
                </div>
            </div>
            
            <button type="submit" class="btn btn-primary btn-block">
                <i class="fas fa-paper-plane"></i> List Book for Sale
            </button>
            
            <p style="text-align: center; margin-top: 1rem; color: #6B7280; font-size: 0.875rem;">
                Listing is FREE! Buyers will contact you directly on WhatsApp.
            </p>
        </form>
    `;
    
    // Pre-fill location
    const locationInput = document.getElementById('sellLocation');
    if (locationInput) {
        locationInput.value = currentUser.city || '';
    }
    
    // Handle form submission
    const sellForm = modalBody.querySelector('#sellBookForm');
    if (sellForm) {
        sellForm.addEventListener('submit', handleSellForm);
    }
    
    sellModal.classList.add('show');
}

async function handleSellForm(e) {
    e.preventDefault();
    
    const bookData = {
        id: Date.now().toString(),
        title: document.getElementById('sellTitle').value,
        author: document.getElementById('sellAuthor').value,
        category: document.getElementById('sellCategory').value,
        condition: document.getElementById('sellCondition').value,
        price: parseInt(document.getElementById('sellPrice').value),
        originalPrice: document.getElementById('originalPrice').value ? 
            parseInt(document.getElementById('originalPrice').value) : null,
        location: document.getElementById('sellLocation').value,
        sellerName: currentUser.name,
        sellerEmail: currentUser.email,
        sellerPhone: currentUser.phone,
        sellerInitials: currentUser.initials,
        description: document.getElementById('sellDescription').value || 'No description',
        date: 'Just now',
        badge: 'New',
        userId: currentUser.uid,
        status: 'active',
        city: currentUser.city
    };
    
    // Save to Firebase
    const saved = await saveBookToListings(bookData);
    
    if (saved) {
        // Update all books
        allBooks.push(bookData);
        
        // Close modal
        sellModal.classList.remove('show');
        
        // Scroll to my books section
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelector('[href="#mybooks"]').classList.add('active');
        document.getElementById('mybooks').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
        
        showNotification('Book listed successfully! Buyers can now contact you on WhatsApp.', 'success');
    }
}

function openWhatsAppChat(book) {
    const modalContent = document.getElementById('whatsappModalContent');
    
    // Create WhatsApp message
    const message = `Hi ${book.sellerName}!%0A%0AI saw your book "${book.title}" on BookBazaar for ₹${book.price}.%0A%0A📚 Book Details:%0A- Author: ${book.author}%0A- Condition: ${book.condition}%0A- Location: ${book.location}%0A%0AI'm interested in buying it. Could you please:%0A1. Share some photos of the actual book condition%0A2. Let me know your best price%0A3. Suggest a meeting place%0A%0AThanks!%0A- ${currentUser.name}`;
    
    const whatsappUrl = `https://wa.me/+91${book.sellerPhone}?text=${message}`;
    
    modalContent.innerHTML = `
        <div style="text-align: center;">
            <div style="width: 80px; height: 80px; background: #25D366; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
                <i class="fab fa-whatsapp" style="font-size: 2.5rem; color: white;"></i>
            </div>
            
            <h3 style="margin-bottom: 1rem;">Contact ${book.sellerName}</h3>
            <p style="color: #6B7280; margin-bottom: 1.5rem;">Click the button below to open WhatsApp and start chatting directly with the seller.</p>
            
            <div style="background: #F3F4F6; padding: 1.5rem; border-radius: 0.75rem; margin-bottom: 1.5rem; text-align: left;">
                <p style="margin-bottom: 0.5rem;"><strong>📱 Phone:</strong> +91 ${book.sellerPhone}</p>
                <p style="margin-bottom: 0.5rem;"><strong>📚 Book:</strong> ${book.title}</p>
                <p style="margin-bottom: 0.5rem;"><strong>💰 Price:</strong> ₹${book.price}</p>
                <p><strong>📍 Location:</strong> ${book.location}</p>
            </div>
            
            <div style="background: #FFFBEB; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem; text-align: left;">
                <p style="color: #92400E; margin-bottom: 0.5rem;"><strong>💡 Tips for WhatsApp Chat:</strong></p>
                <ul style="color: #92400E; padding-left: 1.5rem;">
                    <li>Ask for actual photos of the book</li>
                    <li>Negotiate price politely</li>
                    <li>Agree on meeting place (public location)</li>
                    <li>Check book condition before paying</li>
                </ul>
            </div>
            
            <a href="${whatsappUrl}" target="_blank" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 1rem 2rem; font-size: 1.1rem; margin-bottom: 1rem;">
                <i class="fab fa-whatsapp"></i> Open WhatsApp Chat
            </a>
            
            <p style="color: #6B7280; font-size: 0.875rem;">Will open WhatsApp in a new tab. Make sure you have WhatsApp installed.</p>
        </div>
    `;
    
    whatsappModal.classList.add('show');
}

// ====== NOTIFICATION SYSTEM ======
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                            type === 'error' ? 'exclamation-circle' : 
                            type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles for notification
    notification.style.cssText = `
        position: fixed;
        top: 1rem;
        right: 1rem;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        background: ${type === 'success' ? '#10B981' : 
                    type === 'error' ? '#EF4444' : 
                    type === 'warning' ? '#F59E0B' : '#3B82F6'};
        color: white;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}