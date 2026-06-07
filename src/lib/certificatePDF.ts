import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

interface CertificateData {
  studentName: string;
  courseName: string;
  issueDate: string;
  certificateId: string;
  instructorSignature: string;
  logoUrl?: string;
}

// دالة لتنسيق التاريخ بالإنجليزية
// Function to format date in English
function formatDateEnglish(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options);
}

// دالة لتوليد شهادة PDF بتصميم برمجي إبداعي
// Function to generate creative programming-themed PDF certificate
export async function generateCertificatePDF(data: CertificateData): Promise<Blob> {
  // توليد QR Code للتحقق من الشهادة
  // Generate QR Code for certificate verification
  const verificationUrl = `${window.location.origin}/verify-certificate?id=${data.certificateId}`;
  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
    width: 120,
    margin: 1,
    color: {
      dark: '#2c3e50',
      light: '#ffffff'
    }
  });

  // تنسيق التاريخ بالإنجليزية
  // Format date in English
  const formattedDate = formatDateEnglish(data.issueDate);
  // إنشاء عنصر HTML للشهادة
  // Create HTML element for certificate
  const certificateElement = document.createElement('div');
  certificateElement.style.width = '1122px'; // A4 landscape width in pixels at 96 DPI
  certificateElement.style.height = '794px'; // A4 landscape height in pixels at 96 DPI
  certificateElement.style.position = 'absolute';
  certificateElement.style.left = '-9999px';
  certificateElement.style.top = '0';
  certificateElement.style.background = 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)';
  certificateElement.style.fontFamily = 'Georgia, serif';

  certificateElement.innerHTML = `
    <div style="
      width: 100%;
      height: 100%;
      background: #020617;
      padding: 30px;
      box-sizing: border-box;
      font-family: 'JetBrains Mono', monospace;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      gap: 15px;
      position: relative;
    ">
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 600px; height: 300px; background: radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, transparent 70%); pointer-events: none;"></div>

      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 15px; height: 80px;">
        <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 12px; display: flex; align-items: center; padding: 0 25px;">
          <div style="width: 10px; height: 10px; background: #38bdf8; border-radius: 50%; margin-right: 15px; box-shadow: 0 0 10px #38bdf8;"></div>
          <span style="font-size: 20px; font-weight: 800; letter-spacing: 2px;">LUVIA <span style="color: #38bdf8;">TERMINAL</span></span>
        </div>
        <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #38bdf8; letter-spacing: 1px;">
          SECURE_DOC // V2.0
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 15px; flex-grow: 1;">
        
        <div style="grid-column: span 2; grid-row: span 2; background: rgba(30, 41, 59, 0.3); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 40px; display: flex; flex-direction: column; justify-content: center; position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: #38bdf8;"></div>
          <div style="color: #64748b; font-size: 12px; margin-bottom: 10px; letter-spacing: 4px;">ACHIEVER_IDENTIFIED</div>
          <div style="font-size: 52px; font-weight: 900; margin-bottom: 20px; color: #fff; line-height: 1;">${data.studentName.toUpperCase()}</div>
          <div style="height: 1px; background: rgba(255,255,255,0.05); margin: 20px 0;"></div>
          <div style="color: #64748b; font-size: 12px; margin-bottom: 10px; letter-spacing: 4px;">MISSION_ACCOMPLISHED</div>
          <div style="font-size: 28px; color: #38bdf8; font-weight: 700;">&lt;${data.courseName} /&gt;</div>
        </div>

        <div style="background: #fff; border-radius: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
          <img src="${qrCodeDataUrl}" style="width: 130px; height: 130px;" />
          <div style="color: #020617; font-size: 9px; font-weight: bold; margin-top: 10px; font-family: sans-serif;">SCAN_TO_VERIFY</div>
        </div>

        <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="font-size: 9px; color: #38bdf8; margin-bottom: 4px;">ID_HASH</div>
            <div style="font-size: 11px; color: #94a3b8; font-family: monospace;">${data.certificateId.substring(0, 18)}</div>
          </div>
          <div>
            <div style="font-size: 9px; color: #38bdf8; margin-bottom: 4px;">TIMESTAMP</div>
            <div style="font-size: 12px; color: #f8fafc;">${formattedDate !== 'Invalid Date' ? formattedDate : new Date().toLocaleDateString('en-US', {year:'numeric', month:'long', day:'numeric'})}</div>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; height: 100px;">
        <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 20px;">
          <div style="font-size: 14px; color: #fff; margin-bottom: 5px; font-style: italic;">${data.instructorSignature}</div>
          <div style="font-size: 9px; color: #64748b;">INSTRUCTOR_SIGNATURE</div>
        </div>
        <div style="background: rgba(34, 197, 94, 0.05); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 10px;">
          <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%;"></div>
          <div style="font-size: 11px; color: #22c55e; font-weight: bold;">STATUS: ENCRYPTED_STABLE</div>
        </div>
        <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 20px; text-align: right;">
          <div style="font-size: 10px; color: #475569; line-height: 1.4;">
            LUVIA PLATFORM © 2026<br/>
            ALL SYSTEMS OPERATIONAL
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(certificateElement);

  try {
    console.log('بدء توليد الشهادة البرمجية / Starting programming certificate generation');
    
    // تحويل HTML إلى صورة / Convert HTML to image
    const canvas = await html2canvas(certificateElement, {
      scale: 2,
      useCORS: false,
      allowTaint: false,
      backgroundColor: '#0f2027',
      logging: false,
      width: 1122,
      height: 794,
    });

    console.log('تم إنشاء Canvas بنجاح / Canvas created successfully');

    // إنشاء PDF / Create PDF
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 297; // A4 landscape width in mm
    const imgHeight = 210; // A4 landscape height in mm

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    console.log('تم تحويل Canvas إلى صورة / Canvas converted to image');
    
    doc.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, '', 'FAST');
    console.log('تمت إضافة الصورة إلى PDF / Image added to PDF');

    // تحويل إلى Blob / Convert to Blob
    const pdfBlob = doc.output('blob');
    console.log('تم إنشاء PDF بنجاح / PDF created successfully');
    
    return pdfBlob;
  } catch (error) {
    console.error('خطأ في توليد الشهادة / Error generating certificate:', error);
    throw new Error(`فشل في توليد الشهادة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
  } finally {
    // تنظيف / Cleanup
    document.body.removeChild(certificateElement);
    console.log('تم تنظيف العناصر المؤقتة / Temporary elements cleaned up');
  }
}

// دالة لتحميل الشهادة / Function to download certificate
export async function downloadCertificate(data: CertificateData, filename: string = 'certificate.pdf') {
  try {
    console.log('بدء عملية التحميل / Starting download process');
    
    const pdfBlob = await generateCertificatePDF(data);
    
    console.log('تم توليد PDF، بدء التحميل / PDF generated, starting download');
    
    // إنشاء رابط تحميل / Create download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    
    // تأخير صغير للتأكد من جاهزية الرابط / Small delay to ensure link is ready
    setTimeout(() => {
      link.click();
      console.log('تم تفعيل التحميل / Download triggered');
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('تم تنظيف موارد التحميل / Download resources cleaned up');
      }, 100);
    }, 100);
  } catch (error) {
    console.error('خطأ في تحميل الشهادة / Error downloading certificate:', error);
    throw error;
  }
}
