interface PixParams {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  txid?: string;
}

function formatLength(value: string): string {
  return value.length.toString().padStart(2, '0');
}

function formatField(id: string, value: string): string {
  return `${id}${formatLength(value)}${value}`;
}

function crc16(payload: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

export function generatePixCode({ pixKey, merchantName, merchantCity, amount, txid = '***' }: PixParams): string {
  const payloadFormat = formatField('00', '01');
  
  const gui = formatField('00', 'br.gov.bcb.pix');
  const key = formatField('01', pixKey);
  const merchantAccountInfo = formatField('26', gui + key);
  
  const merchantCategoryCode = formatField('52', '0000');
  const transactionCurrency = formatField('53', '986');
  const transactionAmount = formatField('54', amount.toFixed(2));
  const countryCode = formatField('58', 'BR');
  
  // Remove accents and special chars for name and city
  const cleanName = merchantName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 25).toUpperCase();
  const cleanCity = merchantCity.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 15).toUpperCase();
  
  const name = formatField('59', cleanName || 'NOME');
  const city = formatField('60', cleanCity || 'CIDADE');
  
  const txidField = formatField('05', txid.substring(0, 25) || '***');
  const additionalData = formatField('62', txidField);
  
  const payloadToCrc = payloadFormat + merchantAccountInfo + merchantCategoryCode + transactionCurrency + transactionAmount + countryCode + name + city + additionalData + '6304';
  
  const crc = crc16(payloadToCrc);
  
  return payloadToCrc + crc;
}
