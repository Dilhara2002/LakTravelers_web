import axios from 'axios';
import { resolveApiURL } from './apiConfig';
// Separate cookie/session from customer and administrator login; no localStorage tokens.
const partnerApi = axios.create({
  baseURL: `${resolveApiURL(import.meta.env.VITE_API_URL, window.location.hostname)}/partners`,
  withCredentials: true, timeout: 30000, headers: { 'X-Requested-With': 'LakTravelersPartner' },
});
partnerApi.interceptors.response.use(response => response, error => {
  error.message = error.response?.data?.message || 'Unable to connect. Please retry.';
  return Promise.reject(error);
});
export default partnerApi;
export async function downloadPartnerDocument(client, url, filename) {
  const { data } = await client.get(url, { responseType: 'blob' });
  const objectURL = URL.createObjectURL(data);
  const link = document.createElement('a'); link.href = objectURL; link.download = `${filename}.${({ 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'application/pdf': 'pdf' })[data.type] || 'bin'}`; link.click();
  setTimeout(() => URL.revokeObjectURL(objectURL), 1000);
}
