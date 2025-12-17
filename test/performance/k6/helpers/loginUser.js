import http from 'k6/http';
import { getBaseUrl } from './getBaseUrl.js';

/**
 * Faz login de um usuário e retorna o token JWT
 * @param {string} email - Email do usuário
 * @param {string} password - Senha do usuário
 * @returns {string} Token JWT
 */
export function loginUser(email, password) {
  const baseUrl = getBaseUrl();
  const payload = JSON.stringify({
    email: email,
    password: password,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = http.post(`${baseUrl}/users/login`, payload, params);

  return response.json('token');
}
