import React, { useState, useEffect} from 'react';
import axios from 'axios';
import md5 from 'md5';
import debounce from 'lodash/debounce';
import {API_URL, PASSWORD} from "./const.js";

function App() {
    const [products, setProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTerm, setFilterTerm] = useState('');
    const [priceFilter, setPriceFilter] = useState('');

    useEffect(() => {
        fetchProductIds();
    }, [currentPage, filterTerm, priceFilter]);

    const fetchProductIds = async () => {
        try {
            const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
            const authString = `${PASSWORD}_${timestamp}`;
            const xAuthHeader = md5(authString);

            const response = await axios.post(API_URL, {
                action: 'get_ids',
                params: { offset: (currentPage - 1) * 50, limit: 50 }
            }, {
                headers: { 'X-Auth': xAuthHeader }
            });

            const fetchedProductIds = response.data.result;
            const productsData = await getProductsByIds(fetchedProductIds);
            setProducts(productsData);
        } catch (error) {
            console.error('Error fetching product IDs:', error.response?.data || error.message);
        }
    };

    const getProductsByIds = async (ids) => {
        try {
            const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
            const authString = `${PASSWORD}_${timestamp}`;
            const xAuthHeader = md5(authString);

            const response = await axios.post(API_URL, {
                action: 'get_items',
                params: { ids }
            }, {
                headers: { 'X-Auth': xAuthHeader }
            });

            return response.data.result.filter((product, index, self) =>
                index === self.findIndex(p => p.id === product.id)
            );
        } catch (error) {
            console.error('Error fetching product details:', error.response?.data || error.message);
            return [];
        }
    };

    const handlePagination = (direction) => {
        if (direction === 'prev' && currentPage > 1) {
            setCurrentPage(currentPage - 1);
        } else if (direction === 'next' && currentPage < 3) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handleSearch = (event) => setSearchTerm(event.target.value);

    const handleFilter = debounce((event) => {
        setFilterTerm(event.target.value);
    }, 1000);

    const handlePriceFilter = debounce((event) => {
        setPriceFilter(event.target.value);
    }, 1000);

    const filteredProducts = products.filter(product =>
        product.product.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (!filterTerm || (product.brand && product.brand.toLowerCase() === filterTerm.toLowerCase())) &&
        (!priceFilter || product.price <= parseFloat(priceFilter))
    );


    return (
        <>
            {products.length ? (
                <div>
                    <div className={'input-container'}>
                        <input type="text" placeholder="Поиск по имени" onChange={handleSearch} className={'input'}/>
                        <input type="text" placeholder="Фильтрация по бренду" onChange={handleFilter} className={'input'}/>
                        <input type="text" placeholder="Фильтр по цене" onChange={handlePriceFilter}
                               className={'input'}/>
                    </div>
                    <ul className={'cardList'}>
                        {filteredProducts.map(product => (
                            <li key={product.id} className={'card'}>
                                <div>ID: {product.id}</div>
                                <div>Name: {product.product}</div>
                                <div>Price: {product.price}</div>
                                <div>Brand: {product.brand}</div>
                            </li>
                        ))}
                    </ul>
                    <div className={'button-container'}>
                        <button disabled={currentPage === 1} onClick={() => handlePagination('prev')}>Назад</button>
                        <span>{currentPage}</span>
                        <button disabled={currentPage === 3} onClick={() => handlePagination('next')}>Вперёд</button>
                    </div>
                </div>
            ) : <div>Loading...</div>}
        </>
    );
}

export default App;