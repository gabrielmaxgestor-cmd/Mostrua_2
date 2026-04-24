const handleDownload = () => {
  // Em vez de fetch, use um link direto com download attribute
  const link = document.createElement('a');
  link.href = qrCodeUrl;
  link.download = `qrcode-${storeName.toLowerCase().replace(/\s+/g, '-')}.png`;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
