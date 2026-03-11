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
      background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%);
      padding: 40px;
      box-sizing: border-box;
      font-family: Georgia, serif;
      color: #2c3e50;
    ">
      <!-- الإطار الخارجي / Outer frame -->
      <div style="
        width: 100%;
        height: 100%;
        background: #ffffff;
        border: 3px solid #d4af37;
        box-sizing: border-box;
        padding: 35px;
        position: relative;
      ">
        <!-- الإطار الداخلي / Inner frame -->
        <div style="
          width: 100%;
          height: 100%;
          border: 1px solid #d4af37;
          padding: 40px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        ">
          <!-- أقواس زخرفية علوية / Top decorative braces -->
          <div style="
            position: absolute;
            top: 25px;
            left: 25px;
            font-size: 24px;
            color: #d4af37;
            font-family: 'Courier New', monospace;
            opacity: 0.3;
          ">{</div>
          
          <div style="
            position: absolute;
            top: 25px;
            right: 25px;
            font-size: 24px;
            color: #d4af37;
            font-family: 'Courier New', monospace;
            opacity: 0.3;
          ">}</div>

          <!-- الرأس / Header -->
          <div>
            <!-- شعار المنصة / Platform logo -->
            <div style="text-align: center; margin-bottom: 35px;">
              <div style="
                font-size: 36px;
                font-weight: bold;
                color: #2c5364;
                letter-spacing: 3px;
                margin-bottom: 5px;
              ">LUVIA</div>
              <div style="
                font-size: 11px;
                color: #7f8c8d;
                letter-spacing: 2px;
                font-family: 'Courier New', monospace;
              ">// Learning Platform</div>
            </div>

            <!-- العنوان / Title -->
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="
                font-size: 16px;
                color: #7f8c8d;
                margin-bottom: 15px;
                letter-spacing: 4px;
              ">CERTIFICATE OF ACHIEVEMENT</div>
              
              <div style="
                width: 80px;
                height: 2px;
                background: #d4af37;
                margin: 0 auto 20px;
              "></div>

              <div style="
                font-size: 14px;
                color: #95a5a6;
                font-style: italic;
              ">This is to certify that</div>
            </div>

            <!-- اسم الطالب / Student name -->
            <div style="
              text-align: center;
              font-size: 38px;
              color: #2c3e50;
              margin-bottom: 25px;
              font-weight: bold;
              border-bottom: 2px solid #d4af37;
              padding-bottom: 10px;
              max-width: 600px;
              margin-left: auto;
              margin-right: auto;
            ">${data.studentName}</div>
          </div>

          <!-- المحتوى الأوسط / Middle content -->
          <div style="text-align: center; margin: 10px 0;">
            <div style="
              font-size: 14px;
              color: #7f8c8d;
              line-height: 1.8;
              margin-bottom: 12px;
            ">
              has successfully completed the course
            </div>

            <div style="
              font-size: 22px;
              color: #2c5364;
              font-weight: bold;
              margin-bottom: 12px;
              padding: 0 40px;
            ">${data.courseName}</div>

            <div style="
              font-size: 13px;
              color: #95a5a6;
              font-style: italic;
            ">
              with dedication, commitment, and excellence
            </div>

            <!-- علامة صح برمجية / Programming checkmark -->
            <div style="
              margin-top: 15px;
              font-size: 14px;
              color: #27ae60;
              font-family: 'Courier New', monospace;
            ">✓ true</div>
          </div>

          <!-- التذييل / Footer -->
          <div style="margin-top: 50px;">
            <!-- معلومات التوقيع / Signature info -->
            <div style="
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-bottom: 25px;
              padding-top: 30px;
              border-top: 1px solid #ecf0f1;
            ">
              <!-- التوقيع / Signature -->
              <div style="width: 35%; text-align: center;">
                <div style="
                  font-size: 18px;
                  color: #2c3e50;
                  margin-bottom: 8px;
                  font-style: italic;
                ">${data.instructorSignature}</div>
                <div style="
                  width: 100%;
                  height: 1px;
                  background: #2c3e50;
                  margin-bottom: 5px;
                "></div>
                <div style="
                  font-size: 10px;
                  color: #7f8c8d;
                  letter-spacing: 1px;
                ">INSTRUCTOR</div>
              </div>

              <!-- التاريخ / Date -->
              <div style="width: 30%; text-align: center;">
                <div style="
                  font-size: 13px;
                  color: #2c3e50;
                  margin-bottom: 8px;
                  font-family: Georgia, serif;
                ">${formattedDate}</div>
                <div style="
                  width: 100%;
                  height: 1px;
                  background: #2c3e50;
                  margin-bottom: 5px;
                "></div>
                <div style="
                  font-size: 10px;
                  color: #7f8c8d;
                  letter-spacing: 1px;
                ">DATE</div>
              </div>

              <!-- معرف الشهادة / Certificate ID -->
              <div style="width: 35%; text-align: center;">
                <div style="
                  font-size: 11px;
                  color: #2c3e50;
                  margin-bottom: 8px;
                  font-family: 'Courier New', monospace;
                  font-weight: bold;
                  letter-spacing: 0.5px;
                  word-break: break-all;
                  line-height: 1.4;
                ">${data.certificateId.toUpperCase().replace(/(.{4})/g, '$1 ').trim()}</div>
                <div style="
                  width: 100%;
                  height: 1px;
                  background: #2c3e50;
                  margin-bottom: 5px;
                "></div>
                <div style="
                  font-size: 10px;
                  color: #7f8c8d;
                  letter-spacing: 1px;
                ">CERTIFICATE ID</div>
              </div>
            </div>

            <!-- رسالة مخفية برمجية / Hidden programming message -->
            <div style="
              text-align: center;
              font-size: 9px;
              color: #bdc3c7;
              font-family: 'Courier New', monospace;
              letter-spacing: 0.5px;
            ">
              0x4C 0x55 0x56 0x49 0x41 => Keep coding, keep learning
            </div>
          </div>

          <!-- QR Code للتحقق / QR Code for verification -->
          <div style="
            position: absolute;
            bottom: 35px;
            right: 35px;
            text-align: center;
          ">
            <img src="${qrCodeDataUrl}" style="
              width: 90px;
              height: 90px;
              border: 2px solid #d4af37;
              border-radius: 4px;
              background: white;
              padding: 5px;
            " />
            <div style="
              font-size: 8px;
              color: #7f8c8d;
              margin-top: 5px;
              font-family: 'Courier New', monospace;
            ">Scan to Verify</div>
          </div>

          <!-- أقواس زخرفية سفلية / Bottom decorative braces -->
          <div style="
            position: absolute;
            bottom: 25px;
            left: 25px;
            font-size: 24px;
            color: #d4af37;
            font-family: 'Courier New', monospace;
            opacity: 0.3;
          ">{</div>
          
          <div style="
            position: absolute;
            bottom: 25px;
            right: 25px;
            font-size: 24px;
            color: #d4af37;
            font-family: 'Courier New', monospace;
            opacity: 0.3;
          ">}</div>
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
