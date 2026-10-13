export function fft(x_real, x_imag) {
  const n = x_real.length;
  if (n <= 1) return;
  
  const even_real = new Array(n/2);
  const even_imag = new Array(n/2);
  const odd_real = new Array(n/2);
  const odd_imag = new Array(n/2);
  
  for (let i = 0; i < n / 2; i++) {
    even_real[i] = x_real[i * 2];
    even_imag[i] = x_imag[i * 2];
    odd_real[i] = x_real[i * 2 + 1];
    odd_imag[i] = x_imag[i * 2 + 1];
  }
  
  fft(even_real, even_imag);
  fft(odd_real, odd_imag);
  
  for (let k = 0; k < n / 2; k++) {
    const t_real = Math.cos(-2 * Math.PI * k / n) * odd_real[k] - Math.sin(-2 * Math.PI * k / n) * odd_imag[k];
    const t_imag = Math.sin(-2 * Math.PI * k / n) * odd_real[k] + Math.cos(-2 * Math.PI * k / n) * odd_imag[k];
    
    x_real[k] = even_real[k] + t_real;
    x_imag[k] = even_imag[k] + t_imag;
    x_real[k + n / 2] = even_real[k] - t_real;
    x_imag[k + n / 2] = even_imag[k] - t_imag;
  }
}
