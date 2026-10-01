import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token and tenant/branch headers (supporting tab-isolated sessionStorage)
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('serveflow_token') || localStorage.getItem('serveflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const companyId = sessionStorage.getItem('serveflow_company_id') || localStorage.getItem('serveflow_company_id');
    if (companyId) {
      config.headers['x-company-id'] = companyId;
    }

    const activeBranchId = sessionStorage.getItem('serveflow_active_branch_id') || localStorage.getItem('serveflow_active_branch_id');
    if (activeBranchId) {
      config.headers['x-branch-id'] = activeBranchId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token expiry or errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/menu')) {
        sessionStorage.removeItem('serveflow_token');
        sessionStorage.removeItem('serveflow_user');
        localStorage.removeItem('serveflow_token');
        localStorage.removeItem('serveflow_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
