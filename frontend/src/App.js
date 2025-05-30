import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return userData;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const response = await axios.post(`${API}/auth/register`, { name, email, password, role });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return userData;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Welcome Page Component
const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex flex-col">
      <header className="px-6 py-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-2xl font-bold text-green-800">Sät</span>
          </div>
          <button 
            onClick={() => navigate('/login')}
            className="text-green-700 hover:text-green-800 font-medium"
          >
            Войти
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-8">
            <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-3xl">S</span>
            </div>
            <h1 className="text-4xl font-bold text-green-800 mb-2">Sät</h1>
            <p className="text-xl text-green-600 font-medium">Saqta! Ünemde! Quattan!</p>
            <p className="text-gray-600 mt-2">Спасай еду, экономь деньги, помогай планете</p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => navigate('/choose-role')}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Создать аккаунт
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="w-full border-2 border-green-600 text-green-600 py-3 px-6 rounded-lg font-medium hover:bg-green-50 transition-colors"
            >
              Войти
            </button>
          </div>
        </div>
      </main>

      <footer className="px-6 py-4 text-center text-gray-500 text-sm">
        © 2024 Sät. Сохраняем еду вместе.
      </footer>
    </div>
  );
};

// Role Selection Component
const RoleSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-800 mb-2">Кто вы?</h1>
          <p className="text-gray-600">Выберите свою роль в платформе Sät</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => navigate('/register?role=customer')}
            className="w-full bg-white border-2 border-green-200 rounded-xl p-6 hover:border-green-400 hover:shadow-lg transition-all group"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <span className="text-2xl">🛒</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Я клиент</h3>
              <p className="text-gray-600">Покупаю еду по выгодным ценам и помогаю сохранить планету</p>
            </div>
          </button>

          <button 
            onClick={() => navigate('/register?role=restaurant')}
            className="w-full bg-white border-2 border-green-200 rounded-xl p-6 hover:border-green-400 hover:shadow-lg transition-all group"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <span className="text-2xl">🏪</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Я заведение</h3>
              <p className="text-gray-600">Продаю остатки еды, уменьшаю отходы и получаю дополнительный доход</p>
            </div>
          </button>
        </div>

        <div className="text-center mt-8">
          <button 
            onClick={() => navigate('/')}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            ← Назад
          </button>
        </div>
      </div>
    </div>
  );
};

// Register Component
const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role');
    if (role) {
      setFormData(prev => ({ ...prev, role }));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await register(formData.name, formData.email, formData.password, formData.role);
      if (user.role === 'customer') {
        navigate('/customer/home');
      } else {
        navigate('/restaurant/home');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-6">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-green-800 mb-2">Регистрация</h1>
            <p className="text-gray-600">
              {formData.role === 'customer' ? 'Присоединяйтесь как клиент' : 'Присоединяйтесь как заведение'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.role === 'customer' ? 'Ваше имя' : 'Название заведения'}
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder={formData.role === 'customer' ? 'Введите ваше имя' : 'Введите название заведения'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Введите email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Пароль</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Введите пароль"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Создаём аккаунт...' : 'Создать аккаунт'}
            </button>
          </form>

          <div className="text-center mt-6">
            <button 
              onClick={() => navigate('/login')}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Уже есть аккаунт? Войти
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Login Component
const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login(formData.email, formData.password);
      if (user.role === 'customer') {
        navigate('/customer/home');
      } else {
        navigate('/restaurant/home');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-6">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-green-800 mb-2">Вход</h1>
            <p className="text-gray-600">Добро пожаловать в Sät</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Введите email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Пароль</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Введите пароль"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Входим...' : 'Войти'}
            </button>
          </form>

          <div className="text-center mt-6 space-y-2">
            <button 
              onClick={() => navigate('/choose-role')}
              className="text-green-600 hover:text-green-700 font-medium block w-full"
            >
              Нет аккаунта? Создать
            </button>
            <button 
              onClick={() => navigate('/')}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← На главную
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Customer Navigation Component
const CustomerNav = ({ activeTab, setActiveTab }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
      <div className="flex justify-around py-2">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center py-2 px-4 ${activeTab === 'home' ? 'text-green-600' : 'text-gray-500'}`}
        >
          <span className="text-2xl">🏠</span>
          <span className="text-xs">Главная</span>
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex flex-col items-center py-2 px-4 ${activeTab === 'catalog' ? 'text-green-600' : 'text-gray-500'}`}
        >
          <span className="text-2xl">📋</span>
          <span className="text-xs">Каталог</span>
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex flex-col items-center py-2 px-4 ${activeTab === 'favorites' ? 'text-green-600' : 'text-gray-500'}`}
        >
          <span className="text-2xl">❤️</span>
          <span className="text-xs">Избранное</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center py-2 px-4 ${activeTab === 'profile' ? 'text-green-600' : 'text-gray-500'}`}
        >
          <span className="text-2xl">👤</span>
          <span className="text-xs">Профиль</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex flex-col items-center py-2 px-4 text-red-500"
        >
          <span className="text-2xl">🚪</span>
          <span className="text-xs">Выйти</span>
        </button>
      </div>
    </nav>
  );
};

// Food Box Card Component
const FoodBoxCard = ({ box, onFavorite, isFavorited }) => {
  const discountPercent = Math.round(((box.price_before - box.price_after) / box.price_before) * 100);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="relative">
        <div className="h-32 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
          <span className="text-4xl">🍕</span>
        </div>
        <button
          onClick={() => onFavorite(box.id)}
          className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md"
        >
          <span className={isFavorited ? 'text-red-500' : 'text-gray-400'}>❤️</span>
        </button>
        <div className="absolute bottom-3 left-3 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-bold">
          -{discountPercent}%
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-800 mb-1">{box.restaurant_name}</h3>
        <p className="text-sm text-gray-600 mb-2">{box.title}</p>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 line-through">{box.price_before}₸</span>
            <span className="text-lg font-bold text-green-600">{box.price_after}₸</span>
          </div>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <span>🕐</span>
          <span className="ml-1">Забрать: {box.pickup_time}</span>
        </div>
      </div>
    </div>
  );
};

// Customer Home Component
const CustomerHome = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [boxes, setBoxes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { user } = useAuth();

  const categories = [
    { id: 'all', name: 'Все', emoji: '🍽️' },
    { id: 'Выпечка', name: 'Выпечка', emoji: '🥐' },
    { id: 'Десерты', name: 'Десерты', emoji: '🍰' },
    { id: 'Салаты', name: 'Салаты', emoji: '🥗' },
    { id: 'Горячие блюда', name: 'Горячие блюда', emoji: '🍲' }
  ];

  useEffect(() => {
    fetchBoxes();
    fetchFavorites();
  }, []);

  const fetchBoxes = async () => {
    try {
      const response = await axios.get(`${API}/boxes`);
      setBoxes(response.data);
    } catch (error) {
      console.error('Error fetching boxes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await axios.get(`${API}/favorites`);
      setFavorites(response.data.map(fav => fav.box_id || fav.id));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const handleFavorite = async (boxId) => {
    try {
      if (favorites.includes(boxId)) {
        await axios.delete(`${API}/favorites/${boxId}`);
        setFavorites(favorites.filter(id => id !== boxId));
      } else {
        await axios.post(`${API}/favorites/${boxId}`);
        setFavorites([...favorites, boxId]);
      }
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const filteredBoxes = selectedCategory === 'all' 
    ? boxes 
    : boxes.filter(box => box.category === selectedCategory);

  const favoriteBoxes = boxes.filter(box => favorites.includes(box.id));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const renderHome = () => (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-green-600 text-white p-6">
        <h1 className="text-2xl font-bold mb-2">Привет, {user.name}! 👋</h1>
        <p className="text-green-100">Найди свой счастливый пакет и спаси еду</p>
      </div>

      {/* Categories */}
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Категории</h2>
        <div className="flex space-x-3 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex-shrink-0 flex flex-col items-center p-3 rounded-xl ${
                selectedCategory === category.id
                  ? 'bg-green-100 border-2 border-green-500'
                  : 'bg-gray-100 border-2 border-transparent'
              }`}
            >
              <span className="text-2xl mb-1">{category.emoji}</span>
              <span className="text-sm font-medium">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Food Boxes */}
      <div className="px-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Счастливые пакеты</h2>
          <span className="text-sm text-gray-500">{filteredBoxes.length} доступно</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredBoxes.map(box => (
            <FoodBoxCard
              key={box.id}
              box={box}
              onFavorite={handleFavorite}
              isFavorited={favorites.includes(box.id)}
            />
          ))}
        </div>
        {filteredBoxes.length === 0 && (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🔍</span>
            <p className="text-gray-500">Пока нет доступных пакетов в этой категории</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderCatalog = () => (
    <div className="pb-20">
      <div className="bg-white p-6 border-b">
        <div className="flex items-center space-x-4 mb-4">
          <input
            type="text"
            placeholder="Найти счастливый пакет"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <button className="px-4 py-3 bg-green-600 text-white rounded-lg">
            🔍
          </button>
        </div>
        <div className="flex space-x-4">
          <button className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
            📋 Список
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium">
            🗺️ Карта
          </button>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 gap-4">
          {boxes.map(box => (
            <FoodBoxCard
              key={box.id}
              box={box}
              onFavorite={handleFavorite}
              isFavorited={favorites.includes(box.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderFavorites = () => (
    <div className="pb-20">
      <div className="bg-white p-6 border-b">
        <h1 className="text-2xl font-bold text-gray-800">Избранное</h1>
        <p className="text-gray-600">Ваши любимые счастливые пакеты</p>
      </div>
      <div className="p-6">
        {favoriteBoxes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {favoriteBoxes.map(box => (
              <FoodBoxCard
                key={box.id}
                box={box}
                onFavorite={handleFavorite}
                isFavorited={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">❤️</span>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Пока пусто</h3>
            <p className="text-gray-500">Добавьте пакеты в избранное, чтобы быстро их находить</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="pb-20">
      <div className="bg-green-600 text-white p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-2xl">👤</span>
          </div>
          <div>
            <h1 className="text-xl font-bold">{user.name}</h1>
            <p className="text-green-100">{user.email}</p>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-2">📦 История заказов</h3>
          <p className="text-gray-600">Посмотреть прошлые покупки</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-2">💳 Способ оплаты</h3>
          <p className="text-gray-600">Управление картами и платежами</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-2">🎁 Пригласи друга</h3>
          <p className="text-gray-600">Получай бонусы за приглашения</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-2">📞 Поддержка</h3>
          <p className="text-gray-600">Связаться с нами</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {activeTab === 'home' && renderHome()}
      {activeTab === 'catalog' && renderCatalog()}
      {activeTab === 'favorites' && renderFavorites()}
      {activeTab === 'profile' && renderProfile()}
      <CustomerNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

// Restaurant Home Component
const RestaurantHome = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [myBoxes, setMyBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [restaurant, setRestaurant] = useState(null);

  const [newBox, setNewBox] = useState({
    title: '',
    description: '',
    category: 'Выпечка',
    quantity: 1,
    price_before: '',
    price_after: '',
    pickup_time: '18:00-20:00'
  });

  useEffect(() => {
    fetchRestaurant();
    fetchMyBoxes();
  }, []);

  const fetchRestaurant = async () => {
    try {
      const response = await axios.get(`${API}/restaurants/me`);
      setRestaurant(response.data);
    } catch (error) {
      // Restaurant profile doesn't exist yet
      console.log('Restaurant profile not found');
    }
  };

  const fetchMyBoxes = async () => {
    try {
      const response = await axios.get(`${API}/boxes/my`);
      setMyBoxes(response.data);
    } catch (error) {
      console.error('Error fetching boxes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRestaurant = async () => {
    try {
      const restaurantData = {
        name: user.name,
        description: `Заведение ${user.name}`,
        address: 'Алматы, Казахстан',
        phone: '+7 (xxx) xxx-xx-xx'
      };
      const response = await axios.post(`${API}/restaurants`, restaurantData);
      setRestaurant(response.data);
    } catch (error) {
      console.error('Error creating restaurant:', error);
    }
  };

  const handleCreateBox = async (e) => {
    e.preventDefault();
    
    if (!restaurant) {
      await createRestaurant();
    }

    try {
      await axios.post(`${API}/boxes`, newBox);
      setNewBox({
        title: '',
        description: '',
        category: 'Выпечка',
        quantity: 1,
        price_before: '',
        price_after: '',
        pickup_time: '18:00-20:00'
      });
      setShowCreateForm(false);
      fetchMyBoxes();
    } catch (error) {
      console.error('Error creating box:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const renderDashboard = () => (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-green-600 text-white p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">{user.name}</h1>
            <p className="text-green-100">Панель управления заведением</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{myBoxes.length}</div>
            <div className="text-sm text-green-100">активных боксов</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-600">₸{myBoxes.reduce((sum, box) => sum + box.price_after, 0)}</div>
            <div className="text-sm text-gray-600">Потенциальный доход</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{myBoxes.reduce((sum, box) => sum + box.quantity, 0)}</div>
            <div className="text-sm text-gray-600">Всего порций</div>
          </div>
        </div>

        {/* Create Box Button */}
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg mb-6 hover:bg-green-700 transition-colors"
        >
          + Создать новый бокс
        </button>

        {/* Active Boxes */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Активные боксы</h2>
          {myBoxes.length > 0 ? (
            <div className="space-y-4">
              {myBoxes.map(box => (
                <div key={box.id} className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-800">{box.title}</h3>
                    <span className="text-green-600 font-bold">{box.price_after}₸</span>
                  </div>
                  <p className="text-gray-600 mb-2">{box.description}</p>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>📦 {box.quantity} порций</span>
                    <span>🕐 {box.pickup_time}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">📦</span>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Пока нет боксов</h3>
              <p className="text-gray-500">Создайте свой первый счастливый пакет</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {renderDashboard()}

      {/* Create Box Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Создать бокс</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateBox} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Название</label>
                  <input
                    type="text"
                    required
                    value={newBox.title}
                    onChange={(e) => setNewBox(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Например: Микс выпечки"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
                  <textarea
                    required
                    value={newBox.description}
                    onChange={(e) => setNewBox(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows="3"
                    placeholder="Что входит в пакет?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Категория</label>
                  <select
                    value={newBox.category}
                    onChange={(e) => setNewBox(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="Выпечка">Выпечка</option>
                    <option value="Десерты">Десерты</option>
                    <option value="Салаты">Салаты</option>
                    <option value="Горячие блюда">Горячие блюда</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Количество</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newBox.quantity}
                    onChange={(e) => setNewBox(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Цена до</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={newBox.price_before}
                      onChange={(e) => setNewBox(prev => ({ ...prev, price_before: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Цена после</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={newBox.price_after}
                      onChange={(e) => setNewBox(prev => ({ ...prev, price_after: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Время получения</label>
                  <select
                    value={newBox.pickup_time}
                    onChange={(e) => setNewBox(prev => ({ ...prev, pickup_time: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="16:00-18:00">16:00-18:00</option>
                    <option value="18:00-20:00">18:00-20:00</option>
                    <option value="20:00-22:00">20:00-22:00</option>
                  </select>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                  >
                    Создать
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
        <div className="flex justify-around py-2">
          <button className="flex flex-col items-center py-2 px-4 text-green-600">
            <span className="text-2xl">🏪</span>
            <span className="text-xs">Главная</span>
          </button>
          <button className="flex flex-col items-center py-2 px-4 text-gray-500">
            <span className="text-2xl">📊</span>
            <span className="text-xs">Статистика</span>
          </button>
          <button className="flex flex-col items-center py-2 px-4 text-gray-500">
            <span className="text-2xl">⚙️</span>
            <span className="text-xs">Настройки</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex flex-col items-center py-2 px-4 text-red-500"
          >
            <span className="text-2xl">🚪</span>
            <span className="text-xs">Выйти</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'customer' ? '/customer/home' : '/restaurant/home'} replace />;
  }

  return children;
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/choose-role" element={<RoleSelection />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            
            {/* Customer Routes */}
            <Route 
              path="/customer/home" 
              element={
                <ProtectedRoute requiredRole="customer">
                  <CustomerHome />
                </ProtectedRoute>
              } 
            />
            
            {/* Restaurant Routes */}
            <Route 
              path="/restaurant/home" 
              element={
                <ProtectedRoute requiredRole="restaurant">
                  <RestaurantHome />
                </ProtectedRoute>
              } 
            />
            
            {/* Redirect unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;
