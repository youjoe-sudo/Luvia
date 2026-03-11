// دالة لإنشاء بصمة المتصفح
// Function to create browser fingerprint
export async function generateBrowserFingerprint(): Promise<string> {
  const components: string[] = [];

  // معلومات المتصفح الأساسية
  // Basic browser information
  components.push(navigator.userAgent);
  components.push(navigator.language);
  components.push(String(navigator.hardwareConcurrency || 0));
  components.push(String((navigator as any).deviceMemory || 0));
  components.push(String(screen.width));
  components.push(String(screen.height));
  components.push(String(screen.colorDepth));
  components.push(String(new Date().getTimezoneOffset()));

  // معلومات Canvas
  // Canvas fingerprinting
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Luvia Platform', 2, 15);
      components.push(canvas.toDataURL());
    }
  } catch (e) {
    components.push('canvas-error');
  }

  // معلومات WebGL
  // WebGL information
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl && gl instanceof WebGLRenderingContext) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        components.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
        components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
      }
    }
  } catch (e) {
    components.push('webgl-error');
  }

  // معلومات الخطوط المتاحة
  // Available fonts detection
  const fonts = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Palatino', 'Garamond', 'Comic Sans MS', 'Trebuchet MS', 'Impact'];
  const availableFonts = fonts.filter(font => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.font = `12px ${font}`;
    const width = ctx.measureText('mmmmmmmmmmlli').width;
    ctx.font = '12px monospace';
    const defaultWidth = ctx.measureText('mmmmmmmmmmlli').width;
    return width !== defaultWidth;
  });
  components.push(availableFonts.join(','));

  // معلومات الإضافات
  // Plugins information
  const plugins = Array.from(navigator.plugins || [])
    .map(p => p.name)
    .sort()
    .join(',');
  components.push(plugins);

  // دمج جميع المكونات وإنشاء hash
  // Combine all components and create hash
  const fingerprint = await hashString(components.join('|||'));
  return fingerprint;
}

// دالة لإنشاء hash من نص
// Function to create hash from string
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// دالة للحصول على عنوان IP (يتطلب خدمة خارجية)
// Function to get IP address (requires external service)
export async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error getting IP:', error);
    return 'unknown';
  }
}

// دالة لحفظ بصمة الجهاز عند أول تسجيل دخول
// Function to save device fingerprint on first login
export async function saveDeviceFingerprint(userId: string): Promise<{ fingerprint: string; ip: string }> {
  const fingerprint = await generateBrowserFingerprint();
  const ip = await getClientIP();
  
  // حفظ في localStorage للمقارنة المستقبلية
  // Save in localStorage for future comparison
  localStorage.setItem('device_fingerprint', fingerprint);
  localStorage.setItem('device_ip', ip);
  
  return { fingerprint, ip };
}

// دالة للتحقق من تغيير الجهاز
// Function to check if device changed
export async function checkDeviceChange(): Promise<{ changed: boolean; oldFingerprint: string | null; newFingerprint: string; oldIp: string | null; newIp: string }> {
  const oldFingerprint = localStorage.getItem('device_fingerprint');
  const oldIp = localStorage.getItem('device_ip');
  
  const newFingerprint = await generateBrowserFingerprint();
  const newIp = await getClientIP();
  
  const changed = oldFingerprint !== null && (oldFingerprint !== newFingerprint || oldIp !== newIp);
  
  return {
    changed,
    oldFingerprint,
    newFingerprint,
    oldIp,
    newIp
  };
}
