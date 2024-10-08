import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { auth, db } from '../../firebaseconfig';
import { collection, getDocs, query, addDoc } from 'firebase/firestore';

const Product = () => {
    const location = useLocation();
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [showCheckout, setShowCheckout] = useState(false);
    const [address, setAddress] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const navigate = useNavigate();
    const [inputErrors, setInputErrors] = useState({
        address: '',
        phoneNumber: ''
    });
    const [flyUpAdd, setFlyUpAdd] = useState(null);
    const [flyUpRemove, setFlyUpRemove] = useState(null);
    useEffect(() => {
        const fetchCategoriesAndProducts = async () => {
            if (!auth.currentUser) {
                navigate('/introduction');
                return;
            }

            const categoriesCollection = collection(db, 'categoriesInfo');
            const categoriesQuery = query(categoriesCollection);
            const categoriesDocs = await getDocs(categoriesQuery);
            let categoriesList = categoriesDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCategories(categoriesList);

            const productsCollection = collection(db, 'productsInfo');
            const productsQuery = query(productsCollection);
            const productsDocs = await getDocs(productsQuery);
            let productsList = productsDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(productsList);
        };

        fetchCategoriesAndProducts();
    }, [navigate]);

    const addToCart = (product) => {
        const existingProduct = cart.find(item => item.id === product.id);
        if (existingProduct) {
            setCart(cart.map(item =>
                item.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
        setFlyUpAdd(product.id);
        setTimeout(() => setFlyUpAdd(null), 1000);
    };

    const removeFromCart = (product) => {
        const existingProduct = cart.find(item => item.id === product.id);
        if (existingProduct.quantity > 1) {
            setCart(cart.map(item =>
                item.id === product.id
                    ? { ...item, quantity: item.quantity - 1 }
                    : item
            ));
        } else {
            setCart(cart.filter(item => item.id !== product.id));
        }
        setFlyUpRemove(product.id);
        setTimeout(() => setFlyUpRemove(null), 1000);
    };

    const getTotalPrice = () => {
        return cart.reduce((total, item) => total + item.productPrice * item.quantity, 0);
    };

    const handleCheckout = async () => {
        let flag = true;
        if (!auth.currentUser) {
            navigate('/introduction');
            return;
        }
        if (!address) {
            setInputErrors(prev => ({ ...prev, address: 'Please fill your address' }));
            flag = false;
        } else {
            setInputErrors(prev => ({ ...prev, address: '' }));
        }

        if (!phoneNumber) {
            setInputErrors(prev => ({ ...prev, phoneNumber: 'Please fill your phone number' }));
            flag = false;
        } else {
            setInputErrors(prev => ({ ...prev, phoneNumber: '' }));
        }
        if (flag) {
            const orderData = {
                userId: auth.currentUser.uid,
                address,
                phoneNumber,
                cart,
                totalPrice: getTotalPrice(),
                createdDate: new Date(),
                status: 'Processing'
            };

            try {
                await addDoc(collection(db, 'ordersInfo'), orderData);
                alert('Order placed successfully!');
                setCart([]);
                setShowCheckout(false);
            } catch (error) {
                console.error('Error placing order:', error.message);
            }
        }
    };

    const logout = async () => {
        try {
            await auth.signOut();
            navigate('/introduction');
        } catch (error) {
            console.error('Error logging out:', error.message);
        }
    };

    useEffect(() => {
        if (location.state && location.state.order) {
            const { order } = location.state;
            setAddress(order.address);
            setPhoneNumber(order.phoneNumber);
            setCart(order.cart);
        }
    }, [location.state]);

    const filteredProducts = selectedCategory === 'All'
        ? products
        : products.filter(product => product.productCategory === selectedCategory);

    return (
        <div style={{ backgroundColor: '#F3E5AB', minHeight: '100vh', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                    <motion.button
                        style={{
                            backgroundColor: '#8B4513',
                            color: '#FFF',
                            border: 'none',
                            borderRadius: '5px',
                            padding: '10px 20px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            position: 'relative',
                            zIndex: 1,
                        }}
                        onClick={() => setShowMenu(!showMenu)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        Menu
                    </motion.button>
                    {showMenu && (
                        <div style={{
                            position: 'absolute',
                            top: '50px',
                            right: '0',
                            backgroundColor: '#FFF',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                            borderRadius: '10px',
                            padding: '10px',
                            display: 'flex',
                            flexDirection: 'column',
                        }}>
                            <motion.button
                                style={{
                                    backgroundColor: '#8B4513',
                                    color: '#FFF',
                                    border: 'none',
                                    borderRadius: '5px',
                                    padding: '10px 20px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    marginBottom: '10px',
                                }}
                                onClick={() => navigate('/product')}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                Cart
                            </motion.button>
                            <motion.button
                                style={{
                                    backgroundColor: '#8B4513',
                                    color: '#FFF',
                                    border: 'none',
                                    borderRadius: '5px',
                                    padding: '10px 20px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    marginBottom: '10px',
                                }}
                                onClick={() => navigate('/order')}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                Orders
                            </motion.button>
                            <motion.button
                                style={{
                                    backgroundColor: '#8B4513',
                                    color: '#FFF',
                                    border: 'none',
                                    borderRadius: '5px',
                                    padding: '10px 20px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    marginBottom: '10px',
                                }}
                                onClick={logout}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                Log Out
                            </motion.button>
                        </div>
                    )}
                </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={() => setSelectedCategory('All')}
                    style={{
                        backgroundColor: '#8B4513',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: '5px',
                        padding: '10px 20px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        marginRight: '10px',
                        transition: 'transform 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    All
                </button>
                {categories.map(category => (
                    <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.categoryName)}
                        style={{
                            backgroundColor: '#8B4513',
                            color: '#FFF',
                            border: 'none',
                            borderRadius: '5px',
                            padding: '10px 20px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            marginRight: '10px',
                            transition: 'transform 0.2s',
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        {category.categoryName}
                    </button>
                ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                {filteredProducts.map(product => (
                    <div key={product.id} style={{ width: '200px', backgroundColor: '#FFF', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', padding: '20px', textAlign: 'center', position: 'relative' }}>
                        <img src={product.productImg} alt={product.productName} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '10px' }} />
                        <h3 style={{ color: '#8B4513' }}>{product.productName}</h3>
                        <p style={{ color: '#8B4513' }}>{product.productDescription}</p>
                        <p style={{ color: '#8B4513', fontWeight: 'bold' }}>${product.productPrice}</p>
                        <motion.button
                            onClick={() => addToCart(product)}
                            style={{
                                backgroundColor: '#8B4513',
                                color: '#FFF',
                                border: 'none',
                                borderRadius: '5px',
                                padding: '10px 20px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                position: 'relative',
                                zIndex: 2,
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            +
                        </motion.button>
                        <motion.button
                            onClick={() => removeFromCart(product)}
                            style={{
                                backgroundColor: '#8B4513',
                                color: '#FFF',
                                border: 'none',
                                borderRadius: '5px',
                                padding: '10px 20px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                position: 'relative',
                                zIndex: 2,
                                marginLeft:'5px'
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            -
                        </motion.button>
                        {flyUpAdd === product.id && (
                            <motion.div
                                initial={{ opacity: 1, y: 0 }}
                                animate={{ opacity: 0, y: -50 }}
                                transition={{ duration: 1 }}
                                style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    color: 'green',
                                    fontWeight: 'bold',
                                    fontSize: '20px',
                                    zIndex: 1,
                                }}
                            >
                                +1
                            </motion.div>
                        )}
                        {flyUpRemove === product.id && (
                            <motion.div
                                initial={{ opacity: 1, y: 0 }}
                                animate={{ opacity: 0, y: -50 }}
                                transition={{ duration: 1 }}
                                style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    color: 'green',
                                    fontWeight: 'bold',
                                    fontSize: '20px',
                                    zIndex: 1,
                                }}
                            >
                                -1
                            </motion.div>
                        )}
                    </div>
                ))}
            </div>
            {cart.length > 0 && (
                <motion.button
                    onClick={() => setShowCheckout(true)}
                    style={{
                        backgroundColor: '#8B4513',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: '5px',
                        padding: '10px 20px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        position: 'fixed',
                        bottom: '20px',
                        right: '20px',
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    Checkout
                </motion.button>
            )}
            {showCheckout && (
                <div style={{
                    position: 'fixed',
                    top: '0',
                    left: '0',
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: '#FFF',
                        padding: '20px',
                        borderRadius: '10px',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                        width: '400px',
                    }}>
                        <h2 style={{ textAlign: 'center', color: '#8B4513' }}>Checkout</h2>
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ color: '#8B4513', fontWeight: 'bold' }}>Address:</label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '5px',
                                    border: '1px solid #8B4513',
                                    marginTop: '5px',
                                    boxSizing: 'border-box',
                                }}
                            />
                            {inputErrors.address && <p style={{ color: 'red' }}>{inputErrors.address}</p>}
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ color: '#8B4513', fontWeight: 'bold' }}>Phone Number:</label>
                            <input
                                type="text"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '5px',
                                    border: '1px solid #8B4513',
                                    marginTop: '5px',
                                    boxSizing: 'border-box',
                                }}
                            />
                            {inputErrors.phoneNumber && <p style={{ color: 'red' }}>{inputErrors.phoneNumber}</p>}
                        </div>
                        <h3 style={{ color: '#8B4513' }}>Cart Items</h3>
                        <ul>
                            {cart.map(item => (
                                <li key={item.id} style={{ color: '#8B4513' }}>
                                    {item.productName} - Quantity: {item.quantity}
                                </li>
                            ))}
                        </ul>
                        <h3 style={{ color: '#8B4513' }}>Total Price: ${getTotalPrice()}</h3>
                        <motion.button
                            onClick={handleCheckout}
                            style={{
                                backgroundColor: '#8B4513',
                                color: '#FFF',
                                border: 'none',
                                borderRadius: '5px',
                                padding: '10px 20px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                width: '100%',
                                marginTop: '10px',
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            Confirm Order
                        </motion.button>
                        <motion.button
                            onClick={() => setShowCheckout(false)}
                            style={{
                                backgroundColor: '#FF6347',
                                color: '#FFF',
                                border: 'none',
                                borderRadius: '5px',
                                padding: '10px 20px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                width: '100%',
                                marginTop: '10px',
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            Close
                        </motion.button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Product;
