// دالة لإنشاء بصمة المتصفح - محسنة وأكثر دقة
export async function generateBrowserFingerprint(): Promise<string> {
  const components: string[] = [];

  // 1. الأساسيات (مع التأكد من وجود القيم)
  components.push(navigator.userAgent || 'unknown_ua');
  components.push(navigator.language || 'unknown_lang');
  components.push(String(navigator.hardwareConcurrency || 2));
  components.push(String((navigator as any).deviceMemory || 4));
  
  // 2. دقة الشاشة والمنطقة الزمنية
  components.push(`${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`);
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone); // أدق من getTimezoneOffset

  // 3. بصمة الـ Canvas (أقوى وسيلة تمييز)
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 200;
      canvas.height = 50;
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("Luvia-Platform-Auth-Check", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText("Luvia-Platform-Auth-Check", 4, 17);
      components.push(canvas.toDataURL());
    }
  } catch (e) {
    components.push('canvas-error');
  }

  // 4. دمج المكونات وعمل الـ Hash
  const rawString = components.join('###');
  return await hashString(rawString);
}

// دالة الـ Hash (ثابتة وسريعة)
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// دالة الحصول على الـ IP (مع معالجة الـ Timeout)
export async function getClientIP(): Promise<string> {
  try {
    // استخدمنا fetch مع timeout بسيط عشان لو الموقع واقع ميعلقش الصفحة
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 4000); // 4 ثواني كفاية

    const response = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(id);
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('IP Fetch failed, using fallback');
    return '0.0.0.0'; // Fallback
  }
}

// دالة التحقق (اللوجيك الأهم)
export async function checkDeviceChange(userId: string): Promise<{ 
  changed: boolean; 
  oldFingerprint: string | null; 
  newFingerprint: string; 
  oldIp: string | null; 
  newIp: string 
}> {
  // 1. نجيب البصمة الحالية والـ IP الحالي
  const newFingerprint = await generateBrowserFingerprint();
  const newIp = await getClientIP();

  // 2. نجيب اللي متخزن في المتصفح
  const oldFingerprint = localStorage.getItem(`fp_${userId}`);
  const oldIp = localStorage.getItem(`ip_${userId}`);

  // 3. المنطق:
  // لو مفيش بصمة قديمة -> ده أول دخول (مش تغيير جهاز)
  // لو البصمة اختلفت أو الـ IP اختلف -> يبقى فيه تغيير
  let changed = false;
  if (oldFingerprint && oldFingerprint !== newFingerprint) {
    changed = true;
  }
  
  // ملحوظة: الـ IP ممكن يتغير لو المستخدم فتح Data أو الراوتر رستر 
  // فلو عايز تخليك "حنين" شوية، ركز على الـ Fingerprint أكتر من الـ IP

  return {
    changed,
    oldFingerprint,
    newFingerprint,
    oldIp,
    newIp
  };
}

// دالة الحفظ
export async function saveDeviceFingerprint(userId: string) {
  const fingerprint = await generateBrowserFingerprint();
  const ip = await getClientIP();
  
  localStorage.setItem(`fp_${userId}`, fingerprint);
  localStorage.setItem(`ip_${userId}`, ip);
  
  return { fingerprint, ip };
}