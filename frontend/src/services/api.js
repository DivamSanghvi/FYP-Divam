import axiosInstance from '@/utils/axios'

// Auth services
export const authService = {
  register: (userData) => axiosInstance.post('/users/register', userData),
  login: (credentials) => axiosInstance.post('/users/login', credentials),
  logout: () => axiosInstance.post('/users/logout'),
}

// User services
export const userService = {
  getProfile: () => axiosInstance.get('/users/current-user'),
  updateProfile: (userData) => axiosInstance.patch('/users/update-account', userData),
}
