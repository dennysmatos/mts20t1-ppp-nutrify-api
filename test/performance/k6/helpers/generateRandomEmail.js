/**
 * Gera um email aleatório único
 * @returns {string} Email aleatório
 */
export function generateRandomEmail() {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 100000);
  return `user${timestamp}${randomNum}@example.com`;
}
