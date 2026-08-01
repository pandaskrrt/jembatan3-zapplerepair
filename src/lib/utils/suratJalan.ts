import jsPDF from 'jspdf';

export interface SuratJalanData {
	nomorSurat: string;
	tanggal: string;
	pengirim: {
		nama: string;
		cabang: string;
	};
	penerima: {
		nama: string;
		cabang: string;
	};
	barang: {
		nama: string;
		serialNumber: string;
		qty: number;
		hargaModal: number;
		hargaJual: number;
	};
	catatan?: string;
	senderName?: string;
	receiverName?: string;
}

export function generateSuratJalanPDF(data: SuratJalanData): jsPDF {
	const doc = new jsPDF();
	const pageWidth = 210;
	
	// ========== HEADER PERUSAHAAN ==========
	doc.setFontSize(22);
	doc.setFont('helvetica', 'bold');
	doc.setTextColor(0, 0, 0);
	doc.text('PT. ROXY TEKNOLOGI', pageWidth / 2, 25, { align: 'center' });
	
	doc.setFontSize(9);
	doc.setFont('helvetica', 'normal');
	doc.text('Jl. Contoh No. 123, Jakarta Pusat 10110', pageWidth / 2, 31, { align: 'center' });
	doc.text('Telp: (021) 1234-5678 | Email: info@roxy.co.id', pageWidth / 2, 36, { align: 'center' });
	
	// Double line separator
	doc.setDrawColor(0, 0, 0);
	doc.setLineWidth(1);
	doc.line(20, 42, 190, 42);
	doc.setLineWidth(0.5);
	doc.line(20, 44, 190, 44);
	
	// ========== JUDUL DOKUMEN ==========
	doc.setFontSize(18);
	doc.setFont('helvetica', 'bold');
	doc.text('SURAT JALAN', pageWidth / 2, 55, { align: 'center' });
	
	doc.setFontSize(10);
	doc.setFont('helvetica', 'normal');
	doc.text(`No: ${data.nomorSurat}`, pageWidth / 2, 62, { align: 'center' });
	doc.text(`Tanggal: ${data.tanggal}`, pageWidth / 2, 68, { align: 'center' });
	
	// ========== PENGIRIM & PENERIMA (Tanpa Kotak) ==========
	let y = 80;
	
	// Pengirim (Kiri)
	doc.setFontSize(10);
	doc.setFont('helvetica', 'bold');
	doc.text('PENGIRIM', 25, y);
	
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(10);
	doc.text(`Nama`, 25, y + 7);
	doc.text(`: ${data.pengirim.nama}`, 45, y + 7);
	
	doc.text(`Cabang`, 25, y + 13);
	doc.text(`: ${data.pengirim.cabang}`, 45, y + 13);
	
	// Penerima (Kanan)
	doc.setFont('helvetica', 'bold');
	doc.text('PENERIMA', 120, y);
	
	doc.setFont('helvetica', 'normal');
	doc.text(`Nama`, 120, y + 7);
	doc.text(`: ${data.penerima.nama}`, 140, y + 7);
	
	doc.text(`Cabang`, 120, y + 13);
	doc.text(`: ${data.penerima.cabang}`, 140, y + 13);
	
	// Line separator
	y += 25;
	doc.setDrawColor(0, 0, 0);
	doc.setLineWidth(0.5);
	doc.line(20, y, 190, y);
	
	// ========== DETAIL BARANG ==========
	y += 10;
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(11);
	doc.text('RINCIAN BARANG', 25, y);
	
	y += 10;
	
	// Table - Simple lines
	const tableTop = y;
	const colWidths = [70, 50, 15, 35];
	const colPositions = [25, 95, 145, 160];
	
	// Header
	doc.setFillColor(0, 0, 0);
	doc.rect(20, tableTop - 6, 170, 9, 'F');
	
	doc.setTextColor(255, 255, 255);
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(9);
	doc.text('NAMA BARANG', colPositions[0], tableTop);
	doc.text('SERIAL NUMBER', colPositions[1], tableTop);
	doc.text('QTY', colPositions[2], tableTop);
	doc.text('HARGA', colPositions[3], tableTop);
	
	// Content
	y = tableTop + 10;
	doc.setTextColor(0, 0, 0);
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(9);
	
	const namaBarang = doc.splitTextToSize(data.barang.nama, colWidths[0] - 5);
	doc.text(namaBarang, colPositions[0], y);
	doc.text(data.barang.serialNumber, colPositions[1], y);
	doc.text(data.barang.qty.toString(), colPositions[2], y);
	doc.text(`Rp ${data.barang.hargaModal.toLocaleString('id-ID')}`, colPositions[3], y);
	
	// Bottom line tabel
	y += 8;
	doc.setDrawColor(0, 0, 0);
	doc.line(20, y, 190, y);
	
	// Harga Jual
	y += 8;
	doc.setFont('helvetica', 'bold');
	doc.text('Harga Jual:', 135, y);
	doc.text(`Rp ${data.barang.hargaJual.toLocaleString('id-ID')}`, 160, y);
	
	doc.line(20, y + 3, 190, y + 3);
	
	// ========== CATATAN ==========
	if (data.catatan) {
		y += 12;
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(10);
		doc.text('CATATAN', 25, y);
		y += 6;
		doc.setFont('helvetica', 'normal');
		doc.setFontSize(9);
		const catatanLines = doc.splitTextToSize(data.catatan, 165);
		doc.text(catatanLines, 25, y);
	}
	
	// ========== TANDA TANGAN ==========
	y = 235;
	doc.setDrawColor(0, 0, 0);
	doc.setLineWidth(0.5);
	doc.line(20, y, 190, y);
	
	y += 8;
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(9);
	doc.setTextColor(0, 0, 0);
	
	// Label
	doc.text('Yang Mengirim,', 45, y);
	doc.text('Yang Menerima,', 140, y);
	
	// Space untuk TTD
	y += 25;
	
	// Garis nama terang
	doc.setLineWidth(0.3);
	doc.line(30, y, 75, y);
	doc.line(125, y, 170, y);
	
	// Tulis nama terang jika ada
	y += 4;
	doc.setFontSize(9);
	doc.setFont('helvetica', 'bold');
	
	if (data.senderName) {
		doc.text(`( ${data.senderName} )`, 52.5, y, { align: 'center' });
	} else {
		doc.text('( ........................... )', 52.5, y, { align: 'center' });
	}
	
	if (data.receiverName && data.receiverName !== '-') {
		doc.text(`( ${data.receiverName} )`, 147.5, y, { align: 'center' });
	} else {
		doc.text('( ........................... )', 147.5, y, { align: 'center' });
	}
	
	// Footer
	doc.setFontSize(7);
	doc.setTextColor(120, 120, 120);
	doc.text('Dokumen ini sah dan diproses secara elektronik', pageWidth / 2, 280, { align: 'center' });
	
	return doc;
}

export function embedSignatureToPDF(doc: jsPDF, signatureData: string, position: 'sender' | 'receiver', namaTerang: string) {
	if (!signatureData) return;
	
	const x = position === 'sender' ? 30 : 125;
	const ySignature = 243;
	const width = 45;
	const height = 18;
	
	try {
		// Embed TTD image saja, nama sudah ada di generateSuratJalanPDF
		doc.addImage(signatureData, 'PNG', x, ySignature, width, height);
	} catch (e) {
		console.error('Failed to embed signature:', e);
	}
}
