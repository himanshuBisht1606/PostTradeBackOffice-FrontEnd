import axios from 'axios';
import config from '@core/config/env';

/**
 * Single Axios instance for the entire application.
 * Base URL is sourced exclusively from the typed env config — never hardcoded.
 */
const axiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;
