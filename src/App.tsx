import React from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// 1. هنعمل كومبوننت الصيانة السريع ده
function MaintenancePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', backgroundColor: '#111', color: '#fff' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '10px' }}>🔧 لوفيا في وضع صيانة مؤقت</h1>
      <p style={{ fontSize: '1.2rem', color: '#888' }}> راجعين أقوى بكتير! 😉</p>
    </div>
  );
}

function App() {
  // 2. غير دي لـ true عشان تقفل الموقع، ولما تخلص شغل رجعها false
  const isMaintenanceMode = true; 

  if (isMaintenanceMode) {
    return <MaintenancePage />;
  }

  return (
    // الأكواد والـ Routes القديمة بتاعتك زي ما هي هنا مش هتتمسح
    <Router>
      <Routes>
        {/* ... Routes لوفيا الأصلية ... */}
      </Routes>
    </Router>
  );
}

export default App;