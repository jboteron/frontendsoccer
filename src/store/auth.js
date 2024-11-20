import { createStore } from 'vuex';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Importación correcta de jwt-decode

// Estado inicial
const state = {
  authToken: localStorage.getItem('token') || null, // Carga el token del localStorage
  tokenExpiration: localStorage.getItem('tokenExpiration') || null, // Carga la expiración del token
  user: null, // Información del usuario
  isLoggedIn: false, // Estado de autenticación
  userRole: localStorage.getItem('userRole') || null, // Carga el rol del usuario
};

// Mutaciones
const mutations = {
  SET_AUTH_TOKEN(state, { token, expiration }) {
    state.authToken = token;
    state.tokenExpiration = expiration;
    state.isLoggedIn = true;
    localStorage.setItem('token', token);
    localStorage.setItem('tokenExpiration', expiration);
  },
  CLEAR_AUTH_TOKEN(state) {
    state.authToken = null;
    state.tokenExpiration = null;
    state.user = null; // Limpia el estado del usuario
    state.isLoggedIn = false;
    state.userRole = null;
    localStorage.removeItem('token'); // Limpia el token en localStorage
    localStorage.removeItem('tokenExpiration'); // Limpia la expiración en localStorage
    localStorage.removeItem('userRole'); // Limpia el rol en localStorage
  },
  SET_USER(state, user) {
    state.user = user;
    state.userRole = user.role || state.userRole; // Asigna el rol del usuario
    localStorage.setItem('userRole', state.userRole); // Almacena el rol en localStorage
  },
  SET_USER_ROLE(state, role) {
    state.userRole = role;
    localStorage.setItem('userRole', role);
  },
  SET_LOGIN_STATUS(state, status) {
    state.isLoggedIn = status;
  },
};

// Acciones
const actions = {
  async login({ commit }, credentials) {
    try {
      const response = await axios.post('/api/auth/login', credentials);
      const { token } = response.data;
      const expirationDuration = 3600000; // 1 hora por defecto
      const expirationTime = Date.now() + expirationDuration;

      // Almacenar token y su expiración en localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('tokenExpiration', expirationTime);

      commit('SET_AUTH_TOKEN', { token, expiration: expirationTime });

      // Decodificar el token para obtener el usuario
      const user = jwtDecode(token);
      commit('SET_USER', user);
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw error; // Lanza el error para manejarlo en el componente
    }
  },

  async logout({ commit }) {
    try {
      // Cambiamos a POST para el logout
      await axios.post('/api/auth/logout');
      commit('CLEAR_AUTH_TOKEN'); // Limpiar token y usuario después de una respuesta exitosa
    } catch (error) {
      console.error('Error en el logout:', error);
      throw error; // Lanza el error para manejarlo en el componente
    }
  },

  checkAuth({ commit }) {
    const token = localStorage.getItem('token');
    const tokenExpiration = localStorage.getItem('tokenExpiration');
    const currentTime = Date.now();

    if (token && tokenExpiration && currentTime < parseInt(tokenExpiration, 10)) {
      commit('SET_AUTH_TOKEN', { token, expiration: tokenExpiration });
      const user = jwtDecode(token); // Decodificar el token
      commit('SET_USER', user);
    } else {
      commit('CLEAR_AUTH_TOKEN'); // Token expirado o inexistente
    }
  },

  async fetchUser({ commit }) {
    try {
      const response = await axios.get('/api/auth/user', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      commit('SET_USER', response.data); // Almacena la información del usuario
    } catch (error) {
      console.error('Error al obtener la información del usuario:', error);
      if (error.response && error.response.status === 401) {
        // Si el token no es válido o ha expirado
        commit('CLEAR_AUTH_TOKEN');
      }
    }
  },

  setUserRole({ commit }, role) {
    commit('SET_USER_ROLE', role);
  },

  setLoginStatus({ commit }, status) {
    commit('SET_LOGIN_STATUS', status);
  },
};

// Getters
const getters = {
  isLoggedIn: (state) => !!state.authToken && Date.now() < parseInt(state.tokenExpiration, 10),
  getUser: (state) => state.user,
  userRole: (state) => state.userRole,
};

// Crear el store
const store = createStore({
  state,
  mutations,
  actions,
  getters,
});

export default store;
