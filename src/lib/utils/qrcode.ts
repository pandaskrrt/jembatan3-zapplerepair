import QRCode from 'qrcode'

export async function generateQRCode(url: string): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 200,
      margin: 1,
      color: {
        dark: '#00ff9d',  
        light: '#0a0a0f'   
      }
    })
    return qrDataUrl
  } catch (error) {
    console.error('QR Code generation error:', error)
    return ''
  }
}

export function getCardUrl(showcaseId: number, sectionId: number, cardId: number): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  return `${baseUrl}/showcase/${showcaseId}/${sectionId}?card=${cardId}`
}